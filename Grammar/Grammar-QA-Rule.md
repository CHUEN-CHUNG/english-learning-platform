# 文法題與互動遊戲產製流程 (Grammar QA & Game Rule)

## 1. 目的 (Purpose)
定義由 TPM、TL (Tech Lead)、UIUX 設計師 與 AI 協作，將實體文法教材（PDF/MD）轉化為「數位互動遊戲」與「標準化題庫 (CSV)」的標準作業流程 (SOP)。

## 2. 核心設計原則 (Core Principles)
本流程基於以下三大專案架構限制而設計：
1. **題型決定遊戲**：遊戲模式必須跟著題目題型走（例如：題目是重組題，遊戲就必須是重組玩法的包裝），題型為核心。
2. **一對一對一架構**：一個「文法細項」對應一個「專屬遊戲」，並獨立對應一份「完整的 `.csv` 題庫資料」。
3. **實體活動啟發**：數位遊戲的機制不憑空捏造，必須從文法書中原有的「實體課堂活動（如：字卡配對、分組對話）」中萃取並轉化而來。
4. **單一事實來源 (Single Source of Truth)**：前端拆解文件必須包含精準的來源追溯 (Traceability) 與邊界測試案例 (Edge Cases)，以利跨部門 (TPM/TL/QA) 同步共識。

---

## 3. 執行流程 (Workflow SOP)

當取得新的文法教材（如 `@Grammar/be-verb.pdf` 或大綱 MD）時，請嚴格依照以下四個步驟執行：

### Step 1：文法細項拆解與確認 (Breakdown & Confirmation)
*   **AI 執行動作**：
    1. 讀取文法書 PDF 與大綱 MD，將該大單元拆解成具體的「文法細項」。
    2. 產出的拆解文件必須作為 TPM 與 TL 的「需求基準文件」，針對每個細項，**必須嚴格包含以下結構化資訊**：
        *   **對應章節**：標註來源章節（如 Chart 1-1），確保無超綱。
        *   **實體活動參考**：標註對應的課堂活動編號（如 Ex 1.5），作為 Step 3 遊戲提案的依據。
        *   **文法題範圍 (CSV 題庫來源)**：精準列出對應的練習題編號（如 Ex 2, Ex 3），作為 Step 2 產出 CSV 的範圍限制，避免 AI 幻覺 (Hallucination) 自行發明題目。
        *   **核心概念**：簡述該文法的教學重點。
        *   **建議題型**：根據該文法細項的特性，**直接建議最適合的「題型」**（例如：重組題、選擇題、填空題），作為後續遊戲包裝的基礎。
        *   **開發與測試注意 (Edge Cases)**：列出例外狀況、學生常犯錯誤或字串比對容錯機制（如大小寫、縮寫限制），供 TL 與 QA 預判系統防呆與驗收標準。
        *   **純文字例題 (結構化雛形)**：提供 2~3 題以 `[題型] 題目 | 選項 | 正解` 格式呈現的例題，讓 TL 確認資料庫結構。
*   **TPM / TL 動作**：
    *   **TPM**：確認範圍無誤、無遺漏或超綱，且來源追溯清晰，並確認**建議題型與例題**的考法符合教學目標。
    *   **TL**：確認 Edge Cases 已列出，資料結構雛形符合後續 CSV 與系統開發需求。

### Step 2：產出完整 CSV 題庫 ＆ 萃取課堂活動 (CSV Generation & Activity Extraction)
*   **AI 執行動作**：
    1. 根據 Step 1 確認的文法細項、例題與**鎖定的「題型」**，直接生成**「完整的 `.csv` 題庫」**（包含所有題目、選項、正確答案與解析）。
    2. 從 PDF 中萃取對應的「實體課堂活動」，作為下一步遊戲提案的依據。
*   **TPM 動作**：檢視 CSV 題目內容、難度是否合適，確認無誤後存檔（一個細項 = 一個 CSV），並確認萃取出的課堂活動。

### Step 3：數位遊戲提案 (Digital Game Proposals)
*   **AI 執行動作**：根據 Step 1 鎖定的「題型」與 Step 2 萃取出的「課堂活動」，提供 **3 個可應用的「數位遊戲轉化選項」**（例如：題型為重組，活動為字卡配對，提案為「火車車廂重組遊戲」）。
    *   每個提案必須包含**給 UI/UX 設計師的初步視覺與互動建議**（例如：拖曳物件的狀態、答對/答錯時的視覺回饋、畫面需要哪些核心元件）。
*   **TPM / UIUX 動作**：
    *   **TPM**：挑選最適合該細項與開發成本的數位遊戲模式。
    *   **UIUX 設計師**：評估提案的視覺可行性與使用者體驗，確認是否能與現有設計系統 (Design System) 整合。

### Step 4：產出開發規格書 (Development Spec Generation)
*   **AI 執行動作**：為該遊戲產出完整的 `.md` 規格書，內容必須包含：
    1. **資料形式 (Data Schema)**：對應 Step 3 的 CSV 欄位定義與範例。
    2. **各部門溝通方式 (Cross-Department Comm)**：
        *   給 UI/UX 的畫面重點（如：需要哪些狀態的動畫、錯誤提示怎麼呈現）。
        *   給 RD 的邏輯重點（如：判定正確的條件、拖曳或點擊的互動邏輯）。
    3. **測試連結 / 驗收條件 (Acceptance Criteria)**：列出 QA 測試的標準（如：答對時的行為、答錯時的行為、邊界測試）。
*   **TPM 動作**：將此規格書與 CSV 交付給設計與工程團隊，並開啟開發工單。

---

## 4. 產出物歸檔規範 (Deliverable Naming Convention)
*   題庫檔案：`[Grammar_Topic]-[Sub_Item]-Questions.csv` (例如：`BeVerb-Affirmative-Questions.csv`)
*   規格文件：`[Grammar_Topic]-[Sub_Item]-Spec.md` (例如：`BeVerb-Affirmative-Spec.md`)

---

## 5. 各題型 CSV 規格與範例 (CSV Schemas for Question Types)

為確保產出的題庫符合系統開發與教學需求，不同題型需遵循以下專屬的 CSV 欄位規格：

### 5.1 文法填空題 (Fill-in-the-blank)
重點在於「字串比對容錯 (Edge Cases)」、「多重正確答案」與「精準的錯誤回饋」。
*   **參考範例檔**：`grammar-fillin-rule.csv`
*   **欄位定義**：
    *   `Grammar_Point`: 文法考點（如 Be-Verb_Affirmative）。
    *   `Question_Text`: 題目本體，包含標準化挖空符號 `___`。
    *   `Primary_Answer`: 系統預設的最佳解答。
    *   `Accepted_Alternatives`: 可接受的替代答案（如縮寫 `'re`），多個答案用 `|` 分隔。
    *   `Case_Sensitive`: 大小寫敏感度 (`TRUE`/`FALSE`)。句首挖空通常為 `TRUE`，句中通常為 `FALSE`。
    *   `Common_Mistake`: 預期學生常犯的錯誤輸入（如 `is|am`）。
    *   `Targeted_Feedback`: 針對常犯錯誤的專屬提示語。
    *   `Hint_Text`: 一般提示（鷹架輔助）。
    *   `Explanation`: 完整解析。

### 5.2 重組題 (Unscramble)
重點在於「切分粒度」與「干擾項 (Distractors)」，以利前端生成拖曳字卡。
*   **參考範例檔**：`grammar-unscramble-rule.csv`
*   **欄位定義**：
    *   `Grammar_Point`: 文法考點。
    *   `Target_Sentence`: 目標完整句子（供 QA 驗收與最終顯示）。
    *   `Scrambled_Parts`: 切分好的字卡片段，使用 `|` 分隔（如 `They|are|my|best|friends.`）。
    *   `Distractor_Parts`: 多餘的干擾字卡，使用 `|` 分隔（如 `is|am`）。
    *   `Capitalization_Hint`: 是否在第一個字卡上保留大寫作為提示 (`TRUE`/`FALSE`)。
    *   `Punctuation_Hint`: 標點符號是否獨立成一張字卡 (`TRUE`/`FALSE`)。
    *   `Explanation`: 完整解析。

### 5.3 文法選擇題 (Grammar Multiple Choice)
重點在於「基於學生常見文法誤區的誘答選項」。
*   **參考範例檔**：`grammar-multiple-choice-rule.csv`
*   **欄位定義**：
    *   `Grammar_Point`: 文法考點。
    *   `Question_Text`: 題目本體，含挖空 `___`。
    *   `Option_A` ~ `Option_D`: 四個選項。
    *   `Correct_Answer`: 正確解答 (`A`/`B`/`C`/`D`)。
    *   `Distractor_Logic`: 誘答設計邏輯（說明為何設計這些錯誤選項，如：時態混淆、人稱不符）。
    *   `Explanation`: 完整解析。
