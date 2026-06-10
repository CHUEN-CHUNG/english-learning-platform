# 文法選擇題題庫格式規範 (Grammar Multiple Choice Question Schema)

為確保文法平台能夠跨不同選擇題型遊戲無縫載入題庫，所有文法選擇題的 CSV 檔案必須嚴格遵循以下結構與編碼規範。

## 1. 檔案規範

*   **副檔名**: `.csv` (逗號分隔值)
*   **編碼格式**: 必須為 **UTF-8 (無 BOM)**。若遇到中文字元亂碼，請務必重新將檔案儲存為 UTF-8 編碼。
*   **路徑位置**: 所有題庫必須統一存放於 `content/grammar/` 目錄下的對應單元資料夾內。

## 2. 欄位定義 (Schema)

所有 CSV 必須包含表頭 (Header)，順序與名稱可以作為註解參考，但讀取時會以欄位順序解析。各欄位必須存在，即便某些資料不使用，也應該保留空白欄位（使用 `,` 區隔），以確保資料長度一致。

**表格結構（從左至右共 9 欄）：**

1.  **`GrammarPoint` (文法知識點)**
    *   **類型**: 字串
    *   **描述**: 此題測驗的核心文法，用於分類與分析學生弱項。例如：`Third_Person_Singular`, `Be_Verb_Usage`。
    *   **備註**: 建議使用底線 `_` 連接，避免空格，以便程式處理。
2.  **`QuestionText` (題目內容)**
    *   **類型**: 字串
    *   **描述**: 選擇題的題目文字，需包含標準化挖空符號 `___`。例如：`"He ___ to school every day."`。
    *   **備註**: 若內容包含逗號，必須使用雙引號包覆整段字串，例如 `"...word, word..."`。
3.  **`OptionA` (選項 A)**
    *   **類型**: 字串
    *   **描述**: 選擇題選項 A。
4.  **`OptionB` (選項 B)**
    *   **類型**: 字串
    *   **描述**: 選擇題選項 B。
5.  **`OptionC` (選項 C)**
    *   **類型**: 字串
    *   **描述**: 選擇題選項 C。
6.  **`OptionD` (選項 D)**
    *   **類型**: 字串
    *   **描述**: 選擇題選項 D。
7.  **`CorrectAnswer` (正確答案)**
    *   **類型**: 字串
    *   **描述**: 選擇題的正確選項，必須為 `A`, `B`, `C`, 或 `D`。
8.  **`DistractorLogic` (干擾項邏輯)**
    *   **類型**: 字串
    *   **描述**: 描述為何設計這些錯誤選項的邏輯（例如：「常見的時態混淆」）。主要供出題者參考。
9.  **`Explanation` (解答詳解)**
    *   **類型**: 字串
    *   **描述**: 學生答錯時顯示的詳解內容。例如：「因為主詞是第三人稱單數 He，動詞 go 必須加上 -es 變成 goes。」

## 3. CSV 範例

```csv
GrammarPoint,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,DistractorLogic,Explanation
Third_Person_Singular,"He ___ to school every day.",go,goes,going,went,B,時態與人稱變化,因為主詞是第三人稱單數 He，動詞 go 必須加上 -es 變成 goes。
Be_Verb_Usage,"They ___ my best friends.",am,is,are,be,C,Be動詞人稱,They 是複數代名詞，搭配的 Be 動詞是 are。
```

## 4. 解析注意事項
*   若欄位內容包含逗號 (`,`)，請務必將該欄位用雙引號 (`"`) 包覆。
*   每行資料為一題，換行即為下一題。