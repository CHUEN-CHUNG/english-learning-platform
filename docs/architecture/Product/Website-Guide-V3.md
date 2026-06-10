# 網站與單字生成器執行指南 V3 (Website Guide - V3 Architecture)

這份指南將引導您如何在本地環境中同時運行「單字生成器後端」與「Vite 遊戲前端」。本指南已更新至最新的雙區塊 (Reading & Grammar) 架構。

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
2. 平台首頁已重構為三大區塊：**閱讀 (Reading)**、**文法 (Grammar)** 與 **教師專用 (Teacher Zone)**。

### 閱讀大廳 (Reading Hub)
1. 從首頁點擊「開始閱讀 (Start Reading)」，進入閱讀大廳：[http://localhost:5173/apps/reading-hub/index.html](http://localhost:5173/apps/reading-hub/index.html)
2. 在大廳中，您可以選擇不同的程度（目前以 YLE Flyers 為主）。
3. 點擊對應單元（如 Unit 1），您可以進行以下操作：
   - **同反義詞連連看**：點擊展開下拉選單，選擇「全文章」或特定段落進行練習。
   - **閱讀練習**：點擊展開下拉選單，選擇「全文章」或特定段落進行閱讀理解。
   - **課堂講義下載**：下載依據 SOP 自動生成的 PDF 課堂講義。若系統偵測不到檔案，按鈕將反灰並顯示「教材準備中」。
   - **例句重組測驗下載**：下載依據 SOP 自動生成的 PDF 測驗卷。若系統偵測不到檔案，按鈕將反灰並顯示「教材準備中」。
   - **單字總測驗**：進入該單元的聽寫與拼字總測驗。

### 文法大廳 (Grammar Hub)
1. 從首頁點擊「進入文法大廳」，前往：[http://localhost:5173/apps/grammar-hub/index.html](http://localhost:5173/apps/grammar-hub/index.html)
2. 選擇文法主題，進行填空、重組、挑錯挑戰與時態漫畫閱讀。
*(註：魔法文法海報編輯器目前預設隱藏，未來視需求開啟)*

### 教師大廳 (Teacher Hub)
1. 從首頁點擊「進入教師大廳」，會要求輸入密碼（預設：`admin`）。
2. 進入後，可點擊各遊戲的數據按鈕，系統會直接開啟該遊戲，教師可透過隱藏操作（如連點標題 5 次）查看學生成績。
3. 另有講義下載成效追蹤與問卷回復功能（開發中）。

### 使用單字遊戲生成器
1. 從首頁「教師專用」區塊，或教師大廳上方點擊「單字遊戲生成器」，前往：[http://localhost:5173/public/generator.html](http://localhost:5173/public/generator.html)
2. 在表單中輸入：
   - **考試名稱** (例如：`YLE-3-Bryan`)
   - **考試單字表** (上傳您的 CSV 檔案)
   - **文章檔案** (上傳您的 PDF 或 Markdown 檔案)
3. 點擊「開始生成」。
4. 處理完成後，畫面會顯示成功訊息，並提供一個「前往遊戲」的按鈕。生成的檔案會存放在 `public/` 資料夾下，並可供閱讀大廳使用。

## 常見問題

- **無法連接到伺服器**：請確認 `python tools/server.py` 是否有正確執行，且運行在 8000 port。
- **PDF 解析失敗**：請確認系統是否已安裝 Tesseract OCR，因為 PDF 解析腳本使用了 `pytesseract`。
- **生成的 CSV 沒出現在遊戲中**：請確認後端終端機是否有報錯，生成的檔案會被存放在 `public/[ExamName]-Word.csv`，Vite 會自動提供該檔案。
- **找不到腳本或模組錯誤**：由於資料夾重構，若後端生成發生路徑錯誤，請確認 `tools/server.py` 內的腳本呼叫路徑是否已更新。
- **無法下載講義或測驗 PDF**：請確認是否已透過 `Handout-Generation-SOP.md` 與 `Phrase-Reorganization-SOP.md` 的流程生成對應單元的 PDF 檔案，並放置於 `content/handouts/` 的正確路徑下。
