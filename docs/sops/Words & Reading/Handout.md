# 課堂講義生成技術規格與執行流程 (Class Handout Generation SOP)

> **文件狀態**: 正式版 (v1.1)
> **目標讀者**: TPM (技術專案經理)、TL (技術負責人)、自動化腳本開發者

## 1. 專案概述 (Project Overview)
本模組旨在將經人工審核後的單字資料庫 (`Dictionary.csv`)，透過自動化腳本轉換為格式統一、適合列印與數位閱讀的課堂講義。包含兩部分：
1. **單字講義 (Vocabulary Handout)**：包含單字、詞性、英文解釋、同反義詞、片語與例句。
2. **例句重組講義 (Phrase Sentence Reorganization)**：從資料庫提取片語與例句，生成供學生練習「句子重組 (Unscramble)」的講義，幫助學生熟悉單字搭配 (Collocation) 與英文句型結構。

- **目標受眾**: 國小 (YLE) 及國高中生。
- **使用情境**: 學生回家作業與課後複習。
- **核心原則 (Single Source of Truth)**: 講義內容必須 100% 繼承自 `Dictionary.csv`，嚴禁在此階段使用 AI 重新生成內容，以確保教學資料的一致性 (Data Consistency)。

---

## 2. 系統架構與資料流 (System Architecture & Data Flow)

### 2.1 輸入 (Input)
- **資料來源**: `content/vocabulary/{單元名稱}/{pdf檔名}-Dictionary.csv`
- **文章標題**: 來自 `content/Article/{單元名稱}/{pdf檔名}-Article.md` 的大標題 (H1) (用於例句重組講義)。
- **編碼格式**: UTF-8 with BOM (確保中文不亂碼)

### 2.2 處理 (Processing)
- **執行腳本**: `scripts/generate_handout.py`
- **技術選型 (Tech Stack)**: Python (內建 `csv`, `os`, `argparse`, `pathlib`, `re`, `random` 模組，無外部依賴)
- **處理邏輯**: 讀取 CSV 每一列 (Row)，進行空值檢查與例外處理後，依據預設的 Markdown 模板進行字串拼接。上半部生成單字講義，下半部生成例句重組講義，中間以分頁符號 (`<div class="page-break"></div>`) 隔開。

### 2.3 輸出 (Output)
- **產出格式**: Markdown (`.md`)，後續由人工或工具轉為 A4 尺寸 PDF。
- **儲存路徑**: `content/handouts/Handout/{單元名稱}/`
- **檔案命名**: `{pdf檔名}-Handout.md` / `{pdf檔名}-Handout.pdf`

---

## 3. 單字講義 (Vocabulary Handout) 規範

### 3.1 欄位對應與資料處理邏輯
腳本必須從 `Dictionary.csv` 提取以下欄位，並對應至講義版面：

| CSV 來源欄位 (Source Field) | 講義呈現標籤 (Target Label) | 處理邏輯與例外處理 (Edge Cases) |
| :--- | :--- | :--- |
| `Word` | **[單字]** | 必填。若為空值則跳過該列 (Skip row)。 |
| `POS` | `(詞性)` | 必填。直接串接於單字後方。 |
| `Definition` | `> [英文解釋]` | 若有值，以 Markdown 引用區塊 (`>`) 呈現。 |
| `Synonym-English 1`<br>`Synonym-Chinese 1`<br>`Synonym-English 2`<br>`Synonym-Chinese 2` | `- **Synonym**: [En1] ([Ch1]) 、 [En2] ([Ch2])` | 將所有有效的同義詞合併顯示。若皆為空值、"無" 或 "none"，則輸出 `- **Synonym**: 沒有同義詞`。 |
| `Antonym-English 1`<br>`Antonym-Chinese 1`<br>`Antonym-English 2`<br>`Antonym-Chinese 2` | `- **Antonym**: [En1] ([Ch1]) 、 [En2] ([Ch2])` | 將所有有效的反義詞合併顯示。若皆為空值、"無" 或 "none"，則輸出 `- **Antonym**: 沒有反義詞`。 |
| `Phrase` | `- **Phrase**: [Phrase]` | 若為空值、"無" 或 "none"，則輸出 `- **Phrase**: 沒有片語`。 |
| `Example-English 2`<br>`Example-Chinese 2` | `- **Example**: [En] ([Ch])` | 若 En 為空值、"無" 或 "none"，則輸出 `- **Example**: 沒有例句`。<br>*(註：需相容 SOP 早期拼字錯誤 `Example-Chinnese 2`)* |
| *(無對應欄位)* | `- **筆記**：___` | 固定於每個單字區塊底部生成底線，供學生手寫筆記。 |

### 3.2 Markdown 版面結構 (Mockup)
腳本生成的 Markdown 必須嚴格遵循以下單欄式 (Single Column) 結構：

```markdown
# Vocabulary Handout: {pdf檔名}

---

<style>
.vocab-block { page-break-inside: avoid; break-inside: avoid; display: block; width: 100%; margin-bottom: 20px; }
</style>

<div class="vocab-block">

### 1. **Apple** (n.)

> A round fruit with red or green skin and a whitish interior.

- **Synonym**: fruit (水果)
- **Antonym**: 沒有反義詞
- **Phrase**: the apple of one's eye
- **Example**: She is the apple of my eye. (她是我眼中的蘋果/我的摯愛。)
- **筆記**：_____________________________________________________

</div>

---
```

---

## 4. 例句重組講義 (Phrase Sentence Reorganization) 規範

### 4.1 題目打亂邏輯 (Scramble Logic)
⚠️ **重要技術規範**：**絕對不要使用 AI 來打亂句子**。
打亂句子的動作應由後續的生成腳本（Python 或 TypeScript）即時處理，以確保單字不遺漏、不拼錯，且保證題目絕對有解。

**腳本處理步驟**：
1. 讀取 `Example-English 1` 的原句（例如："The famous author wrote many books."）。
2. 移除句尾標點符號（如句號 `.`、問號 `?`、驚嘆號 `!`）。
3. 將句子以空格切分為單字陣列：`["The", "famous", "author", "wrote", "many", "books"]`。
4. 將陣列順序**隨機打亂**（若首字有大寫，可選擇轉小寫以增加難度，或保留原樣）。
5. 將打亂後的陣列用 ` / ` 符號串接起來：`many / books / the / wrote / famous / author`。

### 4.2 講義排版格式 (Layout Format)
每一題的排版結構如下：

```markdown
# [文章標題] - Chinese-to-English Translation

<style>
.question-block { page-break-inside: avoid; break-inside: avoid-page; display: block; width: 100%; margin-bottom: 20px; }
.phrase-text { margin-bottom: 12px; font-weight: bold; }
.chinese-text { margin-bottom: 12px; }
.scrambled-text { margin-bottom: 0px; }
.separator { margin-top: 75px; margin-bottom: 20px; border: 0; border-top: 1px solid #ccc; }
</style>

<div class="question-block">
<div class="phrase-text">[Phrase 片語]</div>
<div class="chinese-text">[Example-Chinnese 1 中文翻譯]</div>
<div class="scrambled-text">[打亂後的 Example-English 1]</div>
<hr class="separator">
</div>
```

---

## 5. MD 轉 PDF 轉換流程 (MD to PDF Conversion)

為確保實體列印品質，產出 `.md` 後需轉換為 `.pdf`：

1. **推薦工具**: VS Code / Cursor 擴充套件 **"Markdown PDF"** (yzane)。
2. **自訂頁首 (Header)**：專案中的 `.vscode/settings.json` 已設定 `"markdown-pdf.headerTemplate"`，匯出時會自動在每張 PDF 的右上角加上 `Produced by: Teacher Jennifer Chang`，並隱藏預設的日期與檔名。
3. **同單字/題目不可跨頁**：腳本已在區塊外層包覆 `<div>` 並注入 CSS `page-break-inside: avoid; break-inside: avoid-page; display: block; width: 100%;`，當空間不夠時會自動將整個區塊移至下一頁，確保內容不會被切斷。
4. **匯出講義 PDF**: 
   - 打開生成的 `{pdf檔名}-Handout.md`。
   - 在檔案內容中點擊「右鍵」，選擇 **"Markdown PDF: Export (pdf)"**。
   - 系統會自動在同一個資料夾下生成排版精美的 `{pdf檔名}-Handout.pdf`。

---

## 6. 執行環境與腳本使用說明 (Execution & Deployment)

開發者或自動化 CI/CD 流程可透過以下指令執行生成：

```bash
# 生成整合版講義 (單字 + 例句重組)
python scripts/generate_handout.py content/vocabulary/{單元名稱}/{pdf檔名}-Dictionary.csv
```

---

## 7. 驗收標準 (Acceptance Criteria)
1. **資料一致性 (Data Consistency)**：產出的 `.md` 檔案內容必須與來源 `.csv` 完全一致，無任何字元遺漏或 AI 幻覺竄改。
2. **例外處理通過 (Edge Case Passed)**：當 CSV 欄位為空或為「無」時，必須正確渲染出「沒有同義詞/反義詞/片語/例句」的防呆文字。
3. **路徑自動化 (Path Automation)**：腳本能正確解析輸入路徑中的 `{單元名稱}`，並自動將檔案存入對應的目錄下。
4. **單一檔案輸出 (Single File Output)**：單字講義與例句重組講義能成功合併為單一 `{pdf檔名}-Handout.md` 檔案，且中間有正確的分頁設定。