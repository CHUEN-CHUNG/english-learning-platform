# 打地鼠快速選擇題遊戲規格 (Fast Multiple Choice / Whack-a-Mole)

**模組路徑**：`APPs/grammar-games/finish/multiple-choice/`  
**題庫格式**：[`docs/sops/Grammar Question Guidelines/Grammar-Question-Schema-MultipleChoice.md`](../../../../docs/sops/Grammar%20Question%20Guidelines/Grammar-Question-Schema-MultipleChoice.md)  
**欄位範例**：[`Grammar/grammar-multiple-choice-rule.csv`](../../../../Grammar/grammar-multiple-choice-rule.csv)

---

## 1. 遊戲概念

- 上方固定顯示題幹（`___` 挖空高亮）。
- 下方 **3 欄 × 2 列 = 6 個地鼠洞**。
- 每題從 CSV 的 A～D 中**隨機抽選**，最多 **同時 3 隻**地鼠舉牌探出；約 **2.6 秒**後縮回，並持續輪替出現。
- 玩家用槌子游標點擊**舉著正確答案**的地鼠。
- **答對**：地鼠變綠、表情 🤩，短暫停留後自動下一題（不跳解析）。
- **答錯**：地鼠變紅、表情 😵；同一題可繼續打，**錯滿 3 次**扣 1 顆心並顯示 `Explanation`。
- **練習模式**（文法大廳一般入口）：**15 分鐘**（可 ±30 秒），題庫做完會洗牌重複。
- **任務模式**（URL 含 `questLevel=`）：**10 分鐘**，**答對 3 題**過關。

---

## 2. 選項與洞口映射（§2.4 隨機填充）

| 項目 | 規則 |
|------|------|
| 題庫選項 | 固定 4 個（A～D） |
| 洞口數 | 6 個（3×2） |
| 同時出現 | 最多 3 隻地鼠 |
| 指派邏輯 | 每隻地鼠隨機選一個洞口 + 隨機選一個選項文字舉牌 |
| 重複 | 同一選項可多次出現，增加干擾與反應練習 |

---

## 3. UI 規範

- 地鼠本體：🐹（答對 🤩、答錯 😵）。
- **木牌**（`.mole-sign`）顯示 `A. text`；長選項需 **Auto-fit** 縮字。
- 洞口底圖 `.hole-bg` 在後、地鼠與木牌在前（`z-index` 地鼠 > 洞口）。
- 桌面：地鼠區使用 🔨 槌子游標。
- Header：**不顯示分數**，僅進度、生命、計時（含 ±30 秒）。

---

## 4. 時態與 WH 問句 — 題庫與入口

文法大廳已連結下列單元；`unit` 參數須與 CSV **檔名（不含 `.csv`）** 完全一致。

### 4.1 時態 (Time Tenses) — 文法大廳「Time Tenses」分頁

| 單元 | `unit` 參數 | CSV 路徑 | 題數（約） |
|------|-------------|----------|------------|
| Present Simple | `Present-Simple-Choice` | `content/grammar/time-tense/Present-Simple/Present-Simple-Choice.csv` | 19 |
| Present Continuous | `Present-Continuous-Choice` | `content/grammar/time-tense/Present-Continuous/Present-Continuous-Choice.csv` | 29 |
| Past Simple | `Past-Simple-Choice` | `content/grammar/time-tense/Past-Simple/Past-Simple-Choice.csv` | 29 |
| Future Simple | `Future-Simple-Choice` | `content/grammar/time-tense/Future-Simple/Future-Simple-Choice.csv` | 29 |

**範例網址**（開發環境）：

```
/APPs/grammar-games/finish/multiple-choice/index.html?unit=Present-Simple-Choice
/APPs/grammar-games/finish/multiple-choice/index.html?unit=Past-Simple-Choice
```

### 4.2 WH 問句 (How Series) — 文法大廳「Wh- Questions」→ Super Traveler Quest

對應 `WHQA.md` 講義單元；與轉盤關卡分開，供 **15 分鐘打地鼠暖身／加強**。

| 講義／關卡 | `unit` 參數 | CSV 路徑 | 題數（約） |
|------------|-------------|----------|------------|
| 單元 9–10 · 交通與狀態 | `WHQA-How-Units9-10-MC` | `content/grammar/Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Units9-10-MC.csv` | 44 |
| 單元 11–12 · How often / How long | `WHQA-How-Units11-12-MC` | `content/grammar/Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Units11-12-MC.csv` | 48 |
| 單元 14 · How many / How much | `WHQA-How-Unit14-Quantity-MC` | `content/grammar/Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Unit14-Quantity-MC.csv` | 43 |

**範例網址**（含返回 WH 分頁）：

```
/APPs/grammar-games/finish/multiple-choice/index.html?unit=WHQA-How-Units9-10-MC&returnTo=../../grammar-hub/index.html?tab=wh
```

### 4.3 其他 WH 選擇題庫（可選連結）

| 用途 | `unit` 參數 | CSV |
|------|-------------|-----|
| Traveler L1 練習題庫 | `WHQA-Traveler-Level1-MC` | `WHQA-Traveler-Level1-MC.csv` |
| Traveler L3 練習題庫 | `WHQA-Traveler-Level3-MC` | `WHQA-Traveler-Level3-MC.csv` |

---

## 5. 技術備註

| 檔案 | 職責 |
|------|------|
| `index.html` | 6 洞版面、題幹、HUD、槌子游標 |
| `src/main.ts` | 動態出鼠、作答、計時、追蹤 |
| `src/csv-banks.ts` | 以 `import.meta.glob(..., ?url)` 載入題庫，避免與其他 chunk 錯位 |

建置後請用 **`npm run dev`** 或 **`npm run preview`** 測試；需 **Ctrl+F5** 強制重新整理。

---

## 6. 與泡泡選擇題的差異

| | 打地鼠 (本遊戲) | 泡泡選擇 |
|--|----------------|----------|
| 移動 | 固定洞口 | 選項飄動 |
| 節奏 | 探頭 / 消失 | 持續飄移 |
| 題庫 CSV | **相同九欄** | 相同 |
