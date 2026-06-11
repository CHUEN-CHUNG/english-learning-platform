# Super Traveler Quest — 情境題庫 CSV

How Series — ✈️ Super Traveler Quest 三關遊戲的**情境題目**與舊版 MC/Unscramble 題庫分開存放。

## 檔案對照

| 遊戲 | CSV 檔 |
|------|--------|
| ✈️ Transport & Status | `Transport-Status-Destinations.csv`、`Transport-Status-StatusCards.csv` |
| 🎒 New Class Icebreakers | `New-Class-WheelActivities.csv`、`New-Class-Classmates.csv`、`New-Class-NpcFreqAnswers.csv` |
| 🛍️ Souvenir Shop | `Souvenir-Shop-Items.csv`、`Souvenir-Shop-NpcErrors.csv` |

### 打地鼠選擇題（文法大廳入口 · 各約 15 分鐘）

| 關卡 | 題庫 CSV | `unit` 參數 |
|------|----------|-------------|
| ✈️ Transport & Status | [`../WHQA-How-Units9-10-MC.csv`](../WHQA-How-Units9-10-MC.csv) | `WHQA-How-Units9-10-MC` |
| 🎒 New Class Icebreakers | [`../WHQA-How-Units11-12-MC.csv`](../WHQA-How-Units11-12-MC.csv) | `WHQA-How-Units11-12-MC` |
| 🛍️ Souvenir Shop | [`../WHQA-How-Unit14-Quantity-MC.csv`](../WHQA-How-Unit14-Quantity-MC.csv) | `WHQA-How-Unit14-Quantity-MC` |

載入：`apps/grammar-games/finish/multiple-choice/?unit=…`（與關卡本體分離，可反覆練習）。

程式載入：`apps/grammar-games/traveler-quest/shared/traveler-quest-bank.ts`

## 欄位說明

### Transport-Status-Destinations.csv
| 欄位 | 說明 |
|------|------|
| Label | 轉盤／目的地名稱 |
| Question | 交通方式題幹（How do you go to…?） |

### Transport-Status-StatusCards.csv
| 欄位 | 說明 |
|------|------|
| Id | 卡片代碼 |
| Emoji | 狀態表情 |
| Label | 英文標籤 |
| NpcQuestion | NPC 問句 |
| ExpectedPatterns | 多組正則，以 `;;` 分隔（勿用 `\|`，那是正則裡的「或」） |
| Hint | 答錯提示 |

### New-Class-WheelActivities.csv
| 欄位 | 說明 |
|------|------|
| Id | 轉盤主題 id（勿重複） |
| Label | 轉盤顯示文字 |
| Activity | How often 句型用 |
| Verb | How long 句型用 |
| IsBe | `TRUE` = be 動詞活動（如 be sick） |

### New-Class-Classmates.csv
| 欄位 | 說明 |
|------|------|
| Emoji | 新同學頭像 |
| Label | 名字 |

### New-Class-NpcFreqAnswers.csv
| 欄位 | 說明 |
|------|------|
| Type | `be` 或 `regular` |
| Template | `{adj}` = be 後形容；`{activity}` = 活動片語 |

### Souvenir-Shop-Items.csv
| 欄位 | 說明 |
|------|------|
| Countable | `TRUE` / `FALSE` |
| UnitPrice | 單價（美元） |
| PriceDemo | 問價範例句 |

### Souvenir-Shop-NpcErrors.csv
| 欄位 | 說明 |
|------|------|
| CorrectPatterns | 學生糾正句需符合的正則（`;;` 分隔） |

## 編輯注意
- 含逗號的欄位請用雙引號包住。
- `ExpectedPatterns` / `CorrectPatterns` 使用 JavaScript 正則字串（不含首尾 `/`）。
- 修改 CSV 後重新整理遊戲頁面即可（開發模式會熱更新）。
