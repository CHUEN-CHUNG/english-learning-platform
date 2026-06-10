# 🚔 Time Cop NYC — 時空戰警：紐約時空救援任務

> **文法焦點：** When / What time ＆ 時間介係詞 in / on / at（含零介係詞陷阱）  
> **遊戲類型：** 情境解謎 RPG（多關卡闖關）  
> **適合對象：** 國中∼高中 / 成人初學英文學生  
> **預計遊玩時間：** 每關 10–15 分鐘，共三關 ≈ 40 分鐘

---

## 🌆 世界觀

大反派**怪盜 Dr. Chronos** 竊走了紐約市的「**時間碎片**」，導致：
- 中央車站的時刻表全部清空
- 感恩節、國慶日等節日從日曆上消失
- 所有 this / next / last / every 開頭的日期被強制加上錯誤介係詞，讓時空陷入混亂

玩家扮演菁英**「時空戰警 (Time Cop)」**，需依序完成三個任務關卡，修復時空裂縫。

---

## 🗺️ 關卡總覽

| 關卡 | 代號 | 地點（美式情境） | 核心文法 | 題型 | CSV 檔 |
|------|------|-----------------|---------|------|--------|
| Level 1 | `morning-chaos` | 中央車站 (Grand Central) | `at` + 精確時刻、When vs. What time | 選擇題 (MC) | `TimeCop-L1-MorningChaos-MC.csv` |
| Level 2 | `lost-holidays` | 時代廣場 ＋ 感恩節餐廳 | `on` + 特定日子、`in` + 長時段 | 填空題 (Fill-in) + 排句題 (Unscramble) | `TimeCop-L2-LostHolidays-Fillin.csv`、`TimeCop-L2-LostHolidays-Unscramble.csv` |
| Level 3 | `zero-trap` | 直升機追逐：怪盜巢穴 | 零介係詞陷阱（this/next/last/every/tomorrow...） | 錯誤改正 (Correction) | `TimeCop-L3-ZeroTrap-Correction.csv` |

---

## 🎮 遊戲化機制（Octalysis 八核心）

| # | 核心動力 | 實作機制 |
|---|---------|---------|
| 1 | 重大使命 | 開場動畫：局長宣布「全紐約 800 萬人的生活秩序都靠你！」；每破一關解鎖地標恢復動畫 |
| 2 | 進度與成就 | 蒐集「時空水晶 🔮」；警徽升階：Rookie → Detective → Master Time Lord；全伺服器本週破案排行榜 |
| 3 | 創造力回饋 | 破關後開放「沙盒模式」：自製一週行程表並出題挑戰同學；出題成功可獲額外積分 |
| 4 | 所有權占有 | 完美通關（零錯誤）機率掉落**稀有外觀裝備**（自由女神探員帽、感恩節火雞警徽、百老匯西裝）；需集滿全套 |
| 5 | 社會影響力 | 雙人協力突襲：A 必須問 "What time is the backup arriving?"，B 看線索回答，雙方互相糾正 |
| 6 | 稀缺迫切 | 週末隨機推播「突發時空裂縫 Flash Alert」：限時 10 分鐘、5 題，掉落傳說級道具 |
| 7 | 不確定好奇 | 打敗 Boss 掉落「神祕時空膠囊」：內容物隨機（極品裝備 / 大量積分 / 惡作劇干擾畫面） |
| 8 | 損失避免 | 連續三次犯「常見錯誤」（如 in Monday、on tomorrow），已修復地標暫時變廢墟；扣除持有水晶 |

---

## 📋 CSV 欄位規格

所有 CSV 均以 **UTF-8 with BOM** 儲存，含逗號的欄位用雙引號包住。

---

### Level 1 — 選擇題 `TimeCop-L1-MorningChaos-MC.csv`

> 對應現有格式：`WHQA-Traveler-Level1-MC.csv`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `GrammarPoint` | string | 對應文法標籤，格式：`TimeCop_WhenWhatTime` / `TimeCop_TimePrep_At` |
| `SceneContext` | string | **★新增** 情境小敘述（1∼2 句），讓題目融入故事，如 `The departure board is broken. A commuter asks:` |
| `QuestionText` | string | 題幹，含填空底線 `___` |
| `OptionA` | string | 選項 A |
| `OptionB` | string | 選項 B |
| `OptionC` | string | 選項 C |
| `OptionD` | string | 選項 D |
| `CorrectAnswer` | A/B/C/D | 正確選項代號 |
| `DistractorLogic` | string | 干擾選項邏輯說明（中文，供教師檢核） |
| `Explanation` | string | 答對/答錯時顯示的詳細解說（可中文） |
| `TimesCrystalReward` | integer | **★新增** 答對可得時空水晶數（難題給 3，基礎題給 1） |

---

### Level 2-A — 填空題 `TimeCop-L2-LostHolidays-Fillin.csv`

> 對應現有格式：`WHQA-CommonMistakes-Fillin.csv`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `GrammarPoint` | string | 文法標籤，如 `TimeCop_TimePrep_On` / `TimeCop_TimePrep_In` |
| `SceneContext` | string | **★新增** 情境小敘述 |
| `QuestionText` | string | 題幹（填空格以 `___` 表示） |
| `PrimaryAnswer` | string | 主要正確答案 |
| `AcceptedAlternatives` | string | 其他接受的答案，以 `\|` 分隔（無則填 `-`） |
| `CaseSensitive` | TRUE/FALSE | 是否區分大小寫 |
| `CommonMistake` | string | 最常見的錯誤答案 |
| `TargetedFeedback` | string | 針對錯誤答案的即時回饋訊息 |
| `HintText` | string | 提示文字（按「Hint」按鈕後顯示） |
| `Explanation` | string | 詳細解說 |
| `TimesCrystalReward` | integer | **★新增** 答對可得時空水晶數 |

---

### Level 2-B — 排句題 `TimeCop-L2-LostHolidays-Unscramble.csv`

> 對應現有格式：`WHQA-Traveler-Level2-Unscramble.csv`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `GrammarPoint` | string | 文法標籤 |
| `SceneContext` | string | **★新增** 情境小敘述 |
| `TargetSentence` | string | 正確完整句子 |
| `ScrambledParts` | string | 以 `\|` 分隔的單字/片語牌組（學生需排序） |
| `DistractorParts` | string | 以 `\|` 分隔的干擾牌（答案不需要這些字） |
| `CapitalizationHint` | TRUE/FALSE | 是否提示句首大寫 |
| `PunctuationHint` | TRUE/FALSE | 是否提示句尾標點 |
| `Explanation` | string | 詳細解說 |
| `TimesCrystalReward` | integer | **★新增** 答對可得時空水晶數 |

---

### Level 3 — 錯誤改正 `TimeCop-L3-ZeroTrap-Correction.csv`

> 對應現有格式：`WHQA-CommonMistakes-Fillin.csv`（改正版變體）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `GrammarPoint` | string | 文法標籤，如 `TimeCop_ZeroPrep_Next` / `TimeCop_ZeroPrep_Tomorrow` |
| `SceneContext` | string | **★新增** 情境：描述怪盜丟出的「時空炸彈」上標示的時間短語 |
| `WrongSentence` | string | **★新增** 含有錯誤介係詞的完整句子（即怪盜的陷阱） |
| `ErrorPhrase` | string | **★新增** 錯誤片語（標示錯誤位置，如 `on tomorrow`） |
| `CorrectSentence` | string | **★新增** 修正後的正確句子 |
| `CorrectPatterns` | string | 正則接受格式，以 `;;` 分隔（勿用 `\|`） |
| `TrapTriggerWord` | string | **★新增** 觸發零介係詞規則的關鍵字（`this`/`next`/`last`/`every`/`tomorrow`/`yesterday`/`today`） |
| `BombDefuseHint` | string | **★新增** 倒數時顯示的解題提示（配合「炸彈倒數」機制） |
| `Explanation` | string | 詳細解說（答對後顯示） |
| `TimesCrystalReward` | integer | **★新增** 成功拆彈可得時空水晶數（Level 3 難度較高，建議 2∼3 顆） |

---

### 補充：NPC 對白卡 `TimeCop-NPC-Dialogues.csv`

> 串聯三關的故事 NPC（局長、苦主紐約客、怪盜 Dr. Chronos）對白，供遊戲引擎顯示劇情泡泡。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `DialogueId` | string | 唯一識別碼，如 `L1-INTRO-01` |
| `Level` | 1/2/3/BOSS | 所屬關卡 |
| `NpcName` | string | 說話角色名稱（如 `Chief Carter`、`NYC Commuter`、`Dr. Chronos`） |
| `NpcEmoji` | string | 角色 Emoji（如 👮‍♂️、🗽、🦹） |
| `DialogueText` | string | 英文對白（道地美式口語） |
| `ChineseSubtitle` | string | 中文字幕（家教補充理解用） |
| `TriggerCondition` | string | 觸發時機，如 `on_level_start`、`on_correct`、`on_wrong`、`on_boss_defeated` |

---

## 📁 資料夾結構

```
WHQA+Dummy Subject/
└── TimeCop-NYC/
    ├── README.md                              ← 本文件（遊戲設計書 + CSV 規格）
    ├── TimeCop-L1-MorningChaos-MC.csv        ← Level 1 選擇題
    ├── TimeCop-L2-LostHolidays-Fillin.csv    ← Level 2 填空題
    ├── TimeCop-L2-LostHolidays-Unscramble.csv← Level 2 排句題
    ├── TimeCop-L3-ZeroTrap-Correction.csv    ← Level 3 錯誤改正
    └── TimeCop-NPC-Dialogues.csv             ← NPC 對白卡
```

---

## 📝 各 CSV 範例題目

### Level 1 MC — 中央車站早晨大混亂

```
GrammarPoint,SceneContext,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,DistractorLogic,Explanation,TimesCrystalReward
TimeCop_WhenWhatTime,"The departure board is blank! A panicked commuter asks the station officer:","___ does the 8:15 train to Boston leave?",Where,When,What time,How,C,"When 範圍太大（可含日期月份），此處問精確班次時刻應用 What time",問「幾點」的精確時刻要用 What time；When 雖也可接受時刻，但這裡答案是 8:15（具體分鐘數），考試首選 What time。,2
TimeCop_TimePrep_At,"A barista at the Grand Central Starbucks lost track of time. She needs to know:","My shift starts ___ 6:30 in the morning.",in,on,at,with,C,"in 用於長時段，on 用於特定日子，at 才用於精確時刻","具體時刻（如 6:30）前用 at；in 接長時段（in the morning）；on 接特定日子（on Monday）。",1
TimeCop_WhenWhatTime,"Two officers discuss the suspect's last known schedule:","___ was Dr. Chronos last seen at Times Square?",What time,Where,When,How,C,"Where 問地點；How 問狀態或交通；此處可接受廣泛時間回答（Last Tuesday at midnight），選 When","When 範圍廣，可接受『上週二』這類大範圍時間答案；若題目只要問幾點幾分，才選 What time。",2
TimeCop_TimePrep_At,"The clock in the station café still works! The officer reads:","The coffee shop opens ___ noon.",in,on,at,by,C,"noon 是固定時段用語（固定時刻），用 at；in 用於早/午/晚段，但 noon 本身是固定點不是段","at noon（正午）、at midnight（午夜）、at night（晚上）都是固定搭配。",1
```

---

### Level 2 填空題 — 消失的美國節慶

```
GrammarPoint,SceneContext,QuestionText,PrimaryAnswer,AcceptedAlternatives,CaseSensitive,CommonMistake,TargetedFeedback,HintText,Explanation,TimesCrystalReward
TimeCop_TimePrep_On,"The Thanksgiving parade route has disappeared from the calendar! Restore it:","Thanksgiving is ___ the fourth Thursday of November.",on,-,FALSE,in,"in 用於月份或長時段，但這裡是特定那一天（第四個週四），要用 on。","特定的某一天（第幾個週幾）前面用哪個介係詞？","特定日子（某星期幾、日期、my birthday）前面用 on。",2
TimeCop_TimePrep_In,"4th of July fireworks in NYC need to be rescheduled. The officer files a report:","The fireworks show is ___ July.",in,-,FALSE,on,"on 接特定日，但 July 是整個月份，要用 in。","July 是月份還是特定一天？月份要用哪個介係詞？","月份（January–December）和年份前面用 in。",1
TimeCop_TimePrep_On,"A Broadway show ticket has a blank date field:","The show is ___ Friday evening.",on,-,FALSE,in,"星期幾（Monday∼Sunday）是特定日子，要用 on，不可以用 in。","星期幾前面用哪個介係詞？","星期幾前面固定用 on（on Monday, on Friday evening）。",1
TimeCop_TimePrep_In,"The Christmas tree lighting at Rockefeller Center needs a season tag:","The tree lighting happens ___ winter.",in,-,FALSE,on,"季節（spring/summer/fall/winter）是長時段，要用 in，不用 on。","winter 是一個季節（長時段），要用哪個介係詞？","季節（in spring, in summer, in winter）前面用 in。",1
TimeCop_TimePrep_In,"The NYPD annual report needs a year field:","Dr. Chronos first struck ___ 2024.",in,-,FALSE,on,"年份是長時段，用 in，不用 on。","年份（2024、1999）前面用哪個介係詞？","年份前面用 in（in 2024, in 1999）。",1
```

---

### Level 2 排句題 — 消失的美國節慶

```
GrammarPoint,SceneContext,TargetSentence,ScrambledParts,DistractorParts,CapitalizationHint,PunctuationHint,Explanation,TimesCrystalReward
TimeCop_TimePrep_On,"Restore the parade schedule by arranging the time clue correctly:","The parade starts on July 4th.","The|parade|starts|on|July|4th.","in|at",TRUE,FALSE,"特定日期（July 4th）是一個特定日子，前面用 on，不用 in 或 at。",2
TimeCop_TimePrep_In,"The officer needs to file the incident report with the correct time period:","The crime happened in the morning.","The|crime|happened|in|the|morning.","on|at|a",TRUE,FALSE,"morning / afternoon / evening 是一天中的時段（較長），前面用 in the morning，注意要加 the。",1
TimeCop_WhenWhatTime,"A witness needs to be interviewed. Type the correct question:","What time does the show start?","What|time|does|the|show|start?","When|do|is",TRUE,FALSE,"問精確的開演時刻，用 What time；一般動詞 start 需助動詞 does（主詞 the show 是第三人稱單數）。",2
TimeCop_TimePrep_On,"Restore the missing birthday party invitation:","Her birthday party is on May 12th.","Her|birthday|party|is|on|May|12th.","in|at|the",TRUE,FALSE,"日期（May 12th）是特定一天，前面用 on。",1
```

---

### Level 3 錯誤改正 — 怪盜時空炸彈

```
GrammarPoint,SceneContext,WrongSentence,ErrorPhrase,CorrectSentence,CorrectPatterns,TrapTriggerWord,BombDefuseHint,Explanation,TimesCrystalReward
TimeCop_ZeroPrep_Tomorrow,"Dr. Chronos planted a bomb with this time phrase. Defuse it by correcting the sentence:","The mission briefing is on tomorrow.","on tomorrow","The mission briefing is tomorrow.","[Tt]he mission briefing is tomorrow\\.","tomorrow","tomorrow 前面絕對不加介係詞！直接刪掉 on！","this / that / next / last / every / today / tomorrow / yesterday 這類字前面不加 in/on/at，直接使用即可。❌ on tomorrow → ✅ tomorrow",3
TimeCop_ZeroPrep_LastYear,"A fake evidence file shows an incorrect date. Find and fix the error:","Dr. Chronos escaped in last year.","in last year","Dr. Chronos escaped last year.","[Dd]r\\.? Chronos escaped last year\\.","last","last 前面不加介係詞！直接刪掉 in！","last year / last week / last month 前面直接使用，不加 in/on/at。❌ in last year → ✅ last year",3
TimeCop_ZeroPrep_NextWeek,"The alert shows the wrong schedule. Fix the preposition error:","The operation starts on next Monday.","on next Monday","The operation starts next Monday.","[Tt]he operation starts next Monday\\.","next","next 前面不加介係詞！直接刪掉 on！","next + 時間（next week / next Monday / next year）前面不加 in/on/at。❌ on next Monday → ✅ next Monday",3
TimeCop_ZeroPrep_Every,"The patrol schedule has a typo. Fix it:","We check the perimeter at every night.","at every night","We check the perimeter every night.","[Ww]e check the perimeter every night\\.","every","every 前面不加介係詞！直接刪掉 at！","every + 時間（every day / every morning / every week）前面不加 in/on/at。❌ at every night → ✅ every night",2
TimeCop_ZeroPrep_This,"A witness statement has an error. Find and correct it:","I saw the suspect on this morning.","on this morning","I saw the suspect this morning.","[Ii] saw the suspect this morning\\.","this","this 前面不加介係詞！直接刪掉 on！","this + 時間（this morning / this week / this year）前面不加 in/on/at。❌ on this morning → ✅ this morning",2
TimeCop_ZeroPrep_Today,"The final evidence log has one last error. Fix it to unlock the vault:","Dr. Chronos will be arrested in today.","in today","Dr. Chronos will be arrested today.","[Dd]r\\.? Chronos will be arrested today\\.","today","today 前面不加介係詞！直接刪掉 in！","today / yesterday / tomorrow 直接使用，不加任何介係詞。❌ in today → ✅ today",3
```

---

### NPC 對白卡

```
DialogueId,Level,NpcName,NpcEmoji,DialogueText,ChineseSubtitle,TriggerCondition
L1-INTRO-01,1,Chief Carter,👮‍♂️,"Time Cop! Grand Central is in chaos — the departure board is completely blank. 8 million New Yorkers are stranded. Only YOU can restore the schedule!","時空戰警！中央車站大亂——8百萬紐約客需要你！",on_level_start
L1-CORRECT-01,1,NYC Commuter,🗽,"Oh thank goodness! The 8:15 train is back on the board! You're a lifesaver!","太感謝了！8:15的班次回來了！你是救星！",on_correct
L1-WRONG-01,1,Dr. Chronos,🦹,"Ha! Wrong preposition! The time cracks grow wider! Try again, little cop!","哈！介係詞錯了！時空裂縫擴大了！再試試吧！",on_wrong
L2-INTRO-01,2,Chief Carter,👮‍♂️,"The holidays are gone, Time Cop! Thanksgiving, 4th of July, Christmas — all vanished from the city calendar. Find them using the right time prepositions!","節日全部消失了！用正確的介係詞找回它們！",on_level_start
L2-HOLIDAY-FOUND,2,NYC Commuter,🗽,"Thanksgiving is back! I can smell the turkey already! on the fourth Thursday — perfect!","感恩節回來了！我已經聞到火雞香了！",on_correct
L3-INTRO-01,3,Chief Carter,👮‍♂️,"Final showdown! Dr. Chronos is dropping time bombs with FAKE prepositions — on tomorrow, in last year... Defuse each bomb by correcting the sentence before time runs out!","最終決戰！怪盜丟出假介係詞炸彈——在倒數結束前找出錯誤修正句子！",on_level_start
L3-BOMB-DEFUSED,3,NYC Commuter,🗽,"BOOM... wait, it didn't explode! You removed the fake preposition just in time! The city is saved!","沒爆炸！你及時刪掉了假介係詞！城市得救了！",on_correct
L3-BOSS-DEFEATED,BOSS,Dr. Chronos,🦹,"Impossible! My zero-preposition traps were flawless! How did you— NOOOO!","不可能！我的零介係詞陷阱無懈可擊！你怎麼——不！",on_boss_defeated
L3-VICTORY,BOSS,Chief Carter,👮‍♂️,"Outstanding work, Master Time Lord! New York is restored. The time crystals are yours. The city will never forget your name!","太出色了！紐約市已恢復正常。時空水晶是你的！城市永遠記得你的名字！",on_level_complete
```

---

## 🔮 時空水晶計算參考

| 情況 | 水晶數 |
|------|--------|
| 正確回答基礎題（Level 1/2） | +1 |
| 正確回答進階題（When vs. What time 辨別） | +2 |
| 成功拆彈（Level 3，首次作答） | +3 |
| 完美通關（該關零錯誤） | 額外 +5 |
| 連續答對 3 題（Combo Bonus） | 額外 +2 |
| 犯三次「常見錯誤清單」中的錯誤 | −3（城市廢墟化） |

---

## ✅ 常見錯誤對照表（Level 3 炸彈來源）

依講義 `WHQA+Dummy Subject-Handout.md` B.1 零介係詞陷阱整理：

| ❌ 錯誤寫法 | ✅ 正確寫法 | 觸發關鍵字 |
|-----------|-----------|-----------|
| on tomorrow | tomorrow | tomorrow |
| in last year | last year | last |
| on next Monday | next Monday | next |
| at every night | every night | every |
| on this morning | this morning | this |
| in today | today | today |
| on yesterday | yesterday | yesterday |
| in that week | that week | that |

---

## 🛠️ 編輯注意事項

1. 含逗號的欄位請用**雙引號**包住。
2. `CorrectPatterns` 使用 **JavaScript 正則字串**（不含首尾 `/`），多組以 `;;` 分隔。
3. `ScrambledParts` 和 `DistractorParts` 以 `|` 分隔。
4. `AcceptedAlternatives` 以 `\|` 分隔（與正則的 `|` 有別，請留意）。
5. `TimesCrystalReward` 必須為正整數（1∼5）。
6. 修改 CSV 後重新整理遊戲頁面即可（開發模式熱更新）。

---

*Time Cop NYC 由 When / What time ＆ in / on / at 單元衍生，完整文法講義請參閱同目錄 `WHQA+Dummy Subject-Handout.md`。*
