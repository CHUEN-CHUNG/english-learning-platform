# 單字與閱讀模組整合流程 (Word & Reading Workflow)

本文件定義了從「原始 PDF 檔案」到「生成遊戲與講義」的完整自動化與手動處理標準作業流程 (SOP)。

## 執行流程

### 1. 文章提取與排版 (PDF to Article) `[AI 生成]` `[Python 自動化]`
- **動作**：從圖片或掃描版 PDF 中擷取文章文字。
- **處理**：將擷取出的文字與原 pdf 檔比對，並根據文意與邏輯進行分段。詳細的 OCR 修復、碎片化處理與排版規範，請參考 `docs/sops/Words & Reading/Article-Markdown-Generation-SOP.md`。
- **產出**：建立 `{pdf檔名}-Article.md`。
- **儲存路徑**：`content/Article/{單元名稱}/{pdf檔名}-Article.md`


### 2. 文章單字全擷取 (Article Words Extraction) `[Python 自動化]`
- **動作**：擷取 `{pdf檔名}-Article.md` 文中的每一個單字，整理 `Word` (單字) 、 `Frequency` (出現次數) 與 `Paragraph` (段落) 欄位，以標示該單字出現在文章的第幾段，方便後續出題與講義對照。
- **產出**：建立 `{pdf檔名}-orgword.csv`。
- **儲存路徑**：`content/vocabulary/{單元名稱}/{pdf檔名}-orgword.csv`


### 3. 目標單字比對與篩選 (Word Matching) `[AI 生成]`
- **動作**：將 `{pdf檔名}-orgword.csv` 中的單字，與目標單字庫 `content/vocabulary/Test-Word/Words-select.csv` 中的原始單字進行比對。
- **處理**：挑選出重疊或與文章內容高度相關的目標單字，篩出來的單字需與前面的單字檔進行篩選，出現在前面單字檔的單字則不可被挑選。(例如 YLE-1 的單字不可出現在 YLE-2 中)。
  單字挑選完成後，每個單字生成包含同義詞、反義詞、例句與難度分級的 17 個詳細欄位。詳細的欄位定義、難度一致性規則與編碼要求，請參考 `docs/sops/Words & Reading/Dictionary-Generation-SOP.md`。
- **產出**：建立 `{pdf檔名}-Dictionary.csv`，作為該單元遊戲與講義的**唯一核心單字庫 (Single Source of Truth)**。
- **儲存路徑**：`content/vocabulary/{單元名稱}/{pdf檔名}-Dictionary.csv`


### 3.5 教材編輯人工審核 (QA Gate) `[人工審核]` ⚠️
- **動作**：教材編輯或教師必須手動開啟 `{pdf檔名}-Dictionary.csv` 進行審核。
- **處理**：
  - 檢查 AI 生成的中文解釋、同義詞、反義詞是否精準且符合學生程度。
  - 檢查例句是否通順、有無語病或不合邏輯的內容。
  - 確認所有欄位格式正確無誤。
- **放行條件**：確認無誤後存檔，才能繼續執行後續的 Step 4 ~ Step 8。若此步驟資料錯誤，後續所有遊戲與講義皆會產出錯誤內容 (Garbage in, garbage out)。


### 4. 同義詞反義詞遊戲串接 (Synonyms Game) `[前端渲染]`
- **動作**：以 `{pdf檔名}-Dictionary.csv` 為唯一資料庫。
- **處理**：前端程式直接讀取 CSV 內容作為遊戲資料來源。**嚴禁在此階段讓 AI 重新生成單字、同義詞或例句內容**，以確保資料一致性。
- **產出**：確保 `apps/synonyms-game/` 能正確讀取該單元的 Dictionary.csv 並渲染遊戲。


### 5. 課堂講義生成 (Class Handout Generation) `[Python 自動化]`
- **動作**：以 `{pdf檔名}-Dictionary.csv` 為核心資料庫，結合 `{pdf檔名}-Article.md` 的標題。
- **處理**：程式自動讀取 CSV 中的單字、同反義詞與例句，排版生成提供給學生的實體/數位講義（上半部為單字講義，下半部為例句重組測驗）。詳細的需求規格與版型定義請參考 `docs/sops/Words & Reading/Handout.md`。
- **產出**：建立 `{pdf檔名}-Handout.md`。若需轉為 PDF 供列印，請參考 SOP 中的「MD 轉 PDF 轉換流程」。
- **儲存路徑**：`content/handouts/Handout/{單元名稱}/{pdf檔名}-Handout.md`

### 6. 單字總測驗 (Vocabulary Quiz) `[前端渲染]`
- **動作**：以 `{pdf檔名}-Dictionary.csv` 為唯一資料庫。
- **處理**：前端程式直接讀取 CSV 內容。根據 `apps/vocabulary-quiz/docs/Word-Final-Exam.md` 的規則與防呆檢查清單，進行單字填空測驗渲染。**嚴禁在此階段重新生成單字內容**。
- **產出**：確保 `apps/vocabulary-quiz/` 能正確讀取該單元的 Dictionary.csv 並渲染測驗。


### 7. 閱讀測驗遊戲生成 (Reading Game) `[AI 生成]`
- **動作**：以 `{pdf檔名}-Article.md` 為閱讀文本，並**強制參考** `{pdf檔名}-Dictionary.csv`。
- **處理**：
  - 根據 `apps/reading-practice/docs/Reading-Question-Rule.md` 的出題規範，以及 `apps/reading-practice/docs/YLEReading-Rule.csv` 的題型通則進行出題。
  - **核心單字連動 (Lexical Recycling)**：AI 出題時，必須優先針對包含 `{pdf檔名}-Dictionary.csv` 核心單字的句子進行閱讀理解出題，確保學生能透過閱讀測驗再次複習重點單字。
- **產出**：建立 `{pdf檔名}-ReadingQA.csv`。
- **儲存路徑**：`content/ReadingQA/{pdf檔名}-ReadingQA.csv`
