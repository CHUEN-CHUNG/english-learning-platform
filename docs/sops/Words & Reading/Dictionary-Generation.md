# 目標單字字典檔生成指南 (Dictionary Generation SOP)

## 目的
本指南用於指導 AI 或教材編輯，如何將初步擷取的單字表與目標單字庫進行比對，並生成一份包含同義詞、反義詞、例句與難度分級的「核心單字字典檔」。此檔案將作為後續所有遊戲與講義的**唯一資料來源 (Single Source of Truth)**。

## 1. 輸入資料準備
- **原始單字表**：`{pdf檔名}-orgword.csv` (從文章中擷取的原始單字與段落資訊)
- **目標單字庫**：`content/vocabulary/Test-Word/Words-select.csv` (該級別的標準單字庫)
- **歷史單字庫**：先前單元已生成的 `{pdf檔名}-Dictionary.csv` (例如生成 YLE-2 時，需參考 YLE-1 的字典檔)

## 2. 單字篩選與欄位定義
AI 必須挑選出重疊或與文章內容高度相關的目標單字。
⚠️ **重要篩選規則 (Lexical Progression)**：篩出來的單字需與前面的單字檔進行篩選，**出現在前面單字檔的單字則不可被挑選**。(例如：YLE-1 的單字不可出現在 YLE-2 中，確保每個單元的單字不重複)。

單字挑選完成後，為每個單字生成以下 17 個欄位：

1. `Word`: 英文單字 (必須與輸入一致)。
2. `POS`: 詞性 (n., v., adj., adv.)。
3. `Definition`: 用**全英文**解釋此單字 (難度需符合目標級別)。⚠️ **嚴禁出現中文**，請確保完全以英文解釋。
4. `Synonym-English 1`: 同義詞一的英文 (必須在 7000 單內，並符合相同 CEFR 難度，且詞性必須一致)。
5. `Synonym-Chinnese 1`: 同義詞一的中文。
6. `Antonym-English 1`: 反義詞一的英文 (必須在 7000 單內，並符合相同 CEFR 難度，且詞性必須一致；若無合適反義詞可填「無」，詞性必須一致)。
7. `Antonym-Chinese 1`: 反義詞一的中文。
8. `Synonym-English 2`: 同義詞二的英文 (必須在 7000 單內，並符合相同 CEFR 難度，且詞性必須一致)。
9. `Synonym-Chinese 2`: 同義詞二的中文。
10. `Antonym-English 2`: 反義詞二的英文 (必須在 7000 單內，並符合相同 CEFR 難度，且詞性必須一致；若無合適反義詞可填「無」，詞性必須一致)。
11. `Antonym-Chinese 2`: 反義詞二的中文。
12. `Phrase`: 英文單字常用片語 (難度需符合目標級別)。
13. `Example-English 1`: 包含該單字常用片語的實用例句一 (難度需符合目標級別)。
14. `Example-Chinnese 1`: 實用例句一的中文翻譯。
15. `Example-English 2`: 包含該單字常用片語的實用例句二 (難度需符合目標級別)。
16. `Example-Chinnese 2`: 實用例句二的中文翻譯。
15. `Example-English 3`: 包含該單字常用片語的實用例句三，專供**單字總測驗第三階段（中翻英）**使用 (難度需符合 **YLE Flyers / A1–A2**)。
16. `Example-Chinnese 3`: 實用例句三的中文翻譯（須與 `Example-English 3` 對應）。
17. `CEFR`: 語言難度級別 (Pre-A1, A1, A2, B1, B2)。
18. `Para`: 單字所在文章段落。⚠️ **若該單字未直接出現在文章中**（例如由 AI 根據文意延伸挑選的單字），請根據該單字最符合的**上下文語意或情境**，將其推斷並分配到最相關的段落數字，**不可留空**。

## 3. ⚠️ 內容品質要求 (Quality Assurance)
- **難度一致性**：同義詞與反義詞的難度不能超過目標單字太多。例如，目標單字是 A1，同義詞不應該是 C1 的冷僻字。
- **詞性對應**：名詞的同義詞必須是名詞，動詞的反義詞必須是動詞。
- **片語挑選**：片語挑選，以動詞+常用介係詞為首選。若原始動詞非動詞或沒有動詞+常用介係詞，則使用母語人士常用的片語或詞語搭配。
- **例句規範**：
  - 例句一、二、三，都須使用挑選的片語造句，不可使用其他搭配。且例句應貼近學生的日常生活，避免過度學術或生硬的句子。
  - **⚠️ 測驗題防呆設計 (Context Clues)**：因為這些例句將用於各階段的互動測驗（如單字填空、中翻英等），**所有例句 (Example-English 1, 2, 3) 都必須加入強烈的上下文線索**，讓學生在看到挖空的句子或進行翻譯時，能透過前後文邏輯「唯一鎖定」該目標單字，避免與其他文法相通的單字搞混。
    - ❌ *錯誤示範*：`Please whisper to me.` (挖空後變成 `Please ___ to me.`，學生可能會填入 `explain`, `talk` 等，容易產生爭議)
    - ✅ *正確示範（例句 1、2）*：`You must whisper in the library so you do not make loud noises.` (加入「圖書館」與「不能太大聲」的強烈線索，唯一指向 `whisper`)
  - **⚠️ 第三階段專用句型規範 (`Example-English 3` / `Example-Chinnese 3`)**：
    - **適用對象**：YLE Flyers 學生；句長建議 **6～10 個英文詞**（最多不超過 10 詞），以**單一句子**為主。
    - **必須**：使用 `Phrase` 欄位片語造句；保留強烈情境線索；難度符合 CEFR A1–A2；**每句只選用下列句型菜單中的一種框架**。
    - **⚠️ YLE Flyers 句型菜單（Example-English 3 專用，不綁單元）**：
      出題時，每個單字的 Ex3 **只選一種**框架造句；全冊反覆使用同一批框架，以建立句構與語感。
      | 類別 | 框架 | 範例 |
      |------|------|------|
      | **S + V + O** | `S + V (+ O)` | `The boy carried the heavy bags.` |
      | **S + be + adj** | `S + am/is/are + adj` | `The soup is hot enough for me.` |
      | **There is/are…** | `There is/are + n + prep + n` | `There is a garden in front of my house.` |
      | **can / must + V** | `S + can/must + V (+ O)` | `You must whisper in the library.` |
      | **S + V + to + V** | `S + V + to + V` | `She asked him to carry the bags.` |
      | **S + like / want + n / v-ing** | `S + like/want + n` 或 `S + like + v-ing` | `I like playing basketball after school.` |
      | **片語** | 句中須含 `Phrase` 欄位片語 | `I am interested in science class.`（interested in） |
      - **時態運用**（依單字與情境擇一，一句只用一個時態）：
        - **現在簡單式**：`I walk to school every day.` / `She likes fast food.`
        - **現在進行式**：`He is reading a book in the library.`（Flyers 短句；避免多從句）
        - **未來式**：`I am going to visit my grandma this weekend.`（以 `be going to` 為主，保持短句）
        - **過去式**：`Yesterday, we went to the zoo.` / `He carried the bags yesterday.`
      - **出題原則**：
        - 有 `Phrase` 欄位時，**優先使用「片語」框架**或能自然嵌入片語的框架（如 `S + V + to + V`、`There is/are…`）。
        - 一個句子**最多一個語法重點**（一個時態 **或** 一個片語結構，不可疊加過多）。
        - 能改直述句者，**優先使用直述句**；問句僅在該單字無法以直述呈現時使用。
        - `Example-Chinnese 3` 中文翻譯盡量與英文**詞序接近**，方便中翻英產出。
    - **嚴禁出現**（用於第三階段中翻英，違反者須改寫）：
      - `because` / `so` / `when` / `if` 所引導的從屬子句
      - 關係子句（`who` / `that` / `which` 等關係代名詞引導的修飾子句）
      - 分號 (`;`) 連接兩句
      - `or … or` 選擇複句（如 `… now or wait until …`）
      - 巢狀結構（如 `help … prepare … by …ing`、`hoping to …`、雙不定詞 `… to … to …`）
    - ❌ *第三階段錯誤示範*：`We must decide to start the project now or wait until tomorrow.`（or 選擇複句）
    - ❌ *第三階段錯誤示範*：`It is an excellent idea to bring an umbrella because it looks like rain.`（because 從句）
    - ❌ *第三階段錯誤示範*：`This movie has an interesting story that makes me want to watch it again.`（that 關係子句）
    - ❌ *第三階段錯誤示範*：`You cannot eat soup with a fork; you need a spoon.`（分號連兩句）
    - ❌ *第三階段錯誤示範*：`My mom helps me prepare for the trip by packing my bag.`（巢狀結構過多）
    - ✅ *第三階段正確示範*：`There is a garden in front of my house.`（There is/are… + 片語）
    - ✅ *第三階段正確示範*：`The friendly boy helped the old lady.`（S + V + O）
    - ✅ *第三階段正確示範*：`The class must decide to start the art project today.`（can/must + V；S + V + to + V + 片語 `decide to`）
    - ✅ *第三階段正確示範*：`Yesterday, we went to the zoo.`（過去式）
    - **注意**：`Example-English 1` 與 `Example-English 2` 可維持較豐富的敘述；**僅 `Example-English 3` 須遵守上述句型菜單與嚴格上限**。詳見 `apps/reading-hub/data/Reading-Hub-Spec.md` §3.3.3。
    - **`Ex3-Pattern` 欄位**：記錄該句所屬句型菜單（如 `S + V + O`、`There is/are…`、`can / must + V`、`片語` 等），供第三階段題目顯示句型提示。
    - **`Ex3-Tense` 欄位**：記錄該句時態（`現在簡單式`、`現在進行式`、`未來式`、`過去式`），供第三階段題目顯示時態提示。

## 4. 輸出規範
- **檔案命名**：`{pdf檔名}-Dictionary.csv`
- **儲存路徑**：`content/vocabulary/{單元名稱}/`
- **編碼要求**：必須以 **UTF-8 with BOM (帶有 BOM 的 UTF-8)** 編碼存檔。這非常重要，若未加上 BOM，使用 Excel 開啟 CSV 檔時中文會出現亂碼。(若使用 Python 生成，請指定 `encoding='utf-8-sig'`)
- **排序要求**：最終輸出的 CSV 檔案中，單字順序**必須根據 `Para` (段落) 欄位的數字由小到大進行排序**（例如：出現在第 1 段的單字排在最前面，第 2 段次之，依此類推）。若同一個單字出現在多個段落（例如 `3, 5`），請以第一個數字（即 `3`）作為排序依據。

## 5. 範例提示詞 (Prompt for AI)
當需要 AI 執行此步驟時，請使用以下提示詞：

> 「請參考 `@Dictionary-Generation-SOP.md` 的規範，將 `@檔案名稱-orgword.csv` 中的單字與 `@Words-select.csv` 進行比對。請挑選出重疊的目標單字，並為每個單字生成包含 `Word`, `POS`, `Definition`, `Synonym-English 1` 等 20 個欄位的完整資料。請確保同反義詞難度一致、詞性對應，**且 Definition 欄位必須為全英文解釋（嚴禁中文）**。針對 `Para` 欄位，若單字未出現在原文中，請根據文意推斷最適合的段落填入，並輸出為 CSV 格式。」
