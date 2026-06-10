# 互動對話角色扮演遊戲：專案開發材料包 (Materials Bundle)

## 1. 什麼是資料字典 (Data Dictionary)？為什麼我們不用 CSV？
**TPM / TL 視角：解耦規則與資料的邊界**

在專案開發中，許多人會誤以為「題庫 CSV = 資料庫的全部」。但這是一個危險的思維。
我們之所以將「時間副詞」、「動詞庫」、「情境主題」獨立抽出來寫成這份 `.md` 格式的**資料字典 (Data Dictionary)**，原因如下：

*   **唯一事實來源 (Single Source of Truth, SSOT)**：
    CSV 檔案是為了給「電腦 (系統)」讀取的最終產物，裡面充滿了一行行的具體題目。如果今天企劃想知道「過去式可以考哪些時間副詞？」，去翻閱幾百行的 CSV 找規律是非常痛苦且容易出錯的。
*   **約束條件 (Constraints) 的定義**：
    `.md` 的字典定義了 **「邊界與規則」**。這份字典就像是法典，規定了「過去式只能搭配 yesterday/ago/last 系列」。有了這份法典，未來不管是人類企劃或是 AI，在大量生成 CSV 題庫時，就不會發生「未來式配上 yesterday」的低級錯誤。
*   **為何不用 CSV 寫字典？**
    CSV 的扁平結構適合儲存「列表型資料 (Tabular Data)」，但不適合表達「關聯性」與「階層結構」（例如：過去式底下包含三個系列，每個系列又包含哪些單字）。`.md` 提供的高易讀性，是作為跨部門 (企劃/開發/設計) 溝通基準的最佳格式。

---

## 2. 遊戲目標時態 (4 Target Tenses)
依據本次題庫產出需求，各案件的四個調查階段將依序考驗以下時態：
1.  **過去簡單式 (Past Simple)**
2.  **現在簡單式 (Present Simple)**
3.  **現在進行式 (Present Continuous)**
4.  **未來簡單式 (Future Simple)**

---

## 3. 時態專屬時間/頻率庫 (Time & Frequency Expressions Database)
*(資料來源：教材圖卡與專案規範)*

### ⏳ 過去簡單式 (Past Simple)
*   **Yesterday 系列**：`yesterday morning`, `yesterday afternoon`, `yesterday evening`
*   **Ago 系列**：`five minutes ago`, `two years ago`
*   **Last 系列**：`last night`, `last week`, `last year`, `last spring`

### 🔄 現在簡單式 (Present Simple)
*   **頻率副詞 (Adverbs of Frequency)** *(句中：一般動詞前 / Be 動詞後)*：
    *   `always` (100%)
    *   `usually` (90%)
    *   `often` (70%)
    *   `sometimes` (50%)
    *   `rarely` (10%)
    *   `never` (0%)
*   **Every... 表達式 (Every... Expressions)** *(句尾)*：
    *   `every day`
    *   `every week`
    *   `every month`

### 🏃 現在進行式 (Present Continuous)
*   **當下時間**：`now`, `right now` *(依據專案規範)*

### 🔮 未來簡單式 (Future Simple)
*   **Tomorrow 系列**：`tomorrow morning`, `tomorrow`
*   **Next 系列**：`next week`, `next year`, `next morning`, `next afternoon`, `next night`, `next month`
*   **In + 時間段**：`in 5 minutes`, `in 1 month`, `in 4 years`

---

## 4. 共用/特定動作庫 (Verbs & Action Phrases)
*(單字皆嚴格篩選自 `bryan-word.csv` 詞庫，並依據遊戲語意規範加上合適的受詞)*
*   **偵探辦案常用**：
    *   `explore` (探索) -> `explore the museum`, `explore the building`
    *   `leave` (離開) -> `leave the office`, `leave the stadium`
    *   `fetch` (拿來) -> `fetch the suitcase`, `fetch the tool`
    *   `lift` (舉起) -> `lift the heavy box`, `lift the bag`
    *   `whisper` (小聲說話) -> `whisper a secret`
    *   `whistle` (吹口哨) -> `whistle a tune`
    *   `keep` (保有) -> `keep a diary`, `keep a secret`
*   **日常與科普常用**：
    *   `prepare` (準備) -> `prepare the meal`, `prepare the materials`
    *   `taste` (品嚐) -> `taste the food`, `taste the medicine`
    *   `repair` (修理) -> `repair the engine`, `repair the fridge`
    *   `look after` (照顧) -> `look after the baby`, `look after the eggs`
    *   `invent` (發明) -> `invent a machine`
    *   `land` (降落) -> `land on the ground`, `land on the tree`
    *   `guess` (猜) -> `guess the answer`

---

## 5. 案件主題靈感 (Case Themes)

### 🕵️ 找嫌犯模式 (4 Cases)
1.  **「消失的名畫案」 (The Missing Painting)** - 在美術館調查嫌犯的行蹤。
2.  **「銀行搶案」 (The Bank Robbery)** - 透過監視器與目擊者證詞還原嫌犯作息。
3.  **「誰偷吃了我的布丁」 (The Stolen Pudding)** - 生活化、趣味性的校園/家庭案件。
4.  **「半夜的神秘腳步聲」 (The Midnight Footsteps)** - 調查鄰居或室友的作息異常。

### 🎤 科普文章模式 (2 Cases)
1.  **「水循環的秘密」 (The Water Cycle)** - 採訪氣象學家，了解水滴過去在哪裡、現在正在做什麼、未來會變成什麼。
2.  **「帝王斑蝶的大遷徙」 (Butterfly Migration)** - 採訪生態學家，記錄蝴蝶家族的跨國旅程。

---

## 6. 現有題庫內容展示 (Current CSV Data Export)

以下是目前設定在 `Dialogue-Roleplay-Cases.csv` 內的實際資料，包含四個嫌疑人與兩篇科普文章在各個時態的句子（動詞問句、時間問句、最終直述句）以及對應圖片。

### 🕵️ 找嫌犯模式 (4 個嫌疑人)

**嫌疑人 1 (Image: `/images/suspect_1.png`)**
*   **英文簡介 (Intro Story)**: *A priceless painting was stolen from the city museum! We found a suspect, but his alibi is suspicious. Detective, interrogate him and find out the truth!*
*   **Phase 1 背景音樂 (BGM)**: `./assets/c001_phase1_suspense.mp3`
*   **Phase 2 背景音樂 (BGM)**: `./assets/c001_phase2_suspense.mp3`
*   **過去簡單式**:
    *   動詞問句: Did he leave?
    *   受詞線索 (Clue): the museum
    *   時間問句: Did he leave the museum last night?
    *   最終直述句: He left the museum last night.
*   **現在簡單式**:
    *   動詞問句: Does he keep?
    *   受詞線索 (Clue): a diary
    *   時間問句: Does he always keep a diary?
    *   最終直述句: He always keeps a diary.
*   **現在進行式**:
    *   動詞問句: Is he whispering?
    *   受詞線索 (Clue): a secret
    *   時間問句: Is he whispering a secret right now?
    *   最終直述句: He is whispering a secret right now.
*   **未來簡單式**:
    *   動詞問句: Will he fetch?
    *   受詞線索 (Clue): the suitcase
    *   時間問句: Will he fetch the suitcase next night?
    *   最終直述句: He will fetch the suitcase next night.

**嫌疑人 2 (Image: `/images/suspect_2.png`)**
*   **英文簡介 (Intro Story)**: *The central bank was robbed! We tracked down a group of suspicious mechanics. They claim they were just fixing an engine. We need you to question them before they escape!*
*   **Phase 1 背景音樂 (BGM)**: `./assets/c002_phase1_upbeat.mp3`
*   **Phase 2 背景音樂 (BGM)**: `./assets/c002_phase2_upbeat.mp3`
*   **過去簡單式**:
    *   動詞問句: Did they repair?
    *   受詞線索 (Clue): the engine
    *   時間問句: Did they repair the engine yesterday morning?
    *   最終直述句: They repaired the engine yesterday morning.
*   **現在簡單式**:
    *   動詞問句: Do they explore?
    *   受詞線索 (Clue): the building
    *   時間問句: Do they often explore the building?
    *   最終直述句: They often explore the building.
*   **現在進行式**:
    *   動詞問句: Are they lifting?
    *   受詞線索 (Clue): the bag
    *   時間問句: Are they lifting the bag now?
    *   最終直述句: They are lifting the bag now.
*   **未來簡單式**:
    *   動詞問句: Will they leave?
    *   受詞線索 (Clue): the country
    *   時間問句: Will they leave the country next week?
    *   最終直述句: They will leave the country next week.

**嫌疑人 3 (Image: `/images/suspect_3.png`)**
*   **英文簡介 (Intro Story)**: *Someone ate the delicious pudding from the fridge! My sister says she was just tasting some food, but I don't believe her. Detective, ask her some questions and find the pudding thief!*
*   **背景音樂 (BGM)**: `./assets/bgm_detective.mp3`
*   **過去簡單式**:
    *   動詞問句: Did she taste?
    *   受詞線索 (Clue): the food
    *   時間問句: Did she taste the food five minutes ago?
    *   最終直述句: She tasted the food five minutes ago.
*   **現在簡單式**:
    *   動詞問句: Does she prepare?
    *   受詞線索 (Clue): the meal
    *   時間問句: Does she usually prepare the meal?
    *   最終直述句: She usually prepares the meal.
*   **現在進行式**:
    *   動詞問句: Is she looking after?
    *   受詞線索 (Clue): the baby
    *   時間問句: Is she looking after the baby right now?
    *   最終直述句: She is looking after the baby right now.
*   **未來簡單式**:
    *   動詞問句: Will she guess?
    *   受詞線索 (Clue): the answer
    *   時間問句: Will she guess the answer in 1 month?
    *   最終直述句: She will guess the answer in 1 month.

**嫌疑人 4 (Image: `/images/suspect_4.png`)**
*   **英文簡介 (Intro Story)**: *There have been strange footsteps in the attic every night. We think our neighbor is building a weird machine up there. Investigate his daily routine and future plans!*
*   **背景音樂 (BGM)**: `./assets/bgm_detective.mp3`
*   **過去簡單式**:
    *   動詞問句: Did he fetch?
    *   受詞線索 (Clue): the tool
    *   時間問句: Did he fetch the tool two days ago?
    *   最終直述句: He fetched the tool two days ago.
*   **現在簡單式**:
    *   動詞問句: Does he whistle?
    *   受詞線索 (Clue): a tune
    *   時間問句: Does he sometimes whistle a tune?
    *   最終直述句: He sometimes whistles a tune.
*   **現在進行式**:
    *   動詞問句: Is he exploring?
    *   受詞線索 (Clue): the path
    *   時間問句: Is he exploring the path now?
    *   最終直述句: He is exploring the path now.
*   **未來簡單式**:
    *   動詞問句: Will he invent?
    *   受詞線索 (Clue): a machine
    *   時間問句: Will he invent a machine in 4 years?
    *   最終直述句: He will invent a machine in 4 years.

### 🎤 科普文章模式 (2 篇科普文章)

**科普文章 1：水循環 (Image: `/images/water_cycle.png`)**
*   **英文簡介 (Intro Story)**: *Welcome to the science lab! Today, we are tracking a single drop of water on its incredible journey. Reporter, ask our meteorologist about where the water came from and where it is going!*
*   **Phase 1 背景音樂 (BGM)**: `./assets/c005_phase1_science.mp3`
*   **Phase 2 背景音樂 (BGM)**: `./assets/c005_phase2_science.mp3`
*   **過去簡單式**:
    *   動詞問句: Did it leave?
    *   受詞線索 (Clue): the river
    *   時間問句: Did it leave the river yesterday?
    *   最終直述句: The water left the river yesterday.
*   **現在簡單式**:
    *   動詞問句: Does it improve?
    *   受詞線索 (Clue): the environment
    *   時間問句: Does it always improve the environment?
    *   最終直述句: It always improves the environment.
*   **現在進行式**:
    *   動詞問句: Is it landing?
    *   受詞線索 (Clue): on the ground
    *   時間問句: Is it landing on the ground right now?
    *   最終直述句: The rain is landing on the ground right now.
*   **未來簡單式**:
    *   動詞問句: Will it explore?
    *   受詞線索 (Clue): the ocean
    *   時間問句: Will it explore the ocean next month?
    *   最終直述句: The drop will explore the ocean next month.

**科普文章 2：帝王斑蝶 (Image: `/images/butterflies.png`)**
*   **英文簡介 (Intro Story)**: *Every year, millions of monarch butterflies travel across the continent. It's a beautiful mystery! Reporter, interview our ecologist to learn about their past journey and their future destination!*
*   **Phase 1 背景音樂 (BGM)**: `./assets/c006_phase1_science.mp3`
*   **Phase 2 背景音樂 (BGM)**: `./assets/c006_phase2_science.mp3`
*   **過去簡單式**:
    *   動詞問句: Did they leave?
    *   受詞線索 (Clue): the forest
    *   時間問句: Did they leave the forest last spring?
    *   最終直述句: The butterflies left the forest last spring.
*   **現在簡單式**:
    *   動詞問句: Do they look after?
    *   受詞線索 (Clue): the eggs
    *   時間問句: Do they usually look after the eggs?
    *   最終直述句: They usually look after the eggs.
*   **現在進行式**:
    *   動詞問句: Are they tasting?
    *   受詞線索 (Clue): the flower
    *   時間問句: Are they tasting the flower right now?
    *   最終直述句: They are tasting the flower right now.
*   **未來簡單式**:
    *   動詞問句: Will they land?
    *   受詞線索 (Clue): on the tree
    *   時間問句: Will they land on the tree next morning?
    *   最終直述句: They will land on the tree next morning.

---

## 7. 開發測試專用連結 (Debug Links)

如果您想要跳過 Phase 1 的對話調查，直接進入特定案件的 Phase 2 (結案報告) 畫面測試：

1. 開啟遊戲網頁。
2. 在網址列後面加上 `?debug=phase2&case=案件編號`。
   * 例如要直接測試 `c_001` (找嫌犯 1) 的結案報告：
     👉 **[點我複製網址後綴：`?debug=phase2&case=c_001`](?debug=phase2&case=c_001)**
   * 測試 `c_002` (找嫌犯 2) 的結案報告：
     👉 **[點我複製網址後綴：`?debug=phase2&case=c_002`](?debug=phase2&case=c_002)**
   * 測試 `c_005` (科普記者 1) 的結案報告：
     👉 **[點我複製網址後綴：`?debug=phase2&case=c_005`](?debug=phase2&case=c_005)**

---

## 8. Phase 2 (結案報告) 畫面流程與驗證機制

當玩家完成 Phase 1 (四個時態的提問)，或透過 Debug 連結直接進入 Phase 2 時，系統會執行以下流程：

1. **氛圍切換**：暫停原本的懸疑音樂，播放無版權且振奮人心的結案背景音樂。隱藏 NPC 對話與剪影，顯示「調查報告總結」的紙本介面。
2. **線索回顧**：系統會自動列出剛剛玩家在四個時態中取得的關鍵線索，包含「主詞 (Pronoun)」、「動詞 (Verb)」與「時間 (Time)」。
   * *範例*：`[ 線索 1: Past ] 主詞：He | 動詞：leave | 時間：last night`
3. **整句輸入**：玩家必須根據這兩個線索，在輸入框中打出正確且完整的**最終直述句 (Statement)**。
   * *範例*：玩家需手動輸入 `He left the museum last night.`
4. **驗證與回饋**：
   * 點擊「提交報告」後，系統會忽略大小寫與標點符號進行字串比對。
   * **完全正確**：輸入框呈現綠色，並顯示調查目標(兇手/科普主角)的完整圖片與「CASE CLOSED」的大印章動畫，顯示完成按鈕。
   * **有錯誤**：輸入框呈現紅色，並跳出提示要求玩家檢查紅框處的拼字或文法並重新輸入。