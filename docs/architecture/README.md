# 英文單字互動測驗 (Word Exam)

這是一個基於 HTML、JavaScript 和 Tailwind CSS 的互動式英文單字測驗網頁應用程式。

## 功能特色

- **動態讀取 Excel 題庫**：透過 URL 參數 `?unit=X` 動態載入對應單元的單字表（例如：`vocabulary/YLE-1/YLE-1-Bryan.xlsx`）。
- **兩階段測驗**：
  1. **定義填空**：根據英文解釋（Definition）填寫對應的單字。
  2. **例句填空**：根據英文例句（Example-English）的上下文，填入被挖空的單字。
- **寬容比對**：答案輸入不區分大小寫（Case-insensitive），且會自動忽略多餘的空白字元。
- **進度記憶**：支援隨時切換「上一題」或「下一題」，系統會自動保留已輸入的答案。
- **成績結算**：完成兩階段測驗後，系統會自動計算並顯示各階段得分及總分。

## 如何執行

由於瀏覽器的安全性限制（CORS），直接雙擊打開 HTML 檔案可能無法讀取本地的 Excel 檔案。請使用本地伺服器來開啟：

### 推薦方式：使用 VS Code / Cursor 的 Live Server
1. 在編輯器中安裝 **Live Server** 擴充功能。
2. 對 `index.html` 點擊右鍵，選擇 **"Open with Live Server"**。
3. 在瀏覽器網址列後方加上參數，例如：`http://127.0.0.1:5500/index.html?unit=1`。

### 其他方式：使用 Python 內建伺服器
如果您有安裝 Python，可以在終端機執行以下指令：
```bash
python -m http.server 8000
```
然後在瀏覽器開啟：`http://localhost:8000/index.html?unit=1`

## 目錄結構

- `index.html`：測驗主程式。
- `vocabulary/`：存放題庫 Excel 檔案的資料夾。
  - `YLE-1/`
    - `YLE-1-Bryan.xlsx`：單元 1 的題庫檔案。
