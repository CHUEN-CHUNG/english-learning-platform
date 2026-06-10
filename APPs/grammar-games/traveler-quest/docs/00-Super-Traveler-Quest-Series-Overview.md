# PRD：How Series — ✈️ Super Traveler Quest（系列總覽）

**更新日期**：2026-05-19

---

## 1. 系列定位

| 項目 | 說明 |
|------|------|
| **系列名稱** | How Series — ✈️ Super Traveler Quest |
| **入口** | [文法大廳 WH 分頁](/apps/grammar-hub/index.html?tab=wh) → **How Series — ✈️ Super Traveler Quest** |
| **學習主軸** | WH- 問句中的 **How** 系列：交通、狀態、頻率、時間長度、價格與數量 |
| **對應講義** | WHQA 講義 Unit 7–9（How / How often / How long / How much·many） |
| **遊戲型態** | 三關獨立 SPA（非四選一引擎），手動輸入 + NPC 對話泡泡 |

---

## 2. 關卡一覽

| 關卡 | 產品名稱 | 實作路徑 | 獨立 PRD |
|------|----------|----------|----------|
| Level 1 | Transport & Status | `apps/grammar-games/traveler-quest/level1-journey/` | [Level-1-Transport-and-Status-PRD.md](./Level-1-Transport-and-Status-PRD.md) |
| Level 2 | New Class Icebreakers | `apps/grammar-games/traveler-quest/level2-itinerary/` | [Level-2-New-Class-Icebreakers-PRD.md](./Level-2-New-Class-Icebreakers-PRD.md) |
| Level 3 | Souvenir Shopping Spree | `apps/grammar-games/traveler-quest/level3-souvenir/` | [Level-3-Souvenir-Shopping-PRD.md](./Level-3-Souvenir-Shopping-PRD.md) |

**Vite 建置入口**（`vite.config.ts`）：

- `grammar_traveler_level1` → `level1-journey/index.html`
- `grammar_traveler_level2` → `level2-itinerary/index.html`
- `grammar_traveler_level3` → `level3-souvenir/index.html`

**根目錄 redirect**：`apps/grammar-games/traveler-quest/index.html` → 導回文法大廳 WH 分頁。

---

## 3. 題庫與內容來源（總表）

Traveler Quest **關卡內互動題** 目前以各關 `src/main.ts` 內建資料為準；下列 CSV 為**同主題題庫／延伸練習／命題參考**，路徑皆在 repo 內：

| 用途 | 檔案路徑 | 使用方式 |
|------|----------|----------|
| Level 1 · 交通／狀態（打地鼠 · 約 15 分） | [`WHQA-How-Units9-10-MC.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-How-Units9-10-MC.csv) | 文法大廳 → `finish/multiple-choice?unit=WHQA-How-Units9-10-MC`；**關卡本體**見 `level1-journey/src/main.ts` |
| Level 2 · How often / How long（打地鼠 · 約 15 分） | [`WHQA-How-Units11-12-MC.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-How-Units11-12-MC.csv) | 文法大廳 → `finish/multiple-choice?unit=WHQA-How-Units11-12-MC`；**關卡本體**見 `level2-itinerary/src/main.ts` |
| Level 3 · How much / How many（打地鼠 · 約 15 分） | [`WHQA-How-Unit14-Quantity-MC.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-How-Unit14-Quantity-MC.csv) | 文法大廳 → `finish/multiple-choice?unit=WHQA-How-Unit14-Quantity-MC`；**關卡本體**見 `level3-souvenir/src/main.ts` |
| （舊版精簡 MC，可選） | `WHQA-Traveler-Level1-MC.csv`、`WHQA-Traveler-Level3-MC.csv` | 同 `finish/multiple-choice` 載入 |
| Level 2 · 重組參考 | [`WHQA-Traveler-Level2-Unscramble.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-Traveler-Level2-Unscramble.csv) | 可經 `finish/unscramble` 載入 |
| （舊版精簡 MC，可選） | `WHQA-Traveler-Level1-MC.csv`、`WHQA-Traveler-Level3-MC.csv` | 同 `finish/multiple-choice` 載入 |
| Level 2 · 重組參考 | [`WHQA-Traveler-Level2-Unscramble.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-Traveler-Level2-Unscramble.csv) | 可經 `finish/unscramble` 載入 |
| WHQA 共通易錯（填空參考） | [`Content/grammar/Grammar-Basic/WHQA+Dummy Subject/WHQA-CommonMistakes-Fillin.csv`](../../../../Content/grammar/Grammar-Basic/WHQA+Dummy%20Subject/WHQA-CommonMistakes-Fillin.csv) | 其他文法遊戲模組；非 Traveler 關卡直接載入 |

---

## 4. 通關與進度（localStorage）

| Key | 關卡 |
|-----|------|
| `traveler_quest_level1_complete` | Level 1 |
| `traveler_quest_level2_complete` | Level 2 |
| `traveler_quest_level3_complete` | Level 3 |

文法大廳 WH 分頁：三關皆完成時顯示 **Journey Complete** 區塊。

---

## 5. 共用技術

| 元件 | 路徑 |
|------|------|
| NPC 對話 UI | `apps/grammar-games/traveler-quest/shared/npc-ui.ts`、`traveler-npc.scss` |
| 成績／錯題 | `shared/game-core/GrammarScoreboard.ts` |
| 學習追蹤 | `shared/game-core/GrammarDataTracker.ts` |
| 登入 | `shared/utils/ProgressTracker`（須先從文法大廳登入） |
| 學習追蹤 | `shared/game-core/GrammarDataTracker.ts` |
| 登入 | `shared/utils/ProgressTracker`（須先從文法大廳登入） |
| 學習追蹤 | `shared/game-core/GrammarDataTracker.ts` |
| 登入 | `shared/utils/ProgressTracker`（須先從文法大廳登入） |
