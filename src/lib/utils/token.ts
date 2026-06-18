const TOKEN_STORAGE_KEY = 'elp_access_token';

export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * 依 URL token 或 localStorage 驗證存取權限。
 * 網址有 token 且驗證成功時會寫入 localStorage；刷新後改以 localStorage 驗證。
 */
export async function authorizeAccess(
  urlToken: string | null,
  secret: string
): Promise<{ authorized: boolean; message: string }> {
  if (urlToken) {
    const urlValid = await verifyToken(urlToken, secret);
    if (urlValid) {
      storeToken(urlToken);
      return { authorized: true, message: '' };
    }
  }

  const storedToken = getStoredToken();
  if (!storedToken) {
    return { authorized: false, message: '缺少存取權杖 (Missing Token)' };
  }

  const storedValid = await verifyToken(storedToken, secret);
  if (storedValid) {
    return { authorized: true, message: '' };
  }

  clearStoredToken();
  return { authorized: false, message: '無效或已過期的存取權杖 (Invalid or Expired Token)' };
}

/**
 * 驗證並解密 token
 *
 * @param token Base64URL 編碼的 token
 * @param secret 來自環境變數的 VITE_TOKEN_SECRET
 * @returns 是否驗證成功且未過期
 */
export async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    // 1. 將 base64url 轉回一般的 base64，然後解碼
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const raw = atob(base64);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      buffer[i] = raw.charCodeAt(i);
    }

    // 格式確認: 至少要有 iv(12) + authTag(16)
    if (buffer.length < 28) return false;

    // Node.js 產生時的順序為：iv + authTag + ciphertext
    const iv = buffer.slice(0, 12);
    const authTag = buffer.slice(12, 28);
    const ciphertext = buffer.slice(28);

    // Web Crypto API 預期的格式是：ciphertext + authTag
    const dataToDecrypt = new Uint8Array(ciphertext.length + authTag.length);
    dataToDecrypt.set(ciphertext, 0);
    dataToDecrypt.set(authTag, ciphertext.length);

    // 2. 使用 SHA-256 從 secret 導出 32-byte 的 key (與後端邏輯一致)
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
    
    // 匯入 AES-GCM 金鑰
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 3. 進行解密
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      dataToDecrypt
    );

    // 4. 解析 Payload
    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(decryptedBuffer));

    // 5. 檢查是否過期
    if (!payload.exp || Date.now() > payload.exp) {
      console.warn('Token 已過期');
      return false;
    }

    return true; // 成功驗證且未過期
  } catch (e) {
    console.error('Token 驗證失敗', e);
    return false;
  }
}
