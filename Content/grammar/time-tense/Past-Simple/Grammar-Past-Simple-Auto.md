# 文法細項拆解與確認：過去簡單式 (Past Simple) - 高解析度與題庫對齊版

根據 `@Grammar/general/Grammar-QA-Rule.md` 的 Step 1 規範（高解析度拆解原則與錯誤驅動），我們將過去簡單式 (Past Simple) 進行深度拆解。

過去簡單式包含了 Be 動詞與一般動詞的差異、規則與不規則動詞的變化，以及否定/疑問句中助動詞 `did` 造成的動詞還原問題。依據「單一認知任務」標準，我們將其拆分為以下 8 個極度精細的考點：

---

## 細項 1：過去簡單式 - Be 動詞 (was / were)
*   **對應章節**：Chart: Past Simple with Be (was / were)
*   **實體活動參考**：Ex 1 (Where were you yesterday? 地點問答)
*   **文法題範圍 (CSV 題庫來源)**：Ex 1, Ex 2
*   **核心概念**：Be 動詞的過去式變化。主詞為 I, he, she, it 時用 `was`；主詞為 you, we, they 時用 `were`。
*   **建議題型**：文法填空題、選擇題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：主詞搭配錯誤（如 `You was` 或 `I were`）。
    *   **否定縮寫容錯**：需支援 `wasn't` 與 `weren't`。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 1 - 文法填空題] I ___ (be) at home yesterday. | was | was
    *   [Ex 2 - 選擇題] They ___ at the park last night. | A) was B) were C) are D) is | B

## 細項 2：過去簡單式 - 規則動詞肯定句 (常規加 -ed)
*   **對應章節**：Chart: Regular Verbs in the Past (Affirmative)
*   **實體活動參考**：Ex 3 (Weekend Activities 週末活動描述)
*   **文法題範圍 (CSV 題庫來源)**：Ex 3, Ex 4
*   **核心概念**：大部分常規動詞的過去式，直接在字尾加 `-ed` (如 work -> worked, watch -> watched)。
*   **建議題型**：文法填空題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：忘記加 `-ed`，直接使用原形動詞描述過去事件。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 3 - 文法填空題] We ___ (watch) a movie last night. | watched | watched
    *   [Ex 4 - 文法填空題] She ___ (wash) her car yesterday. | washed | washed

## 細項 3：過去簡單式 - 規則動詞拼寫變化 (-d, -ied, 雙寫字尾)
*   **對應章節**：Chart: Spelling of -ed (Exceptions)
*   **實體活動參考**：Ex 5 (Spelling Practice 拼寫練習)
*   **文法題範圍 (CSV 題庫來源)**：Ex 5, Ex 6
*   **核心概念**：
    1. 字尾有 e，直接加 `-d` (live -> lived)。
    2. 子音+y，去 y 加 `-ied` (study -> studied)。
    3. 短母音+單一子音結尾，雙寫字尾加 `-ed` (stop -> stopped)。
*   **建議題型**：動詞變化填寫題、選擇題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：未去 y 直接加 -ed（如 `studyed`），或忘記雙寫子音（如 `stoped`）。系統需針對這些特定拼字錯誤給予專屬 Feedback。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 5 - 動詞變化題] study -> ___ | studied | studied
    *   [Ex 6 - 選擇題] The bus ___ at the station. | A) stoped B) stopped C) stops D) stop | B

## 細項 4：過去簡單式 - 不規則動詞肯定句 (Irregular Verbs)
*   **對應章節**：Chart: Irregular Verbs (Group 1 & 2)
*   **實體活動參考**：Ex 7 (Memory Game 不規則動詞配對遊戲)
*   **文法題範圍 (CSV 題庫來源)**：Ex 7, Ex 8, Ex 9
*   **核心概念**：不規則動詞的過去式沒有固定規則，必須獨立記憶（如 go -> went, see -> saw, have -> had）。
*   **建議題型**：文法填空題、配對題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：學生會套用規則動詞的邏輯，自己發明單字（如 `goed`, `seed`, `haved`）。這是極高頻錯誤，必須設為 Common Mistake。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 7 - 文法填空題] I ___ (go) to the supermarket yesterday. | went | went
    *   [Ex 8 - 選擇題] He ___ a ghost in the old house. | A) seed B) saw C) sees D) sawed | B
    *   [Ex 9 - 文法填空題] We ___ (have) a great time at the party. | had | had

## 細項 5：過去簡單式 - 否定句 (didn't + 動詞還原)
*   **對應章節**：Chart: Past Simple Negative (didn't)
*   **實體活動參考**：Ex 10 (True or False: Correcting past statements)
*   **文法題範圍 (CSV 題庫來源)**：Ex 10, Ex 11
*   **核心概念**：過去簡單式的否定句，無論人稱，一律使用 `didn't` (did not) + 原形動詞。
*   **建議題型**：文法填空題、句型轉換題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：動詞忘記還原，保留了過去式（如 `didn't went` 或 `didn't played`）。這是過去式最核心的防呆重點。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 10 - 句型轉換題] I went to school. -> I ___ to school. | didn't go | didn't go
    *   [Ex 11 - 選擇題] She ___ breakfast this morning. | A) didn't ate B) didn't eat C) don't eat D) wasn't eat | B

## 細項 6：過去簡單式 - Yes/No 疑問句與簡答 (Did)
*   **對應章節**：Chart: Yes/No Questions with Did
*   **實體活動參考**：Ex 12 (Find someone who... 尋找符合條件的同學)
*   **文法題範圍 (CSV 題庫來源)**：Ex 12, Ex 13
*   **核心概念**：將助動詞 `Did` 放在句首形成疑問句，動詞必須保持原形。簡答時使用 did 或 didn't。
*   **建議題型**：重組題、簡答填空題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤 1**：疑問句首誤用 Be 動詞（如 `Were you go...?`）。
    *   **單一常犯錯誤 2**：Did 問句中的動詞未還原（如 `Did you went...?`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 12 - 重組題] you / watch / did / TV / last night / ? | (無) | Did you watch TV last night?
    *   [Ex 13 - 簡答填空題] Did he finish his homework? No, he ___. | didn't | didn't

## 細項 7：過去簡單式 - Wh- 疑問句結構
*   **對應章節**：Chart: Wh- Questions in the Past
*   **實體活動參考**：Ex 14 (Interview: Ask about a past vacation)
*   **文法題範圍 (CSV 題庫來源)**：Ex 14, Ex 15
*   **核心概念**：Wh- 疑問詞 (What, Where, When) 放在句首，後面接 Did + 主詞 + 原形動詞。
*   **建議題型**：重組題、疑問詞選擇題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：語序錯誤，漏掉助動詞（如 `Where you went?`）或主動詞未還原（如 `Where did you went?`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 14 - 重組題] did / go / where / you / yesterday / ? | (無) | Where did you go yesterday?
    *   [Ex 15 - 選擇題] ___ did you buy that shirt? | A) When B) Who C) Did D) What | A

## 細項 8：過去時間副詞的搭配 (Past Time Expressions)
*   **對應章節**：Chart: Past Time Words (yesterday, last, ago)
*   **實體活動參考**：Ex 16 (Time expression matching)
*   **文法題範圍 (CSV 題庫來源)**：Ex 16, Ex 17
*   **核心概念**：熟悉過去式的專屬時間標記：`yesterday` (yesterday morning), `last` (last night, last week), `ago` (two days ago)。
*   **建議題型**：選擇題、填空題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：介系詞誤用。例如中文說「在昨天早上」，學生常寫 `in yesterday morning`（正確不需要 in）；或 `last night` 寫成 `yesterday night`。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 16 - 選擇題] I saw him two days ___. | A) ago B) last C) yesterday | A
    *   [Ex 17 - 文法填空題] We traveled to Japan ___ (last / yesterday) year. | last | last
