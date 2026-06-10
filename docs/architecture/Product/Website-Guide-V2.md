# 網站與單字生成器執行指南 (Website Guide - New Architecture)

這份指南將引導您如何在本地環境中同時運行「單字生成器後端」與「Vite 遊戲前端」。本指南已更新至最新的多應用 (Monorepo) 架構。

## 系統需求

- **Python 3.8+**
- **Node.js 16+** (建議)

---

## 1. 啟動後端伺服器 (FastAPI)

後端伺服器負責接收上傳的檔案，並依序執行 Python 腳本，最後將生成的單字 CSV 存入 `public/` 資料夾中。

### 安裝依賴套件

請在專案根目錄開啟終端機，執行以下指令安裝所需的 Python 套件：

```bash
pip install fastapi uvicorn python-multipart PyMuPDF pytesseract Pillow
```

> **注意**：`PyMuPDF` (fitz)、`pytesseract` 和 `Pillow` 是 PDF 解析腳本所需要的依賴。

### 啟動伺服器

執行以下指令啟動 FastAPI 伺服器：

```bash
python tools/server.py
```

伺服器啟動後，將會在 `http://localhost:8000` 運行。

---

## 2. 啟動前端伺服器 (Vite)

前端包含原本的遊戲介面，以及我們新建立的單字生成器網頁。

### 安裝依賴套件

請開啟**另一個新的終端機**，確保在專案根目錄下，執行：

```bash
npm install
```

### 啟動開發伺服器

執行以下指令啟動 Vite：

```bash
npm run dev
```

Vite 預設會運行在 `http://localhost:5173` (實際埠號請參考終端機輸出)。

---

## 3. 使用單字生成器與遊戲平台

### 進入平台首頁
1. 開啟瀏覽器，前往：[http://localhost:5173/](http://localhost:5173/)
2. 這裡可以導覽至所有的遊戲與工具（包含測驗區、文法大廳、閱讀練習等）。

### 使用單字生成器
1. 從首頁點擊「單字遊戲生成器」，或直接前往：[http://localhost:5173/public/generator.html](http://localhost:5173/public/generator.html)
2. 在表單中輸入：
   - **考試名稱** (例如：`YLE-3-Bryan`)
   - **考試單字表** (上傳您的 CSV 檔案)
   - **文章檔案** (上傳您的 PDF 或 Markdown 檔案)
3. 點擊「開始生成」。
4. 處理完成後，畫面會顯示成功訊息，並提供一個「前往遊戲」的按鈕。
5. 生成的檔案會存放在 `public/` 資料夾下，您可以前往各個遊戲 (如單字測驗、同義詞遊戲) 並透過網址參數載入，例如：
   - 同義詞遊戲：`http://localhost:5173/apps/synonyms-game/index.html?unit=YLE-3-Bryan`
   - 單字測驗：`http://localhost:5173/apps/vocabulary-quiz/index.html?unit=YLE-3-Bryan`
   - 打地鼠文法選擇：`http://localhost:5173/apps/grammar-games/multiple-choice-fast/index.html?unit=Present-Simple-Choice`
   - 火車文法重組：`http://localhost:5173/apps/grammar-games/unscramble/index.html?unit=Present-Simple-Unscramble`

## 常見問題

- **無法連接到伺服器**：請確認 `python tools/server.py` 是否有正確執行，且運行在 8000 port。
- **PDF 解析失敗**：請確認系統是否已安裝 Tesseract OCR，因為 PDF 解析腳本使用了 `pytesseract`。
- **生成的 CSV 沒出現在遊戲中**：請確認後端終端機是否有報錯，生成的檔案會被存放在 `public/[ExamName]-Word.csv`，Vite 會自動提供該檔案。
- **找不到腳本或模組錯誤**：由於資料夾重構，若後端生成發生路徑錯誤，請確認 `tools/server.py` 內的腳本呼叫路徑是否已更新。
