# Synonyms and Antonyms - English Learning AI

這是一個幫助使用者學習英文同義詞（Synonyms）與反義詞（Antonyms）的靜態網頁應用程式。

## 🛠 技術堆疊 (Tech Stack)

- **核心語言**: HTML, TypeScript (純 TS, 無框架)
- **樣式**: SCSS (Sass)
- **打包工具**: Vite

## 📁 專案結構 (Project Structure)

本專案依照**功能**進行分類，並細分為各個單元：

- `data/` - 原始資料與圖片
  - `pdfs/` (各單元 PDF 檔)
  - `raw_text/` (OCR 或擷取的原始文字檔)
  - `images/` (擷取的圖片)
- `content/` - 文章與內容
  - `YLE-1/`, `YLE-2/`, `YLE-3/` (各單元的 Markdown 文章)
  - `general/` (共用或跨單元的文章資料)
- `vocabulary/` - 單字庫 CSV
  - `YLE-2/`, `YLE-3/` (各單元的單字表)
  - `general/` (共用的單字表)
- `scripts/` - Python 腳本 (資料處理、圖片擷取等)
- `src/` - 前端原始碼 (TypeScript, SCSS)
- `index.html` - 應用程式的進入點

## 🔗 網站連結 (Website Links)

啟動本地伺服器 (`npm run dev`) 後，您可以透過以下連結存取不同單元的測驗：

- **YLE-1**: [http://localhost:5173/?unit=unit1](http://localhost:5173/?unit=unit1)
- **YLE-2**: [http://localhost:5173/?unit=unit2](http://localhost:5173/?unit=unit2)
- **YLE-3**: [http://localhost:5173/?unit=unit3](http://localhost:5173/?unit=unit3)

## 🚀 快速開始 (Getting Started)

請確保您的電腦上已經安裝了 [Node.js](https://nodejs.org/)。

### 1. 安裝依賴套件

在專案根目錄下開啟終端機，執行以下指令安裝所需的套件（包含 Vite 與 Sass）：

```bash
npm install
```

### 2. 啟動開發伺服器

執行以下指令來啟動本地開發伺服器：

```bash
npm run dev
```

啟動後，終端機會顯示一個本地網址（通常是 `http://localhost:5173/`）。在瀏覽器中開啟該網址即可預覽網頁。Vite 支援熱更新（HMR），當您修改 `.ts` 或 `.scss` 檔案並存檔時，瀏覽器畫面會自動即時更新。

### 3. 打包發布 (Production Build)

當您準備好要將網站部署到正式環境時，請執行以下指令進行打包：

```bash
npm run build
```

Vite 會將編譯與最佳化後的靜態檔案輸出到 `dist` 資料夾中。您可以將該資料夾內的檔案部署到任何靜態網頁代管服務（如 GitHub Pages, Vercel, Netlify 等）。

如果您想在本地預覽打包後的結果，可以執行：

```bash
npm run preview
```

## 📄 規格與實作備註

- 遊戲互動、版面與連線規則：見同目錄下的 [`FEATURE.md`](FEATURE.md)、上層需求見 [`PRD.md`](PRD.md)。
- **中間單字翻面（SCSS）**：若修改 `src/style.scss` 中中欄卡片的 `:hover` / `transform`，請一併閱讀 [`FEATURE.md`](FEATURE.md) **第 6 節**，避免 `:hover` 的 `transform` 蓋掉 `rotateY` 導致點擊後須移開滑鼠才翻面。
- **分頁鎖定（TypeScript）**：鎖定須依「該頁是否已點擊過字卡」判斷，不可僅依是否已有連線；見 [`FEATURE.md`](FEATURE.md) **第 7 節**。

## 📝 未來功能規劃

- [ ] 整合 AI API 以動態生成同義詞與反義詞。
- [ ] 實作測驗與練習模式。
- [ ] 增加單字發音功能。
