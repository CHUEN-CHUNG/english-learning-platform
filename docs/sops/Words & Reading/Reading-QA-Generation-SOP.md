# Reading & Star QA Generation SOP (閱讀與星星互動題產出標準作業流程)

## 與產品規格書的關係

- **本 SOP**：觸發條件、執行順序、產出檔名與路徑、**Star QA**（本 SOP 獨有段落）。
- **閱讀測驗細節**（通則 CSV 檔名、欄位定義、完整 AI Prompt、**reading-practice 網址參數與載入路徑**）：以 [`apps/reading-practice/docs/Reading-Question-Rule.md`](../../../apps/reading-practice/docs/Reading-Question-Rule.md) 為準。  
- 兩份文件**刻意分開**：SOP 給「流程與交付物」；Rule 給「規格與前端行為」。維護時改欄位或改 UI 以 Rule 為主；改「誰先做什麼」以 SOP 為主。

## 📌 目的 (Purpose)
當 PM 或內容建立者新增了一篇新的閱讀文章（例如 `YLE-3.pdf` 或 `YLE-3-Article.md`）時，AI 助理應根據此 SOP 自動完成「閱讀測驗 (Reading QA)」與「星星互動題 (Star QA)」的題庫生成。

## 🚀 觸發條件 (Trigger)
使用者上傳新文章檔案，並對 AI 說：「我新增了 YLE-X，請幫我產出閱讀題與星星題」或類似指令。

## 🛠️ 執行步驟 (Execution Steps)

### Step 1: 讀取與理解文章 (Read the Article)
1. AI 使用 `Read` 工具讀取目標文章（例如 `content/Article/YLE-3/YLE-3-Article.md`）。
2. 若使用者提供的是 PDF，AI 需先 `@Article-Markdown-Generation-SOP.md` ，協助將其轉換或讀取為文字格式，並按段落 (Paragraph 1, 2, 3...) 劃分清楚。

### Step 2: 產出閱讀測驗題庫 (Generate Reading QA)
1. **參考規則**：讀取出題通則 CSV（專案中常見檔名如 `YLEReading-Rule-Detail-Full.csv`／`YLEReading-Rule.csv`，以實際路徑為準）並遵守 [`Reading-Question-Rule.md`](../../../apps/reading-practice/docs/Reading-Question-Rule.md) 之欄位與 Prompt。
2. **出題數量**：針對文章的**每一個段落**，嚴格依照規則產出 **10 題** 選擇題。
3. **欄位格式**：
   `Question_ID,Paragraph,Type,Question_Text,Option_A,Option_B,Option_C,Option_D,Answer,Explanation`
4. **儲存路徑**：將結果寫入 `content/ReadingQA/YLE-X-ReadingQA.csv`。

### Step 3: 產出星星互動題庫 (Generate Star QA / Action Time)
1. **題型定義**：TPR (全身反應教學法) 的情境小指令，讓學生跟著做動作。
2. **出題數量**：針對文章的**每一個段落**，設計 **2~3 題** 互動指令。
3. **設計原則**：
   - 必須與該段落的故事情境、角色情緒或出現的物品高度相關。
   - 僅需包含英文指令 (`Command_En`)，不需中文輔助說明。
4. **欄位格式**：
   `Question_ID,Paragraph,Type,Command_En`
   *(Type 固定填入 `STAR`)*
5. **儲存路徑**：將結果寫入 `content/ReadingQA/YLE-X-StarQA.csv`。

### Step 4: 產出文章摘要填空題庫 (Generate Summary QA)
1. **題型定義**：將該單元 `Dictionary.csv` 中的所有單字，透過造句的方式撰寫成每一段落的摘要，並將目標單字挖空作為填空題。
2. **設計原則**：
   - 以 `Article.md` 為文章資料來源，`Dictionary.csv` 為填空單字參考。
   - 每個段落產生一到兩句摘要，摘要需精準濃縮該段落的核心情節。
   - **必須**使用到該單元字典中的「所有」原始單字。若單字為動詞，造句時可以使用片語或時態變化，但填空目標仍為原始單字。
3. **欄位格式**：
   `Paragraph,Summary_Text,Target_Words`
   - `Summary_Text`: 摘要內容，請將要填空的單字用大括號 `{}` 包起來（例如：`Emma sat on the beach when a {friendly} boy stood in {front} of her.`）。
   - `Target_Words`: 該段落所對應的原始單字列表，用逗號分隔，**不可含有空格**（例如：`friendly,front`）。這必須用雙引號包起來，以符合 CSV 格式。
4. **儲存路徑**：將結果寫入 `content/ReadingQA/YLE-X-SummaryQA.csv`。

### Step 5: 回報完成 (Report Completion)
向使用者回報三個 CSV 檔案 (ReadingQA, StarQA, SummaryQA) 已成功建立，並提醒使用者可以重整網頁測試新單元。