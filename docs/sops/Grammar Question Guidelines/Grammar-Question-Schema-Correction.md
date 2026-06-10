# 🐛 文法抓蟲題庫格式規範 (Grammar Correction Question Schema)

為確保「抓蟲遊戲 (Bug Catching Game)」能順利載入與解析，題庫必須遵循以下 JSON 結構規範。

## 1. 檔案規範

*   **副檔名**: `.json`
*   **編碼格式**: UTF-8 (無 BOM)
*   **路徑位置**: 所有題庫必須統一存放於 `content/grammar/` 目錄下的對應單元資料夾內，檔案名稱建議以 `-Correction.json` 結尾。

## 2. JSON 資料結構

題庫應為一個 JSON 陣列 (Array)，陣列中每個物件 (Object) 代表一個題目。

```json
[
  {
    "question_id": "bug_001",
    "category": "Be-Verb",
    "difficulty": 1,
    "original_sentence": "She are playing tennis now.",
    "tokens": ["She", "are", "playing", "tennis", "now."],
    "bugs": [
      {
        "target_index": 1,
        "wrong_word": "are",
        "correct_word": "is",
        "options": ["am", "is", "be"], 
        "explanation": "主詞是第三人稱單數 She，且為現在進行式，Be動詞應使用 is。"
      }
    ]
  }
]
```

### 欄位定義

*   **`question_id` (題號)**: String。用以唯一識別題目，便於錯題追蹤。
*   **`category` (類別/知識點)**: String。文法主題，例如 `How_State_Traffic`。
*   **`difficulty` (難度)**: Number (1, 2, 3)。1: 簡單（單一明顯錯誤），2: 中等，3: 困難（可能多重錯誤或邏輯錯誤）。
*   **`original_sentence` (原始錯誤句子)**: String。包含錯誤單字的完整句子字串。
*   **`tokens` (單字切分陣列)**: Array of String。將句子依照點擊單位切分。**這是遊戲渲染與互動的基礎**，玩家點擊的就是這裡面的元素。切分時標點符號通常跟著前一個單字（如 `now.`），或依照點擊需求切分。
*   **`bugs` (蟲/錯誤陣列)**: Array of Object。這句話裡面有哪些錯誤。
    *   **`target_index` (錯誤字索引)**: Number。對應 `tokens` 陣列中的索引（從 0 開始）。例如 `tokens[1]` 是 "are"，則 `target_index` 為 1。
    *   **`wrong_word` (錯誤單字)**: String。用來雙重確認。
    *   **`correct_word` (正確單字)**: String。正確的改法（供系統驗證）。若是多餘的字需刪除，可以用 `""` 或標記。
    *   **`options` (修正選項)**: Array of String。提供給玩家的選擇題選項（3個），必須包含 `correct_word`。如果是刪除字的考題，可以給 `["(刪除)", "其他選項", "其他選項"]` 等。
    *   **`explanation` (解析)**: String。答錯時顯示的文法解釋。

## 3. 切分 tokens 注意事項
*   請確保 `tokens` 陣列拼接起來能還原原意。
*   字與字之間的空白，前端會在渲染時自動補上，不需寫在 `tokens` 裡。
*   標點符號（逗號、句號、問號）建議直接黏在前一個字上，例如 `["Hello,", "world!"]`，以免玩家點擊到標點符號。
