# WHQA（Wh- 疑問句＋虛主詞 It）— 遊戲／題庫產製規格（SSOT）

## 0. 文件定位與溯源

| 項目 | 說明 |
|------|------|
| **用途** | 本檔為「本大單元」產出 **文法遊戲題目 CSV** 時的**單一事實來源（SSOT）**：教學目標、句型模板、誘答邏輯、欄位與驗收要點皆以此為準。 |
| **教材合併來源** | 內容合併自 `WHQA.md`（規則敘述、👉 句型拆解、延伸例）與 `WHQA+Dummy Subject.md`（精簡公式與單元切分）；兩份講義若日後修訂，請**同步更新**本檔對應小節。**本檔題庫單元為 1～14**，與講義可能之 20 小節並存時，對照見 §1.3 表下說明。 |
| **跨專案規範** | CSV 結構須符合 [`docs/sops/grammar/Grammar-Question-Schema-MultipleChoice.md`](../../../../docs/sops/grammar/Grammar-Question-Schema-MultipleChoice.md)；題型與產製流程參考 [`Grammar/Grammar-QA-Rule.md`](../../../../Grammar/Grammar-QA-Rule.md)。 |
| **活動層（選用）** | 圖像／關卡式活動企劃可另見 `apps/grammar-games/WHQA-Game-What.Where.md`、`WHQAGame-When.What time.md` 等；**題庫語意與文法邊界**仍以本檔為準。 |

---

## 0.5 一定要先決定「遊戲模式」嗎？（預設決策）

**不必。** 正確順序建議如下：

1. **先決「考什麼」**：單元範圍（§1.3）、句型模板與誘答（§4）、題型（§2.3）— 也就是 **題幹＋選項邏輯**，並產出符合 §3 **九欄 CSV** 的題庫。  
2. **再決「怎麼包裝」**：遊戲主題（密室、火車重組、對話等）只是 **UI／互動殼**；在專案「題型決定遊戲」架構下，只要 CSV 符合 Schema，**同一題庫**之後仍可換殼或接不同前端。

**本單元預設（已替你選定，可日後改）：**

| 階段 | 建議 | 理由 |
|------|------|------|
| **MVP** | **四選一文法選擇題**（克漏 `___` ＋ A～D），全 Unit 1～14 各產一批 `WHQA-UnitNN-MC.csv` | 與 `Grammar-Question-Schema-MultipleChoice.md` 九欄**完全一致**；誘答設計在 §2.2、§4 已寫滿；**不必等**美術或關卡企劃即可驗收教學成效。 |
| **V1.5** | 在 **Unit 1、3、11、13** 加做 **重組題**（第二份 CSV 或同檔用 `QuestionText` 放整句規則區分） | 強迫學生處理**詞序／倒裝／Because／Tag**，與 §2.3 一致。 |
| **V2** | 再視遊戲引擎支援度，加 **填空**（需 fill-in 專用欄位時另依 `Grammar-QA-Rule` §5.1） | 輸入容錯與替代答案規格較重，適合第二輪。 |

**不建議**一開始就綁死「只有某一種主題遊戲」再反推題目，容易為了畫面犧牲考點覆蓋率。

---

## 1. 產出物與檔案規範

### 1.1 建議檔名與路徑

- **路徑**：`Content/grammar/Grammar-Basic/WHQA+Dummy Subject/`（或專案約定之 `content/grammar/...` 下與本單元同層資料夾）。
- **命名**：`WHQA-Unit{NN}-{題型簡寫}.csv`  
  例：`WHQA-Unit07-MC.csv`、`WHQA-Unit04-Fillin.csv`、`WHQA-Unit01-Unscramble.csv`  
  亦相容 [`Grammar-QA-Rule`](../../../../Grammar/Grammar-QA-Rule.md) 之 `[Grammar_Topic]-[Sub_Item]-Questions.csv` 慣例。

### 1.2 編碼與表頭

- **編碼**：依 `Grammar-Question-Schema-MultipleChoice.md`，文法題庫使用 **UTF-8（無 BOM）**。
- **表頭**：九欄標準（見 §3）**順序不可亂**；欄位內含逗號時整欄以雙引號 `"..."` 包覆。

### 1.3 單元對照表（1～14）

| Unit | 教材標題（與講義 `##` 一致） | 建議 `GrammarPoint` 前綴 |
|------|------------------------------|---------------------------|
| 1 | 疑問句句型 — 倒裝公式 | `WHQA_Inversion` |
| 2 | 虛主詞 It | `WHQA_Dummy_It` |
| 3 | When / What time — 問句與差異、時間介係詞 in/on/at + 詳答 | `WHQA_When_WhatTime` |
| 4 | Where + 地方介係詞 | `WHQA_Where_PlacePrep` |
| 5 | What / What+N / Which | `WHQA_What_Which` |
| 6 | What … do & What do you do? | `WHQA_What_Do` |
| 7 | How + Be（狀態）、How + 一般動詞（交通）  | `WHQA_How_Be_State_How_Transport` |
| 8 | How often、How long | `WHQA_How_Often_How_Long` |
| 9 | How far／How old／How much／How many | `WHQA_How_Far`（距離）／`WHQA_How_Quantity`（年齡、價錢、可數／不可數量） |
| 10 | Who + Who 當主詞 | `WHQA_Who` |
| 11 | Why | `WHQA_Why` |
| 12 | How about / What about + 句尾介係詞 | `WHQA_About_PrepStranding` |
| 13 | Tag Questions | `WHQA_TagQuestion` |
| 14 | 考前檢查表（綜合） | `WHQA_Review` |

`GrammarPoint` 建議寫法：`WHQA_Where_LiveVsBe`（前綴 + 細項），**僅用英數與底線**，便於儀表板聚合。

**講義對照（選用）**：`WHQA.md`／`WHQA+Dummy Subject.md` 若仍為較細的 **20 小節**，出題與歸檔仍以本表 **1～14** 為準；合併關係可記為：講義 **3～4→Unit 3**、**5～6→Unit 4**、**9～10→Unit 7**、**11～12→Unit 8**、**13～14→Unit 9**、**15～16→Unit 10**、**17→11**、**18→12**、**19→13**、**20→14**；講義 **1、2** 與本表 **Unit 1、2** 同號。

---

## 2. 全模組共通規則（出題必載）

### 2.1 倒裝總則（對應 Unit 1；Unit 14 綜合題亦必用此快篩）

1. 有 **Be** → 問句：**Wh- + Be + S + …?**  
2. 有**一般動詞**（無 Be 當主要動詞）→ **Wh- + do/does/did + S + 原形 V …?**  
3. **助動詞後**主要動詞必為**原形**（含 did）。  
4. **不可**寫成 *Where are you live?*（一般動詞 live 應配 **do/does**）。

### 2.2 誘答（Distractor）設計原則

- **優先**使用各單元「📌 考試最常錯」中的錯誤型（見 §4）。  
- 同一題四選項中，至少 **2 個** 應對應「不同錯因」（例如：漏助動詞 vs 動詞未還原），避免四個選項同一類錯誤。  
- **語境一致**：人稱、時態、單複數與題幹一致。  
- **Which vs. What**：二選一／有限清單情境優先考 **Which**；開放清單用 **What**；顏色永遠 **What color**。

### 2.3 題型建議（對應 Grammar-QA-Rule）

| 題型 | 最適單元（示例，對應 §1.3 之 1～14） | 備註 |
|------|------------------|------|
| 選擇題（四選一） | 全單元（1～14） | 與九欄 Schema 完全一致。 |
| 填空 | 1、4、5、6、7、8、12 | 注意 `Accepted_Alternatives`（如 `It's`／`It is`）若使用 fill-in 專用欄位 schema。 |
| 重組 | 1、3、11、13 | 片語與倒裝順序、Because 子句、tag 前半+後半。 |
| 改錯（若遊戲支援） | 1、6、8、9、10、13、14 | 錯誤型直接取自 §4。 |

---

## 3. 標準 CSV：九欄（跨遊戲相容）

表頭與定義以 [`Grammar-Question-Schema-MultipleChoice.md`](../../../../docs/sops/grammar/Grammar-Question-Schema-MultipleChoice.md) 為準：

`GrammarPoint,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,DistractorLogic,Explanation`

- **選擇題**：`QuestionText` 含挖空 `___`；`CorrectAnswer` 為 `A`～`D`。  
- **重組題**：`QuestionText` 填**完整正解句**；`OptionA`～`D` 可作額外干擾詞或填 `-`；`CorrectAnswer` 可 `-`。  

### 3.1 迷你範例（Unit 1）

```csv
WHQA_Inversion_DoSupport,"Where ___ you live?",are,do,is,does,B,誤用Be或人稱助動詞,主詞 you 搭配一般動詞 live 時應用助動詞 do：Where do you live?
WHQA_Inversion_Order,"___ you know him?",Do,Are,Is,Does,A,漏助動詞或誤用Be,一般動詞 know 需用 Do 開頭：Do you know him?
```

---

## 4. 分單元出題規格（模板 · 誘答 · 範例句柄）

以下為 **Unit 1～14**（與 §1.3 一致）。每單元包含：**核心模板**、**高頻錯誤（誘答來源）**、**建議題幹／考點**（供寫入 `QuestionText` 或命題說明）。

### Unit 1 — 倒裝公式

- **模板**：`Wh- + Be + S …?`／`Wh- + do/does/did + S + 原形 V …?`  
- **誘答**：漏 do/does/did 或 Be；順序未倒裝；did/does 後未原形；*Where are you live?*  
- **題柄**：`Where ___ you live?`、`What ___ she doing?`、`___ he like pizza?`

### Unit 2 — 虛主詞 It

- **模板**：`What time is it?`／`How long does it take …?`／`It takes …`／天氣、星期答句以 **It** 開頭。  
- **誘答**：時間用 He/She 作主詞；*It is 20 minutes* 回答「花多久」；*What time is?* 漏 **it**。  
- **題柄**：答句主詞選擇；`What time is it` vs `What time is`；`It takes` vs `It is`（花費時間）。

### Unit 3 — When／What time＋時間介係詞 in／on／at

- **模板（時間問句）**：無一般動詞 → `When/What time + Be + S?`；有一般動詞 → `When/What time + do/does + S + 原形 V?`。精確「幾點幾分」→ **What time**；較大範圍 → **When**。  
- **模板（介係詞）**：at 點／on 日；in 較長時段；**零介係詞**（next/last/this/every/today/yesterday/tomorrow 前不再加 in/on/at）。When／What time 的詳答常帶 **At … / On … / In …**。  
- **誘答**：精確幾點卻只選 When；*When is you wake up?*；*When does the movie?*（無一般動詞勿加 does）；*in Monday*、*on 7:00*、*at July*；*on tomorrow*；at night 與 in the evening 互換錯。  
- **題柄**：疑問詞四選一；介係詞挖空；問句＋答句介係詞一致。

### Unit 4 — Where＋地方介係詞

- **模板（Where）**：`Where + Be + S?`／`Where + do/does + S + V?`；here/there/upstairs/downtown **前不加** at/in。  
- **模板（地方介係詞）**：on the bus / in the car / in a taxi；between A **and** B；next **to**；in front **of**；under／in／on 與名詞搭配。  
- **誘答**：*Where are you live?*；*at here*；漏 Be 或 do；on the bus 與 in the car 慣用搭配寫反；between A to B；漏 **to**、**of**。  
- **題柄**：live vs be；地點副詞 vs 介係詞片語；圖像情境選介係詞。

### Unit 5 — What／What + N／Which

- **模板**：二選一／有限清單 → **Which**；開放 → **What**；顏色 → **What color**（不用 *Which color*）。  
- **誘答**：*Which color*；範圍未縮小就用 Which；What／Which 與冠詞、複數搭配錯。  
- **題柄**：同一情境四選疑問詞；What color 填空。

### Unit 6 — What … do／What do you do?（含職業）

- **模板**：`What + does/do + S + do?`（習慣／昨天做了什麼）；`What + Be + S + doing?`（正在）；`What do you do?` → 答**職業**（*I'm a teacher.*）。did 後用 **do** 原形，勿 *went* 重複在錯誤結構。  
- **誘答**：職業問句答「正在做」；*What did you went?*；*What are you doing?* 與 *What do you do?* 混用。  
- **題柄**：問句與答句配對；時態與 do 搭配。

### Unit 7 — How + Be（狀態）＋How + 一般動詞（交通）

- **模板（狀態）**：`How + Be + S?` → 答形容詞／簡短評價（非交通）。  
- **模板（交通）**：`How + do/does + S + go/get …?`；**by** + 無冠詞；**on foot**；有 a/the／所有格時用 **in/on**（*in my car*、*on the bus*）。  
- **誘答**：*By bus.* 回答 *How are you?*；*I am a tired.*；*by a bus*；*by foot*；How（方式）與 Where（地點）選錯。  
- **題柄**：How are you vs How do you go；by/on/in／on foot 四選一。

### Unit 8 — How often＋How long

- **模板（頻率）**：`How often + do/does + S + V?`／`How often + Be + S …?`；頻率副詞在一般動詞**前**、Be **後**；次數片語常放句尾。  
- **模板（長度／花費時間）**：`How long + Be …?`／`How long + do/does/did + S + V?`；`How long does it take to …?` → 答 **It takes …**（勿用 *It is 20 minutes to …* 表「花多久」）。  
- **誘答**：*I play usually tennis.*；**How often** 與 **How long** 選錯；*It is 20 minutes to …*；did 後又寫過去式；How long 與 How far 混淆。  
- **題柄**：疑問詞選擇；It takes vs It is；副詞位置。

### Unit 9 — How far＋How old／How much／How many

- **模板（距離）**：`How far + Be + it from A to B?`／`How far + do/does + S + live from …?`；答 **It is + 距離 + from … to …**（或等價說法）。  
- **模板（年齡／量）**：`How old + Be + S?`；價錢／不可數 **How much**；可數複數 **How many + 複數 N**。  
- **誘答**：How far 與 How long 選錯；from/to 殘缺；*How many water*；*I have twelve years old.*；How much 與 How many 互選錯。  
- **題柄**：How far vs How long；much/many；年齡答句格式。

### Unit 10 — Who＋Who 當主詞

- **模板（一般）**：`Who + Be + S?`／`Who + do/does/did + S + 原形 V?`  
- **模板（Who 作主詞）**：`Who + V(-s/ed)?` — **不可**再加 *Who did break …?*  
- **誘答**：*Who are that boy?*；漏助動詞；did 後未原形；*Who did break …?*；*Who want* vs *Who wants*；Who 與 Which 在「認人／有限選項」題幹未讀清。  
- **題柄**：選擇正確問句；改錯；Who vs Which。

### Unit 11 — Why

- **模板**：`Why + Be + S …?`／`Why + do/does + S + V?`；Because + 子句；**Because of + 名詞**。  
- **誘答**：*Why you late?*（缺 Be／do）；*Because tired.*（子句不完整）。  
- **題柄**：補 **do/does** 或 **Be**；Because 後接完整子句或改 Because of。

### Unit 12 — How about／What about＋句尾介係詞

- **模板**：`How about/What about + N` 或 **+ V-ing**；**How about you?**；動介搭配疑問句中介係詞在**句尾**（*Where do you come from?*、*What are you looking for?*）。  
- **誘答**：*How about go …?*；*What are you looking?*（漏 **for**）；介係詞與動詞拆錯順序。  
- **題柄**：V-ing；句尾介係詞完整性。

### Unit 13 — Tag Questions（附加問句）

- **模板**：前肯後否／前否後肯；**I'm …, aren't I?**／**I'm not …, am I?**；**There's …, isn't there?**；一般動詞直述 → **don't you?**／**doesn't she?** 等。  
- **誘答**：*amn't I?*；*There's …, isn't it?*；*You like it, isn't you?*  
- **題柄**：附加問句四選一；There is／There are 的 tag。

### Unit 14 — 考前檢查表（綜合）

- **內容**：對應 **Unit 1** 四點快篩（漏助動詞或 Be／倒裝順序／did does do 後原形／勿 *Where are you live?*），題幹可混合 **When／Where／What／How／Who** 等已教範圍。  
- **用途**：跨單元混合、`GrammarPoint` 用 `WHQA_Review_*`。  
- **誘答**：與 Unit 1 相同類型，搭配其他單元之「假朋友」選項（如 by a bus、Which color）時須確保**僅一個正解**。

---

## 5. 給 AI／企劃的「一則指令」模板（複製後替換括號）

請在產出 CSV **之前**先列出：目標單元編號、題數、題型（MC／Fill-in／Unscramble）、CEFR 或年級難度。

```
你是英文文法題編輯。請只依據以下規範出題，不得發明未列之句型：
@Content/grammar/Grammar-Basic/WHQA+Dummy Subject/WHQA-Game-Question-Generation.md

任務：
- 單元：Unit {NN}（**僅限 1～14**，與 §1.3 對照表一致）
- 題數：{K}
- 題型：{MC 或 Fill-in 或 Unscramble}
- 輸出：UTF-8 無 BOM 的 CSV，表頭必須與 Grammar-Question-Schema-MultipleChoice 九欄完全一致。

硬性規則：
1. GrammarPoint 必須以 §1.3 表格之前綴開頭（例：`WHQA_Where_`；Unit 9 可為 `WHQA_How_Far_` 或 `WHQA_How_Quantity_`）。
2. 誘答選項優先使用該 Unit「高頻錯誤」類型。
3. 每題 Explanation 用繁體中文簡述正解理由（1～2 句）。
4. 句首人稱、時態與題幹一致；不可出現未教句型（如未列之進階用法）。

請直接輸出 CSV 純文字（含表頭），不要 Markdown 程式碼區塊標籤，不要前言後語。
```

---

## 6. TPM／TL 驗收檢查清單（題庫交前）

- [ ] 表頭九欄、順序、拼字與 Schema **完全一致**。  
- [ ] 檔案為 **UTF-8 無 BOM**；逗號與引號轉義正確。  
- [ ] 每題 `GrammarPoint` 可對應到 §1.3 之單元或細項。  
- [ ] **無** *Where are you live?*、*Did you went?*、*Which color*、*by a bus*、*Who did break* 等**已知錯誤型當作正解**。  
- [ ] 選擇題至少兩個誘答對應不同錯因；**正解唯一**。  
- [ ] `DistractorLogic` 與 `Explanation` 非空（便於教師審題與日後改版）。  
- [ ] 抽樣 10% 請母語者或資深教師讀一次「題幹＋選項」是否自然。

---

## 7. 改版紀錄（維護用）

| 日期 | 變更摘要 |
|------|----------|
| 2026-05-12 | 初版建立；同日將單元收斂為 **1～14**（對齊 §1.3），改寫 §2.1、§2.3、§4；§1.3 修正 Unit 9 表列；補「講義 20 小節→14 單元」對照；AI 模板限定 Unit 1～14。 |
| 2026-05-12 | 新增 **§0.5**：不必先決遊戲主題；建議先題庫後包裝；預設 MVP＝四選一 MC、V1.5＝重組（1／3／11／13）、V2＝填空。 |
