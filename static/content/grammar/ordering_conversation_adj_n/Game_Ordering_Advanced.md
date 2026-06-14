# 🔴 點餐實境生存戰 (Restaurant Survival Game)

## 📌 遊戲概述
這是一款結合角色扮演、突發狀況處理以及語言限制的進階英文口說訓練遊戲。學生將扮演具有特殊需求的顧客，在真實的餐廳情境中點餐，並處理店員（老師）刻意製造的各種危機。

## 🎯 學習目標
*   學會在特定限制下（如飲食偏好、過敏、預算等）用英文表達需求。
*   訓練面對突發狀況（如送錯餐、帳單錯誤等）的客訴應變能力與溝通技巧。
*   強化實用點餐句型，並克服使用禁忌字（Want）的習慣。

## ⚙️ 遊戲設定 (PM & TL 視角)

### 🚨 核心機制：禁忌字大挑戰 (The Taboo)
*   **全域被動技能：** 在整個遊戲過程中，學生**絕對禁止**使用 "want" 這個字。
*   **觸發懲罰：** 一旦脫口而出（例如："I want..."），必須退回上一步，改用更禮貌、道地的句型（如："I'd like...", "I'll have...", "Could I get..."）重新表達。

### 📜 遊戲流程 (Game Flow)

#### Step 1: 抽取人設與限制條件 (Character & Constraint Assignment)
學生將隨機獲得一組「餐廳 + 限制條件」，這是他們本局遊戲的角色設定。

#### Step 2: 點餐挑戰 (The Order)
學生需根據分配到的餐廳與限制條件，向扮演店員的老師點餐。
*   **店員 (老師)：** 依照設定好的 `cashier_greeting` 招呼顧客。
*   **顧客 (學生)：** 必須在不使用 "want" 的情況下，成功點出符合限制條件的餐點。

#### Step 3: 危機爆發 (The Crisis Trigger)
當學生點完餐後，店員（老師）會故意製造一個危機（送錯餐、加錯料、帳單錯誤等）。
*   **店員 (老師)：** 依照設定好的 `crisis_trigger` 回應學生，交付錯誤的餐點或帳單。

#### Step 4: 危機處理 (Crisis Management)
學生必須立刻發現錯誤，並有禮貌地向店員反應。
*   **顧客 (學生)：** 再次強調，**不可使用 "want"**。必須明確指出錯誤在哪裡，並要求更換或修正。

---

## 🎭 劇本資料庫 (Scenario Database)

以下是遊戲中會遇到的 5 種餐廳情境與對應的危機設定：

### 🍔 Scenario 1: In-N-Out Burger
*   **菜單圖片：** `menus/in-n-out.jpg`
*   **顧客限制 (Condition)：** 正在減肥，要求醬料分開 (Spread on the side) 且低碳水 (Protein style)。
*   **店員招呼 (Cashier Greeting)：** "Hi, welcome to In-N-Out. What can I get for you today?"
*   **預期點餐 (Expected Order)：** "I'd like a cheeseburger, protein style, with the spread on the side, please."
*   **🔥 危機 (Crisis)：** 忘記客製化 (Missed Customization)
    *   **店員觸發 (Crisis Trigger)：** "Here's your protein style burger with the spread right on top. Enjoy!"
*   **預期應對 (Expected Response)：** "Excuse me, I asked for the spread on the side. Could you please remake this?"

### 🥤 Scenario 2: Shake Shack
*   **菜單圖片：** `menus/shake-shack.webp`
*   **顧客限制 (Condition)：** 預算只有 $10 (Budget under $10) 且趕時間只有 5 分鐘能吃 (In a rush)。
*   **店員招呼 (Cashier Greeting)：** "Hey there! What are we having today?"
*   **預期點餐 (Expected Order)：** "I'll have a ShackBurger to go, please. I'm in a rush."
*   **🔥 危機 (Crisis)：** 帳單錯誤 (Billing Error)
    *   **店員觸發 (Crisis Trigger)：** "Alright, with the regular fries, your total comes to $12.50."
*   **預期應對 (Expected Response)：** "Wait, I didn't order fries, and my budget is under $10. Can you take the fries off?"

### ☕ Scenario 3: Pret A Manger
*   **菜單圖片：** `menus/pret-a-manger.webp`
*   **顧客限制 (Condition)：** 乳糖不耐症 (Lactose intolerant)。
*   **店員招呼 (Cashier Greeting)：** "Hi! What can I get started for you?"
*   **預期點餐 (Expected Order)：** "I'll have a hot chocolate with almond milk, please. I'm lactose intolerant."
*   **🔥 危機 (Crisis)：** 過敏原危機 (Allergy Hazard)
    *   **店員觸發 (Crisis Trigger)：** "Here’s your almond milk hot chocolate with extra whipped cream on top!"
*   **預期應對 (Expected Response)：** "Oh, sorry, I can't have dairy. Whipped cream has dairy in it. Can I get a new one without it?"

### 🌯 Scenario 4: Chipotle
*   **菜單圖片：** `menus/chipotle.jpg`
*   **顧客限制 (Condition)：** 素食者 (Vegan/Vegetarian)。
*   **店員招呼 (Cashier Greeting)：** "Hi, what can I get for you? White or brown rice?"
*   **預期點餐 (Expected Order)：** "I'll do a veggie bowl with brown rice, and a regular fountain drink, please."
*   **🔥 危機 (Crisis)：** 尺寸錯誤 (Wrong Size)
    *   **店員觸發 (Crisis Trigger)：** "Here's your veggie bowl and your large fountain drink. That'll be $11.50."
*   **預期應對 (Expected Response)：** "Excuse me, I asked for a regular drink, not a large. Could you fix the size and the bill?"

### 🍝 Scenario 5: Olive Garden
*   **菜單圖片：** `menus/olive-garden.webp`
*   **顧客限制 (Condition)：** 對海鮮過敏 (Seafood allergy)。
*   **店員招呼 (Cashier Greeting)：** "Welcome to Olive Garden! What can I get started for you?"
*   **預期點餐 (Expected Order)：** "I'll have the Fettuccine Alfredo, please. I have a severe seafood allergy, so please be careful."
*   **🔥 危機 (Crisis)：** 送錯餐點 (Wrong Item)
    *   **店員觸發 (Crisis Trigger)：** "Here is your Shrimp Alfredo. Enjoy!"
*   **預期應對 (Expected Response)：** "Excuse me, I ordered the regular Fettuccine Alfredo. I'm allergic to seafood, so I can't eat this. Could you bring me the right dish?"

---

## 💡 PM & TL 備註與優化建議
1.  **資料庫擴充性：** 目前的情境已涵蓋常見的客訴與點餐變數。未來可持續擴增 `Restaurant_Scenarios.csv`，加入更多不同國家的餐廳或更奇葩的奧客情境，以增加遊戲耐玩度。
2.  **難度分級 (Leveling)：** 
    *   **初階：** 允許學生看著提示字卡（預期點餐/應對）練習。
    *   **進階：** 隱藏提示字卡，完全依賴即時反應，並嚴格執行「禁忌字」懲罰。
3.  **UI/UX 呈現：** 在開發成線上遊戲介面時，可將「限制條件」設計成盲盒或轉盤動畫，增加趣味性；「危機觸發」時可搭配警示音效或畫面震動，營造真實的壓力感。
