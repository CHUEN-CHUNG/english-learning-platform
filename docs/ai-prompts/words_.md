# 資料夾整理依功能與單元
_Exported on 4/10/2026 at 00:09:58 GMT+8 from Cursor (3.0.9)_

---

**User**

請依照功能以及單元協助整理資料夾

---

**Cursor**

我幫您檢視了目前的資料夾內容，發現有許多不同類型的檔案（PDF、Markdown 文章、CSV 單字表、Python 腳本、圖片等），並且包含了 YLE-1、YLE-2、YLE-3 等不同單元的資料。

為了讓專案結構更清晰，我為您規劃了兩種整理方案（結合了「功能」與「單元」），您可以選擇比較喜歡的一種：

### 方案一：以「功能 (Function)」為主，再依「單元 (Unit)」細分
這個方案適合您平常是依照「工作類型」（例如：現在要處理單字、現在要處理文章）來找檔案。

*   📂 **`data/` (原始資料與圖片)**
    *   `pdfs/` (YLE-1.pdf, YLE-2.pdf, YLE-3.pdf)
    *   `raw_text/` (raw_text.txt, raw_text_yle1.txt, raw_ocr.txt)
    *   `images/` (page1.png, page_0.png 等)
*   📂 **`content/` (文章與內容)**
    *   `YLE-1/` (YLE-1.md)
    *   `YLE-2/` (YLE-2-Article.md)
    *   `YLE-3/` (YLE-3-Article.md)
    *   `general/` (Article.md, Matching-data.md, word-picking.md)
*   📂 **`vocabulary/` (單字庫 CSV)**
    *   `YLE-2/` (YLE-2-Bryan.csv)
    *   `YLE-3/` (YLE-3-Bryan.csv, YLE-3-Article.csv)
    *   `general/` (Words.csv, Words-detail.csv, bryan-word.csv)
*   📂 **`scripts/` (Python 腳本)**
    *   add_one_word.py, extract_images.py, extract_text.py, parse.py

---

### 方案二：以「單元 (Unit)」為主，再依「功能 (Function)」細分
這個方案適合您平常是依照「課程單元」（例如：現在專心處理 YLE-2 的所有東西）來找檔案。

*   📂 **`YLE-1/`**
    *   YLE-1.pdf, YLE-1.md, raw_text_yle1.txt
*   📂 **`YLE-2/`**
    *   YLE-2.pdf, YLE-2-Article.md, YLE-2-Bryan.csv
*   📂 **`YLE-3/`**
    *   YLE-3.pdf, YLE-3-Article.md, YLE-3-Article.csv, YLE-3-Bryan.csv
*   📂 **`General_Data/` (跨單元或共用資料)**
    *   `articles/` (Article.md, Matching-data.md, word-picking.md)
    *   `vocabulary/` (Words.csv, Words-detail.csv, bryan-word.csv)
    *   `raw_data/` (raw_text.txt, raw_ocr.txt, page*.png)
*   📂 **`Scripts/` (Python 腳本)**
    *   add_one_word.py, extract_images.py, extract_text.py, parse.py

*(註：前端專案相關的檔案如 `src/`, `public/`, `package.json`, `index.html` 等會保留在根目錄不動，以確保網頁應用程式能正常執行。)*

請問您比較偏好 **方案一** 還是 **方案二**？或是您有其他特別的分類想法？確認後我會立刻幫您執行指令建立資料夾並移動檔案！

---

**User**

按照功能，網站連結也要新增上去

---

**Cursor**

我已經幫您將資料夾依照**「功能 (Function)」**進行分類，並且將各個單元的網站連結新增到 `README.md` 中了！

### 📁 目前的資料夾結構 (依功能分類)：
*   **`data/` (原始資料與圖片)**
    *   `pdfs/` (YLE-1.pdf, YLE-2.pdf, YLE-3.pdf)
    *   `raw_text/` (raw_text.txt, raw_text_yle1.txt, raw_ocr.txt)
    *   `images/` (page1.png 等)
*   **`content/` (文章與內容)**
    *   `YLE-1/`, `YLE-2/`, `YLE-3/` (各單元的 Markdown 文章)
    *   `general/` (共用或跨單元的文章資料)
*   **`vocabulary/` (單字庫 CSV)**
    *   `YLE-2/`, `YLE-3/` (各單元的單字表)
    *   `general/` (共用的單字表)
*   **`scripts/` (Python 腳本)**
    *   (add_one_word.py, extract_images.py, extract_text.py, parse.py)

### 🔗 網站連結 (已新增至 `README.md`)
當您啟動本地伺服器 (`npm run dev`) 後，可以透過以下連結直接存取不同單元的測驗：
*   **YLE-1**: [http://localhost:5173/?unit=unit1](http://localhost:5173/?unit=unit1)
*   **YLE-2**: [http://localhost:5173/?unit=unit2](http://localhost:5173/?unit=unit2)
*   **YLE-3**: [http://localhost:5173/?unit=unit3](http://localhost:5173/?unit=unit3)

如果您希望這些連結也能直接顯示在網頁首頁 (`index.html`) 上作為導覽選單，請隨時告訴我！

---

**User**

程式碼題庫位置跑掉了，請修正

---

**Cursor**

我已經幫您修正了程式碼中讀取題庫（CSV 檔案）的路徑了！

因為剛剛我們把所有的單字表都移動到了 `vocabulary/` 資料夾中（例如：`vocabulary/YLE-2/YLE-2-Bryan.csv`），但前端程式碼（`src/main.ts`）原本還在根目錄找 `../YLE-*-Bryan.csv`，所以會找不到資料。

我做了以下修正：
1. 將讀取路徑更新為 `../vocabulary/**/*-Bryan.csv`，讓程式能自動到新的 `vocabulary` 資料夾底下尋找題庫。
2. 調整了配對邏輯，讓程式在切換單元網址（例如 `?unit=unit2`）時，能正確對應並載入新路徑下的檔案。

您現在可以重新整理網頁，題庫應該就能正常顯示出來了！如果有任何其他問題，請隨時告訴我。

