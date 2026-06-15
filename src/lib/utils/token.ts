/**
 * 驗證並解密網址上的 token
 * 
 * @param token URL 上的 token 參數 (Base64URL)
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
