# PRD：Level 3 — Souvenir Shopping Spree（紀念品大採購）

**更新日期**：2026-05-19  
**遊戲標題（UI）**：🛍️ Level 3: Souvenir Shopping Spree

---

## 1. 專案概述

| 項目 | 內容 |
|------|------|
| **產品名稱** | Souvenir Shopping Spree |
| **實作路徑** | [`apps/grammar-games/traveler-quest/level3-souvenir/`](../level3-souvenir/) |
| **主程式** | [`level3-souvenir/src/main.ts`](../level3-souvenir/src/main.ts) |
| **頁面** | [`level3-souvenir/index.html`](../level3-souvenir/index.html) |
| **情境** | 紀念品店採購任務 → 成功後成為店長，糾正奧客文法 |
| **NPC** | Shop Owner（`shopkeeper`）；Part B 為 Difficult Customer |
| **過關條件** | Part A：預算 **$200** 內買 **3** 樣；Part B：按 🔔 抓出 **2** 個錯句並改正 |

---

## 2. 題庫位置

### 2.1 關卡執行時題庫（權威來源）

| 資料 | 檔案 | 常數名稱 |
|------|------|----------|
| 商品池（價格、可數性、展示） | `level3-souvenir/src/main.ts` | `SHOP_ITEMS` |
| 奧客錯句場景（Part B） | `level3-souvenir/src/main.ts` | `NPC_ERRORS` |

`pickShopItems()` 每局從池中抽 3 樣（兼顧可數／不可數商品）。

### 2.2 延伸題庫 CSV（選擇題模組）

| 檔案 | 連結 |
|------|------|
| WHQA Traveler Level 3 MC | [`Content/grammar/Grammar-Basic/WHQA+Dummy Subject/WHQA-Traveler-Level3-MC.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-Traveler-Level3-MC.csv) |

- **GrammarPoint** 含 `WHQA_How_Quantity`（How much / How many 混淆等）。
- 可經 `finish/multiple-choice` 練習；**本關為店鋪互動，不讀此 CSV**。

---

## 3. 開場故事（Intro）

- 故事模式說明：$200 預算、問價、買 3 件禮物、當上店長、按鈴糾正客人。
- 按鈕：**Enter the shop**
- 版面：`story-intro-panel`（大字距、分段換行）

---

## 4. Part A — 向店老闆採購

### 4.1 單品流程

| 步驟 | 內容 |
|------|------|
| 貨架 | 顯示商品圖示；**複數**商品（如 apples）顯示 **3 個** emoji |
| 問價 | 學生輸入 **How much is/are …?**（須提到商品）；placeholder 保留句型提示 |
| 老闆答價 | 可數複數：They're $X **each**；單數／不可數：It's $X |
| 數量 | 可數：Two, please. / 數字 1–10；不可數：A little. / A lot. 等 |
| 預算 | 超支則拒絕並提示剩餘金額 |

### 4.2 常數

- `START_BUDGET = 200`
- `ITEMS_TO_BUY = 3`

---

## 5. Part B — The Shop Is Yours（找碴）

### 5.1 過場

- 故事卡：**The Shop Is Yours**
- 按鈕：**Open the shop door**

### 5.2 玩法

- 自 `NPC_ERRORS` 隨機抽 **2** 場景。
- 奧客說錯句 → 學生按 **🔔 STOP** → 輸入正確英文（`correctPatterns` / 與 `correctLine` 比對）。
- 範例錯句類型：How many water、How much are this、How much apples、How many money…

### 5.3 常數

- `ERRORS_TO_CATCH = 2`

---

## 6. UI／UX 要點

- 頂部：**Budget: $200 (spent $X)**
- 購物袋顯示已買商品 emoji
- 介面語言：**英文**
- 不提供秘密價格、完整問句答案於畫面上（僅 placeholder / 錯誤時例句）

---

## 7. 技術規格

| 項目 | 說明 |
|------|------|
| 追蹤單元 | `WHQA-Traveler-Level3-Souvenir` |
| 通關 key | `traveler_quest_level3_complete` |
| 成績板 | 同系列共用 `GrammarScoreboard` |
