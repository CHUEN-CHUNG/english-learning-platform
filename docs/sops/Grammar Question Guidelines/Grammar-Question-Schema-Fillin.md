# 文法填空題題庫格式規範 (Grammar Fill-in-the-blank Question Schema)

為確保文法平台能夠跨不同填空題型遊戲無縫載入題庫，所有文法填空題的 CSV 檔案必須嚴格遵循以下結構與編碼規範。

## 1. 檔案規範

*   **副檔名**: `.csv` (逗號分隔值)
*   **編碼格式**: 必須為 **UTF-8 (無 BOM)**。若遇到中文字元亂碼，請務必重新將檔案儲存為 UTF-8 編碼。
*   **路徑位置**: 所有題庫必須統一存放於 `content/grammar/` 目錄下的對應單元資料夾內。

## 2. 欄位定義 (Schema)

重點在於「字串比對容錯 (Edge Cases)」、「多重正確答案」與「精準的錯誤回饋」。
所有 CSV 必須包含表頭 (Header)，順序與名稱可以作為註解參考，但讀取時會以欄位順序解析。各欄位必須存在，即便某些資料不使用，也應該保留空白欄位（使用 `,` 區隔），以確保資料長度一致。

**表格結構（從左至右共 9 欄）：**

1.  **`GrammarPoint` (文法知識點)**
    *   **類型**: 字串
    *   **描述**: 文法考點。例如：`WHQA_Inversion_DoSupport`。
2.  **`QuestionText` (題目內容)**
    *   **類型**: 字串
    *   **描述**: 題目本體，包含標準化挖空符號 `___`。
    *   **備註**: 若內容包含逗號，必須使用雙引號包覆整段字串。
3.  **`PrimaryAnswer` (最佳解答)**
    *   **類型**: 字串
    *   **描述**: 系統預設的最佳解答。
4.  **`AcceptedAlternatives` (可接受答案)**
    *   **類型**: 字串
    *   **描述**: 可接受的替代答案（如縮寫 `'re` 或不同大小寫拼法）。多個答案請用 `|` 分隔。若無則填寫 `-`。
5.  **`CaseSensitive` (大小寫敏感)**
    *   **類型**: 布林值字串 (`TRUE` 或 `FALSE`)
    *   **描述**: 系統判定答案時是否區分大小寫。句首挖空通常為 `TRUE`，句中通常為 `FALSE`。
6.  **`CommonMistake` (常犯錯誤)**
    *   **類型**: 字串
    *   **描述**: 預期學生常犯的錯誤輸入（如 `is|am` 或未還原的動詞）。用 `|` 分隔多個錯字。
7.  **`TargetedFeedback` (專屬提示語)**
    *   **類型**: 字串
    *   **描述**: 當學生輸入了 `CommonMistake` 中的錯誤答案時，彈出的專屬提示語（例如：「一般動詞要用 do 喔」）。
8.  **`HintText` (一般提示)**
    *   **類型**: 字串
    *   **描述**: 鷹架輔助。學生答不出來點擊提示時出現的文字。
9.  **`Explanation` (完整解析)**
    *   **類型**: 字串
    *   **描述**: 答對或看詳解時顯示的完整解析。

## 3. CSV 範例

```csv
GrammarPoint,QuestionText,PrimaryAnswer,AcceptedAlternatives,CaseSensitive,CommonMistake,TargetedFeedback,HintText,Explanation
WHQA_Dummy_It,How long does ___ take?,it,It,FALSE,that,問花費時間的固定句型是 How long does it take。,詢問時間花費的「虛主詞」是什麼？,談論花費時間時，我們使用虛主詞 it。
WHQA_Who_Subject,Who ___ the window?,broke,-,FALSE,did break,Who 本身當主詞時，動詞直接跟在後面，不需要加 did。,Who 當主詞時，動詞直接變過去式，不用加助動詞。,當 Who 為疑問句的主詞時，不需要借助動詞（do/does/did），動詞直接變形即可。
```

## 4. 解析注意事項
*   若欄位內容包含逗號 (`,`) 或 `|`，請務必將該欄位用雙引號 (`"`) 包覆。
*   每行資料為一題，換行即為下一題。