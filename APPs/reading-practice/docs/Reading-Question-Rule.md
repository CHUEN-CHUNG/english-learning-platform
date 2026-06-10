# 閱讀題撰寫

> ⚠️ **【重要維護規則】** ⚠️
> **若未來互動中有任何被確認的改動（不論是 UI 調整、邏輯優化或新增功能），皆須同步更新至本文件 `apps/reading-practice/docs/Reading-Question-Rule.md`，以保持系統文件的最新狀態。**

## 0. 與其他文件的關係

| 本文件負責 | 另見 |
|------------|------|
| 題庫規格、欄位定義、AI Prompt 模板、**reading-practice 前端**載入邏輯 | 產題**作業流程**（含 Star QA、儲存路徑、觸發條件）：[`docs/sops/Words & Reading/Reading-QA-Generation-SOP.md`](../../../docs/sops/Words%20&%20Reading/Reading-QA-Generation-SOP.md) |

**不必與 SOP 合併成一個檔**：本檔貼近「產品／App 規格」，SOP 貼近「誰在什麼情況下執行哪幾步」；維持兩份並互相連結，較利於 TPM 與工程師各取所需。

## 1. 目的 (Purpose)
定義由 AI 根據目標文章（如 `YLE-2-Article.md`）自動生成閱讀測驗題目（選擇題、是非題、簡答題）的標準流程。

**核心精神：Write Once, Run Anywhere (一次定義，全單元適用)。** PM 只需定義一次「通用出題法則」，未來任何新單元，AI 皆會自動套用此法則產出標準化的題庫。

## 2. 通用題庫與規則 (General Rules)

AI 出題的最高指導原則皆定義於 **`YLEReading-Rule-Detail-Full.csv`** 中。
該檔案包含了：
1. **Cognitive_Level (認知層次)**：確保題目涵蓋字面擷取與推論理解。
2. **Target_Sentence_Rule (目標句尋找規則)**：指示 AI 該去文章哪裡找考點。
3. **Question_Template (題幹模板)**：限制 AI 的問句句型，確保符合 YLE 難度。
4. **Distractor_Rule (錯誤選項生成規則)**：嚴格規範 AI 如何設計誘答選項，避免選項太瞎或超綱。

* **難度限制**：
  1. 題目與選項的單字難度必須 100% 符合該文章的級別（如 YLE Flyers Wordlist），句子簡短直白，不可超綱。
  2. 錯誤選項長度應與正確選項相近，避免正確答案特別長。

---

## 3. AI 產出的輸出格式 (Output Format from AI)
參考通則自動生成完整的題庫，並輸出為 `[Unit]-ReadingQA.csv` (例如 `YLE-2-ReadingQA.csv`)，供前端遊戲讀取。

### 欄位定義 (Column Definitions)
1. **Question_ID (題目編號)**：例如 `Q01`, `Q02`
2. **Paragraph (對應段落)**：標示該題屬於文章的第幾段（數字，如 `1`, `2`）。若是整篇總結題，填入 `All`。
3. **Type (題型)**：`MC` (選擇題), `TF` (是非題), 或 `SA` (簡答題)
4. **Question_Text (題目內容)**：AI 生成的完整英文題目。
5. **Option_A (選項A)**：(僅 MC 題型有值)
6. **Option_B (選項B)**：(僅 MC 題型有值)
7. **Option_C (選項C)**：(僅 MC 題型有值)
8. **Option_D (選項D)**：(僅 MC 題型有值)
9. **Answer (正確答案)**：填寫正確選項的完整文字（MC）、True/False（TF）或關鍵字（SA）。
10. **Explanation (詳解/提示)**：答錯時給學生的提示與解析。

---

## 4. 執行流程 (Workflow)
1. **PM 準備素材**：準備新文章（如 `YLE-3-Article.md`）與通則檔案（`YLEReading-Rule-Detail-Full.csv`）。
2. **呼叫 AI**：複製下方的「AI 產題專用 Prompt 模板」，貼給 ChatGPT 或 Claude。
3. **AI 執行並產出**：AI 自動分析文章段落，產出符合格式的 CSV 內容。
4. **遊戲載入**：將 AI 產出的內容存為 `YLE-3-ReadingQA.csv`，放置於 `content/ReadingQA/` 目錄下。前端大富翁遊戲會動態讀取該 CSV，並將題目分配至地圖格子中。

---

## 5. AI 產題專用 Prompt 模板 (AI Prompt Template)

*(請將以下內容連同文章與 CSV 規則一起貼給 AI)*

```text
# Role
你是一位專業的劍橋兒童英語 (Cambridge YLE Flyers) 測驗出題專家。

# Task
請閱讀我提供的【英文文章】以及【出題通則 CSV】，為這篇文章設計 [請填入題數，例如: 10] 題閱讀測驗。

# Rules (嚴格遵守)
1. 必須從【出題通則 CSV】中挑選適合這篇文章的題型來出題。
2. 題幹設計：必須嚴格套用通則中的 `Question_Template` 句型。
3. 選項設計：必須嚴格遵守通則中的 `Distractor_Rule` 來設計錯誤選項 (A, B, C, D)。錯誤選項必須具備誘答力，且不可超出 YLE Flyers 的單字範圍。
4. 答案與解析：解析必須明確指出答案在文章中的哪一段、哪一句。
5. 難度控制：所有題目與選項的單字、文法，必須符合文章本身的難度。

# Output Format
請直接輸出 CSV 格式的純文字（包含表頭），不要包含任何 Markdown 程式碼區塊標籤 (如 ```csv)，也不要任何額外的問候語。
必須包含以下欄位：
Question_ID,Paragraph,Type,Question_Text,Option_A,Option_B,Option_C,Option_D,Answer,Explanation

# Inputs
【出題通則 CSV】：
(請在此貼上 YLEReading-Rule-Detail-Full.csv 的內容)

【英文文章】：
(請在此貼上目標文章的內容)
```

---

## 6. 系統架構與載入邏輯
- **單元選擇器 (Unit Selector)**：畫面上方提供下拉選單，可動態切換單元（例如 `?unit=2`）。
- **段落選擇器 (Paragraph Selector)**：支援透過 `?p=` 參數載入特定段落的文章與題目（例如 `?unit=1&p=1`）。
- **動態標題載入**：系統會自動讀取 Markdown 文章的第一行（`# 標題`），並動態顯示在遊戲畫面上。
- **智慧尋找機制 (Smart Fallback)**：
  - 文章支援從 `content/Article/` 目錄讀取 `.md` 或 `-Article.md` 結尾（例如 `content/Article/YLE-1/YLE-1-Article.md`）。
  - 題庫支援從 `content/ReadingQA/` 目錄讀取 `-ReadingQA.csv` 或 `-QA.csv` 結尾（例如 `content/ReadingQA/YLE-1-ReadingQA.csv`）。

## 7. UI 顯示規範 (UI Specifications)
- **題目彈窗 (Question Modal)**：
  - 一般閱讀題 (MC 等) **不顯示**題型標籤 (如 "Multiple Choice")，直接顯示題目內容，讓畫面更簡潔。
  - 星星互動題 (Star QA) 則會顯示「Action Time! ⭐」作為標題（字體放大至 1.3rem，與 I did it 按鈕同級），以區分一般題目。內容部分**僅顯示英文指令**，不顯示中文。
  - 彈窗包含「Skip Question」按鈕，允許使用者跳過該題 (跳過不給分，但題目會推進句子，且題目會保留在題庫中後續可能再次出現)。
- **段落完成彈窗 (Finish Modal)**：
  - 顯示獲得的總硬幣數。
  - 左側按鈕：「Continue to Next Paragraph」（若為最後一段則隱藏）。
  - 右側按鈕：「Back to Reading Hub」。
- **遊戲機制 (Game Logic)**：
  - 答對一般閱讀題或完成星星互動題，皆可獲得 **3 枚硬幣**。
  - 每個段落的地圖上，**保證至少有 2 個星星格**（目前設定為 3 個以確保機率）。
