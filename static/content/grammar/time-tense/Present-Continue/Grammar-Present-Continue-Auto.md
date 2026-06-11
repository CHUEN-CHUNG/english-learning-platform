# 文法細項拆解與確認：現在進行式 (Present Continuous) - 高解析度與題庫對齊版

根據 `@Grammar/general/Grammar-QA-Rule.md` 的 Step 1 規範（高解析度拆解原則、錯誤驅動、以及強制逐題萃取例題），我們將 `Grammar-present-continue.pdf` 進行深度拆解。

現在進行式 (Present Continuous) 的核心認知負擔在於「Be 動詞與 V-ing 的雙重結構」，學生極易漏掉其中一個。此外，V-ing 的拼寫規則（去 e、雙寫字尾、ie 變 y）以及「不可用於進行式的狀態動詞 (Non-action / Stative Verbs)」也是極高頻的錯誤來源。依據「單一認知任務」與「黃金判斷標準」，我們將其拆分為以下 9 個極度精細的考點：

---

## 細項 1：現在進行式 - 肯定句基本結構 (am/is/are + V-ing)
*   **對應章節**：Chart: Present Continuous Affirmative (Basic Rule)
*   **實體活動參考**：Ex 1 (What are they doing? 看圖描述動作)
*   **文法題範圍 (CSV 題庫來源)**：Ex 1, Ex 2
*   **核心概念**：表達說話當下正在發生的動作。結構必須包含「Be 動詞 (am/is/are)」加上「動詞的現在分詞 (V-ing)」。
*   **建議題型**：文法填空題、選擇題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤 1**：漏掉 Be 動詞（如 `I playing` 或 `He sleeping`）。
    *   **單一常犯錯誤 2**：漏掉 V-ing，只寫原形（如 `I am play`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 1 - 文法填空題] I ___ (read) a book right now. | am reading | am reading|'m reading
    *   [Ex 2 - 選擇題] They ___ soccer in the park. | A) are playing B) playing C) are play D) play | A

## 細項 2：現在進行式拼寫規則 - 去 e 加 -ing
*   **對應章節**：Chart: Spelling of -ing (Verbs ending in -e)
*   **實體活動參考**：Ex 3 (Spelling Practice 拼寫練習)
*   **文法題範圍 (CSV 題庫來源)**：Ex 3
*   **核心概念**：當動詞字尾為不發音的 e 時，必須先去掉 e 再加 -ing (如 make -> making, write -> writing)。
*   **建議題型**：動詞變化填寫題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：未去 e 直接加 -ing（如 `makeing`, `writeing`）。系統需針對此拼字錯誤給予專屬 Feedback。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 3 - 動詞變化題] write -> ___ | writing | writing
    *   [Ex 3 - 文法填空題] She is ___ (make) a cake. | making | making

## 細項 3：現在進行式拼寫規則 - 雙寫字尾加 -ing
*   **對應章節**：Chart: Spelling of -ing (Double consonant)
*   **實體活動參考**：Ex 4 (Spelling Practice 拼寫練習)
*   **文法題範圍 (CSV 題庫來源)**：Ex 4
*   **核心概念**：當動詞為「短母音 + 單一子音」結尾時，必須重複字尾子音再加 -ing (如 run -> running, sit -> sitting, swim -> swimming)。
*   **建議題型**：動詞變化填寫題、選擇題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：忘記雙寫字尾（如 `runing`, `siting`, `swiming`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 4 - 動詞變化題] swim -> ___ | swimming | swimming
    *   [Ex 4 - 選擇題] The dog is ___ in the yard. | A) runing B) running C) run D) runs | B

## 細項 4：現在進行式拼寫規則 - ie 變 y 加 -ing
*   **對應章節**：Chart: Spelling of -ing (Verbs ending in -ie)
*   **實體活動參考**：Ex 5 (Spelling Practice 拼寫練習)
*   **文法題範圍 (CSV 題庫來源)**：Ex 5
*   **核心概念**：當動詞字尾為 ie 時，必須將 ie 改為 y 再加 -ing (如 lie -> lying, die -> dying, tie -> tying)。
*   **建議題型**：動詞變化填寫題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：直接加 -ing 或去 e 加 -ing（如 `lieing`, `liing`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 5 - 動詞變化題] lie -> ___ | lying | lying
    *   [Ex 5 - 文法填空題] He is ___ (tie) his shoes. | tying | tying

## 細項 5：現在進行式 - 否定句 (am not / isn't / aren't + V-ing)
*   **對應章節**：Chart: Present Continuous Negative
*   **實體活動參考**：Ex 6 (Spot the differences 找出圖片中不符的動作)
*   **文法題範圍 (CSV 題庫來源)**：Ex 6, Ex 7
*   **核心概念**：在 Be 動詞後加上 not 形成否定句，動詞依然保持 V-ing 形式。
*   **建議題型**：文法填空題、重組題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤 1**：誤用 don't/doesn't 來否定（如 `I don't playing` 或 `He doesn't sleeping`）。
    *   **單一常犯錯誤 2**：否定後忘記加 -ing（如 `She isn't sleep`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 6 - 文法填空題] We ___ (not / watch) TV. | aren't watching | aren't watching|are not watching
    *   [Ex 7 - 重組題] isn't / she / listening / me / to / . | (無) | She isn't listening to me.

## 細項 6：現在進行式 - Yes/No 疑問句與簡答
*   **對應章節**：Chart: Yes/No Questions in Present Continuous
*   **實體活動參考**：Ex 8 (Mime game: Are you...?)
*   **文法題範圍 (CSV 題庫來源)**：Ex 8, Ex 9
*   **核心概念**：將 Be 動詞移至句首形成疑問句。簡答時使用 Be 動詞，且肯定簡答不可縮寫。
*   **建議題型**：句型轉換題、簡答填空題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤 1**：疑問句首誤用 Do/Does（如 `Do you sleeping?`）。
    *   **單一常犯錯誤 2**：肯定簡答縮寫（如 `Yes, I'm.` 或 `Yes, she's.` 是絕對錯誤的）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 8 - 句型轉換題] You are studying. -> ___ you studying? | Are | Are
    *   [Ex 9 - 簡答填空題] Is he working? Yes, he ___. | is | is

## 細項 7：現在進行式 - Wh- 疑問句結構
*   **對應章節**：Chart: Wh- Questions in Present Continuous
*   **實體活動參考**：Ex 10 (Information Gap: What are they doing?)
*   **文法題範圍 (CSV 題庫來源)**：Ex 10, Ex 11
*   **核心概念**：Wh- 疑問詞放在句首，後面接 `Be 動詞 + 主詞 + V-ing`。
*   **建議題型**：重組題、疑問詞選擇題
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：語序錯誤，主詞與 Be 動詞未倒裝（如 `What you are doing?` 或 `Where he is going?`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 10 - 重組題] doing / what / are / you / ? | (無) | What are you doing?
    *   [Ex 11 - 選擇題] ___ is she crying? Because she is sad. | A) Why B) Where C) Who D) What | A

## 細項 8：狀態動詞 (Non-action / Stative Verbs) 的限制
*   **對應章節**：Chart: Non-action Verbs (Verbs not used in continuous)
*   **實體活動參考**：Ex 12 (Right or Wrong sentences 挑錯練習)
*   **文法題範圍 (CSV 題庫來源)**：Ex 12, Ex 13
*   **核心概念**：表達感官、情感、認知或擁有的動詞（如 know, like, want, need, love, have）通常不用於進行式，即使是現在發生的事，也必須使用「現在簡單式」。
*   **建議題型**：挑錯題、時態選擇題 (Simple vs. Continuous)
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：看到 right now 就無腦加 -ing（如 `I am knowing the answer right now` 或 `She is wanting an apple`）。這是高階的防呆重點。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 12 - 選擇題] I ___ the answer now. | A) am knowing B) know C) knowing D) knows | B
    *   [Ex 13 - 文法填空題] She ___ (want) to go home right now. | wants | wants

## 細項 9：現在進行式的專屬時間標記 (Time Expressions)
*   **對應章節**：Chart: Time Expressions for Present Continuous
*   **實體活動參考**：Ex 14 (Matching sentences with time clues)
*   **文法題範圍 (CSV 題庫來源)**：Ex 14, Ex 15
*   **核心概念**：熟悉現在進行式的專屬提示詞：`now`, `right now`, `at the moment`，以及引起注意的感嘆詞 `Look!`, `Listen!`。
*   **建議題型**：時態選擇題 (Simple vs. Continuous)
*   **開發與測試注意 (Edge Cases)**：
    *   **單一常犯錯誤**：忽略 `Look!` 或 `Listen!` 的情境暗示，誤用現在簡單式（如 `Look! The bus comes.` 應為 `is coming`）。
*   **純文字例題 (結構化雛形)**：
    *   [Ex 14 - 選擇題] Listen! The baby ___. | A) cries B) is crying C) cry D) crying | B
    *   [Ex 15 - 文法填空題] We ___ (study) English at the moment. | are studying | are studying|'re studying
