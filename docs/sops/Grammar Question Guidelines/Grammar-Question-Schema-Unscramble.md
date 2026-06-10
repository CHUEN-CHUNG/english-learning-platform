# 文法重組題題庫格式規範 (Grammar Unscramble Question Schema)

為確保文法平台能夠跨不同重組題型遊戲（例如拖曳字卡、車廂重組）無縫載入題庫，所有文法重組題的 CSV 檔案必須嚴格遵循以下結構與編碼規範。

## 1. 檔案規範

*   **副檔名**: `.csv` (逗號分隔值)
*   **編碼格式**: 必須為 **UTF-8 (無 BOM)**。若遇到中文字元亂碼，請務必重新將檔案儲存為 UTF-8 編碼。
*   **路徑位置**: 所有題庫必須統一存放於 `content/grammar/` 目錄下的對應單元資料夾內。

## 2. 欄位定義 (Schema)

所有 CSV 必須包含表頭 (Header)，順序與名稱可以作為註解參考，但讀取時會以欄位順序解析。各欄位必須存在，即便某些資料不使用，也應該保留空白欄位（使用 `,` 區隔），以確保資料長度一致。

**表格結構（從左至右共 7 欄）：**

1.  **`GrammarPoint` (文法知識點)**
    *   **類型**: 字串
    *   **描述**: 此題測驗的核心文法。例如：`Affirmative_Sentence`, `Frequency_Adverb_Position`。
2.  **`TargetSentence` (目標完整句子)**
    *   **類型**: 字串
    *   **描述**: 目標完整句子（供 QA 驗收與最終顯示）。例如：`"She loves reading books."`。
    *   **備註**: 若內容包含逗號，必須使用雙引號包覆整段字串。
3.  **`ScrambledParts` (切分字卡)**
    *   **類型**: 字串
    *   **描述**: 切分好的字卡片段，使用 `|` 分隔。例如：`"They|are|my|best|friends."`。
4.  **`DistractorParts` (干擾字卡)**
    *   **類型**: 字串
    *   **描述**: 多餘的干擾字卡，使用 `|` 分隔（例如 `"is|am"`）。若無干擾項，可留空或填寫 `-`。
5.  **`CapitalizationHint` (大寫提示)**
    *   **類型**: 布林值字串 (`TRUE` 或 `FALSE`)
    *   **描述**: 是否在第一個字卡上保留大寫作為提示。
6.  **`PunctuationHint` (標點提示)**
    *   **類型**: 布林值字串 (`TRUE` 或 `FALSE`)
    *   **描述**: 標點符號是否獨立成一張字卡。
7.  **`Explanation` (解答詳解)**
    *   **類型**: 字串
    *   **描述**: 完整解析。說明該句子的文法結構或詞序原因。

## 3. CSV 範例

```csv
GrammarPoint,TargetSentence,ScrambledParts,DistractorParts,CapitalizationHint,PunctuationHint,Explanation
Affirmative_Sentence,"She loves reading books.","She|loves|reading|books.","-",TRUE,FALSE,She 為第三人稱單數，動詞需加 -s 變 loves。
Frequency_Adverb_Position,"I usually get up early.","I|usually|get|up|early.","always",TRUE,FALSE,頻率副詞 usually 應放在一般動詞 get 之前。
```

## 4. 解析注意事項
*   若欄位內容包含逗號 (`,`) 或 `|`，請務必將該欄位用雙引號 (`"`) 包覆。
*   每行資料為一題，換行即為下一題。