# English Learning Platform

這是一個基於 Svelte 5 + TypeScript 的英語學習平台。

## 專屬連結與存取權限控管

為了保護平台內容（防止提早外洩或未經授權的存取），我們實作了**帶有有效期限的加密 URL Token 驗證機制**。因為專案部署在 GitHub Pages（純靜態網頁），我們採用了前端 AES-256-GCM 解密與驗證的架構。

### 1. 本地開發設定 (`.env`)

在開發與產生網址前，請在專案根目錄建立 `.env` 檔案，並填入以下內容：

```env
# 控制是否要在本地開發時關閉權限驗證 (true: 關閉驗證，可直接瀏覽 / false: 開啟驗證)
VITE_DISABLE_AUTHORIZATION="false"

# 負責加密 Token 的金鑰 (必須為機密字串，產生腳本與前端解密皆依賴此金鑰)
VITE_TOKEN_SECRET="my_super_secret_key_2026"

# 產生網址時會對應的主網域
DOMAIN_PATH="https://chuen-chung.github.io/english-learning-platform"
```

### 2. 產生有期限的專屬連結

當你想要發布網址給學生，且希望該網址有「有效期限」時，請在終端機執行以下指令：

```bash
npm run generate-link
```

執行後，腳本會提示你輸入：
1. **passphrase (密碼混淆)**: 學生不需輸入，純粹用來增加加密雜湊的複雜度。
2. **有效期限 (小時)**: 該網址多久後會失效。

腳本執行完畢後，會輸出帶有 `?token=` 參數的完整網址，類似：
`https://chuen-chung.github.io/english-learning-platform?token=...`

將這個網址提供給學生即可。學生若在期限後點擊，將會看到「存取被拒」的畫面。

### 3. GitHub Pages 部署設定 (重要！)

因為這個專案部署在 GitHub Pages，GitHub Action 在進行 `npm run build` 打包時，必須將這把金鑰注入到前端的靜態檔案中，才能進行解密驗證。

請務必在 GitHub 網站上完成以下設定：

1. 進入你的 GitHub Repository 頁面。
2. 點擊 **Settings** -> 左側欄 **Secrets and variables** -> **Actions**。
3. 點擊 **New repository secret** 新增以下兩個 Secrets：
   * `VITE_TOKEN_SECRET`：填入與你 `.env` 相同的金鑰字串。
   * `VITE_DISABLE_AUTHORIZATION`：填入 `false`（如果想要臨時全面開放，可改為 `true`）。

只要設定好 Secrets，往後推上代碼，GitHub Actions 都會自動抓取並完成安全的靜態部署。
