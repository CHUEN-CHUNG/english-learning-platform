# 文法題與互動遊戲產製流程 (Grammar QA & Game Rule )

## 1. 目的 (Purpose)
定義由 TPM、TL (Tech Lead)、UIUX 設計師與 AI 協作，將實體文法教材（PDF）轉化為「模組化數位互動遊戲」與「標準化題庫 (CSV)」的全新標準作業流程 (SOP)。本流程導入「資料驅動遊戲 (Data-Driven Gameplay)」架構，將遊戲規格與文法內容脫鉤，以提升量產效率。

## 2. 核心設計原則 (Core Principles)
1. **模組化遊戲模式 (Game Templates)**：工程與設計團隊只需為特定玩法（如：火車重組、泡泡選擇）開發一次規格書。
2. **題庫即設定檔 (CSV as Config)**：每個文法細項只需產出符合該遊戲模組格式的 `.csv`，系統讀取後自動生成遊戲。
3. **情境導入 (Comic Context)**：每個文法細項皆須搭配可編輯的漫畫情境圖，降低學生認知負荷。
4. **單一事實來源 (Single Source of Truth)**：前端拆解文件必須包含精準的來源追溯與 Edge Cases。

---

## 3. 執行流程 (Workflow SOP)

### 階段一：文法知識點高解析度拆解 (Knowledge Breakdown)
**目標**：將 PDF 教材轉化為精細的文法考點，並由人類專家決定對應的遊戲玩法。

*   **📥 [輸入文件]**：
    *   `@Grammar/[文法主題].pdf` (原始教材)
*   **📤 [輸出文件]**：
    *   `[文法主題]-Breakdown.md` (文法細項拆解草稿)
*   **🤖 AI 執行動作**：
    1. 閱讀 PDF，依據高解析度原則拆解文法細項（細化到單一認知任務）。請依據以下「通用原則」進行深度拆解，確保適用於所有文法主題：
        *   **依據教材實體結構**：教材中的每一個獨立圖表 (Chart)、小節標題、或針對特定概念的獨立練習題 (Exercise)，通常代表一個獨立的考點，應將其拆分為獨立細項。
        *   **依據規則與例外 (Rules vs. Exceptions)**：常規變化與特殊/不規則變化（例如：規則動詞 vs. 不規則動詞；一般複數加 s vs. 特殊拼寫變化）應獨立拆分，確保 Edge Cases 被放大檢視。
        *   **依據語意或使用情境 (Semantic/Usage Differences)**：若同一個文法有不同的使用情境（例如：未來式中的 will vs. be going to；時間介系詞 in/on/at 的不同用法），必須拆分。
        *   **依據句型結構差異 (Structural Differences)**：若句型排列邏輯有明顯差異（例如：Yes/No 問句與 Wh- 問句的倒裝邏輯不同；是否包含特定副詞位置），必須拆分。
        *   **【黃金判斷標準】**：如果一個細項裡包含了「兩種以上截然不同的學生常犯錯誤 (Common Mistakes) 或認知負擔」，就代表這個細項包山包海太大了，**必須再往下拆分**。
    2. 產出 `.md`，針對每個細項，**必須嚴格包含以下結構化資訊**：
        *   **對應章節**：標註來源章節（如 Chart 1-1），確保無超綱。
        *   **實體活動參考**：標註對應的課堂活動編號（如 Ex 1.5），作為 Step 3 遊戲提案的依據。
        *   **建議的線上活動遊戲**：根據實體活動與文法特性，建議適合的數位/線上互動遊戲模式。
        *   **文法題範圍 (CSV 題庫來源)**：精準列出對應的練習題編號（如 Ex 2, Ex 3），作為 Step 2 產出 CSV 的範圍限制，避免 AI 幻覺 (Hallucination) 自行發明題目。
        *   **核心概念**：簡述該文法的教學重點。
        *   **建議題型**：根據該文法細項的特性，**直接建議最適合的「題型」**（例如：重組題、選擇題、填空題），作為後續遊戲包裝的基礎。
        *   **開發與測試注意 (Edge Cases)**：列出例外狀況、學生常犯錯誤或字串比對容錯機制（如大小寫、縮寫限制），供 TL 與 QA 預判系統防呆與驗收標準。
        *   **純文字例題 (結構化雛形)**：必須從「文法題範圍 (CSV 題庫來源)」所列出的**每一個練習題 (Exercise) 中，各萃取至少一題**作為真實例題。以 `[來源出處 - 題型] 題目 | 選項 | 正解` 格式呈現（例如：`[Ex 1 - 填空題] ...`），確保後續生成 CSV 時有足夠的具體參考，避免 AI 發散或產出題目過少。

*   **👤 人類專家動作 (TPM/課程設計師)**：
    1. 審閱並編輯 `[文法主題]-Breakdown.md` 的內容。
    2. **【關鍵】** 在每個細項下方，確認或指定一個已存在的「遊戲模式」（例如：指定細項 1 使用 `Unscramble-Train` 模組，細項 2 使用 `Bubble-Choice` 模組）。

### 階段二：情境漫畫圖設計與編輯指南 (Visual Context Generation)
**目標**：為每個文法細項建立「漫畫情境」，降低學習門檻，AI 將自動生成底圖與可編輯的文字圖層，免除手動輸入的麻煩。

*   **📥 [輸入文件]**：
    *   人類確認並標註好遊戲模式的 `[文法主題]-Breakdown.md`
*   **📤 [輸出文件]**：
    *   更新版 `[文法主題]-Breakdown-with-Visuals.md` (包含圖片連結與 SVG 程式碼)
    *   `(可選) [文法主題]-Comic.svg` (實體可編輯圖檔)
*   **🤖 AI 執行動作**：
    1. **生成無字底圖**：根據文法概念，AI 使用繪圖工具生成一張「沒有文字的乾淨底圖 (Base Image)」，避免 AI 拼字錯誤。
    2. **生成 SVG 組合圖碼 (底圖 + 可編輯文字)**：AI 會撰寫一段 SVG 程式碼，將生成的底圖作為背景，並在上方精準疊加「對話框 (Speech Bubbles)」與「文字圖層 (Text Layers)」。
    3. **備註編輯方式**：AI 會在文件中說明：「請將此 SVG 程式碼存為 `.svg` 檔，您可以直接將其拖入 Figma、Adobe Illustrator 或任何支援 SVG 的編輯器中。圖片上的文字皆為『獨立文字圖層』，您可以直接雙擊修改、調整字體大小或移動位置，完全不需要從頭打字。」
---

### 階段三：模組化題庫與遊戲生成 (Modular CSV & Game Generation)
**目標**：根據使用者指定的遊戲模式，AI 自動生成符合該遊戲規格的標準化題庫 (CSV)。

*   **📥 [輸入資訊]**：
    *   確認後的文法細項與原有題庫內容。
    *   使用者指定的 `[遊戲模式]-Rule.md`。
*   **📤 [輸出文件]**：
    *   `[文法主題]-[細項編號]-[遊戲模式].csv` (最終題庫)。
*   **🤖 AI 執行動作**：
    1. 讀取指定的遊戲規格書 (`.md`)，深入理解該遊戲的機制與 CSV 欄位需求。
    2. 根據原有題庫內容，**自行生成/轉換出適合該遊戲的題庫 CSV**。
    3. 確保生成的 CSV 嚴格遵守該遊戲模組的欄位定義與邊界條件 (Edge Cases)。


目前系統共支援以下 7 種遊戲模組，每種模組皆有對應的專屬設計規格書 (`.md`) 與題庫格式：
1. **除錯遊戲 (Correction Game)**: `@apps/grammar-games/correction/docs/Correction-Game-Rule.md`
2. **深度選擇題遊戲 (Deep Multiple Choice Game)**: `@apps/grammar-games/multiple-choice-deep/docs/Deep-MultipleChoice-Game.md`
3. **快速選擇題遊戲 (Fast Multiple Choice Game)**: `@apps/grammar-games/multiple-choice-fast/docs/Fast-MultipleChoice-Game.md`
4. **填空遊戲 (Fill-in Game)**: `@apps/grammar-games/fill-in/docs/Fillin-Game-Rule.md`
5. **現在式專屬遊戲 (Present Tense Game)**: `@apps/grammar-games/present-tense/docs/Present-Tense-Game-Rule.md`
6. **自我介紹遊戲 (Self-introduction Game)**: `@apps/grammar-games/self-introduction/docs/Selfintroduction-Game-Rule.md`
7. **重組遊戲 (Unscramble Game)**: `@apps/grammar-games/unscramble/docs/Unscramble-Game-Rule.md`


各題型 CSV 規格核心精神 (CSV Schemas Core Logic)
為確保產出的題庫符合系統開發與教學需求，AI 在生成 CSV 時需注意以下重點（詳細欄位請參照各遊戲專屬的 `.md`）：

*   **填空題 (Fill-in)**：重點在於「字串比對容錯 (Edge Cases)」、「多重正確答案」與「精準的錯誤回饋」。
*   **重組題 (Unscramble)**：重點在於「切分粒度」與「干擾項 (Distractors)」，以利前端生成拖曳字卡。
*   **選擇題 (Multiple Choice)**：重點在於「基於學生常見文法誤區的誘答選項 (Distractor Logic)」。
*   **除錯題 (Correction)**：重點在於「錯誤標記位置」與「對應的修正解析」。
*   *(其他特殊遊戲如 Present Tense, Self-introduction 則嚴格依據其專屬規格書執行)*

*   **題庫檔案**：`[Grammar_Topic]-[Sub_Item]-[Game_Type].csv` 
    *   *(例如：`BeVerb-Affirmative-Unscramble.csv`)*
*   **規格文件**：`[Grammar_Topic]-[Sub_Item]-Spec.md` (若有額外特殊規格需求時才需產出)