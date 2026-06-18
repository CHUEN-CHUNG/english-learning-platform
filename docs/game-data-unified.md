# 全平台統一遊戲數據（Unified Game Data）

本文件記錄平台所有遊戲「數據紀錄」的統一規格、各遊戲接法、教師端讀法，以及需要注意的事項。

> 背景：原本資料散落兩套平行系統——閱讀/單字存 `word_exam_all_data`（逐題叫 `reviewData`）、文法存 `grammar_platform_data`（逐題叫 `stats`），連登入名都用不同 key。現已整合成單一資料層。

---

## 1. 核心：單一資料層

- 程式位置：`src/lib/game-core/game-data.ts`
- 單一 storage key：**`platform_game_data`**
- 透過 `appStorage`（`StorageManager`）寫入，自動同步 localStorage / Firebase。

### 容器結構

```
platform_game_data = {
  [學生名稱]: UserGameData
}
```

### 型別定義

```ts
interface UserGameData {
  profile: { streak: number; totalSessions: number; lastPlayedDate: string };
  sessions: GameSession[];   // 完成與跳出都在這裡，用 status 區分
}

interface GameSession {
  id: string;
  gameType: string;          // 見下方 GAME_TYPES
  category: GameCategory | 'unknown';
  unitId: string;            // 規範化單元代碼
  unitTitle?: string;        // 顯示用單元名
  status: 'completed' | 'abandoned';
  date: string;              // ISO 8601
  durationMs: number;        // 全程耗時（毫秒，統一單位）
  score: number;
  maxScore: number;          // 滿分；0 代表不適用（純計分型）
  percent: number;           // 0–100（maxScore>0 時才有意義）
  questions: QuestionResult[];
  extra?: Record<string, unknown>; // 各遊戲特有資料的逃生艙
}

interface QuestionResult {
  prompt: string;            // 題目文字
  userAnswer?: string;       // 學生作答
  correctAnswer?: string;    // 正確答案
  isCorrect: boolean;
  timeMs?: number;           // 該題耗時（毫秒）
  tags?: string[];           // 文法點 / 錯誤類型等標籤
  metrics?: Record<string, number>; // clicks, wrongClicks, attaches, detaches, wrongSubmits...
}
```

### 寫入 API

```ts
import { gameData } from '$lib/game-core/game-data';

// 記錄一場（預設 completed）；未登入回傳 null 不寫入
gameData.record({ gameType, unitId, unitTitle?, durationMs, score, maxScore, questions?, extra? });

// 記錄中途跳出
gameData.recordAbandon({ gameType, unitId, ... });

// 讀取（教師端用）
gameData.getAllData();      // 本機 / cache
```

- `id`、`date`、`category`、`percent` 由系統自動補齊。
- `profile.streak`（連續天數）、`totalSessions` 自動維護。
- `sessions` 最多保留 200 筆（新到舊）。

---

## 2. 遊戲類型（GAME_TYPES）

集中於 `game-data.ts`，每個類型對應「分類」與「中文標籤」。

| gameType | category | 標籤 |
|---|---|---|
| `Matching` | vocab | 同反義詞連連看 |
| `Quiz` | vocab | 單字總測驗 |
| `Reading` | reading | 閱讀練習 |
| `MultipleChoice` | grammar | 打地鼠選擇題 |
| `Unscramble` | grammar | 火車重組 |
| `Correction` | grammar | 抓蟲改錯 |
| `FillIn` | grammar | 填空 |
| `AdjNp` | grammar | 形容詞＋名詞 |
| `Dialogue Roleplay` | speaking | 對話角色扮演 |
| `TravelerLevel1/2/3`、`TravelerLevel2Schedule` | quest | 旅人任務 |
| `TimeCop` | quest | 時間警察 |
| `RestaurantSurvival` | speaking | 餐廳求生 |

工具函式：`gameLabel(gameType)`、`gameCategory(gameType)`。

---

## 3. 各遊戲接法

| 遊戲 | 路由 | 接法 |
|---|---|---|
| 連連看 | `matching-game` | 直接 `gameData.record()` |
| 閱讀練習 | `reading-practice` | 直接 `gameData.record()` |
| 單字總測驗 | `vocabulary-quiz` | `gameData.record()`＋相容轉接：遊戲內歷史/複習/迷你面板透過 `getLegacyAllData()` 由統一層重建（分階段資料存在 `extra`） |
| 選擇題 / 重組 / 對話 / 旅人任務 | `games/multiple-choice`、`games/unscramble`、`games/dialogue-roleplay`、`games/traveler-quest/*` | 走 `GrammarDataTracker`（**內部已改寫為寫入 `gameData`**，遊戲端零修改） |

### GrammarDataTracker（`src/lib/game-core/GrammarDataTracker.ts`）

- 對外 API 不變：`startGame / startQuestion / endQuestion / endGame / setUserName / setUnitName`。
- `endGame()`：同時「寫入統一層」＋「回傳高保真 `GameSessionData`」供 `Scoreboard` 結算/檢討畫面使用（回傳值不另外持久化）。
- 逐題 `QuestionStat` → `QuestionResult`：`grammarPoint` 進 `tags`、`text`/`targetSentence` 進 `prompt`、各計量進 `metrics`。

---

## 4. 教師端讀法

全部改讀 `platform_game_data`，並沿用既有「跨使用者 Firestore 彙整」（`aggregateAcrossUsers`）。各面板以相容轉接把統一 `GameSession` 映射回自己 UI 需要的形狀（畫面不變）。

| 元件 | 說明 |
|---|---|
| `components/teacher/TutorDashboard.svelte` | 家教數據：直接吃 `GameSession`（名單平均/弱點/錯題） |
| `components/teacher/ReadingDataHub.svelte` | 取 `vocab` / `reading` 類場次 |
| `components/teacher/GrammarDataHub.svelte` | 取 `grammar` 類場次（含逐題 `stats` 重建） |
| `components/game/Scoreboard.svelte` | 遊戲內歷史榜：取逐題型遊戲（排除 vocab/reading）重建 `GameSessionData` |
| `components/game/TeacherDashboard.svelte` | 遊戲內嵌教師面板（5 連點＋密碼）：同上 |
| `lib/teacher-data.ts` | 閱讀單元卡開的 DOM 面板：`readingFromUnified()` / `grammarFromUnified()` |

### 跨使用者彙整（`src/lib/utils/teacher-aggregate.ts`）

- `aggregateAcrossUsers(['platform_game_data'])`：Firebase 模式讀整個 `users` collection、合併所有學生的 `sessions`；本機模式 fallback 讀 `appStorage`。
- 需要 `StorageManager.fetchAllUsers()`（讀 `users` collection）。

---

## 5. 注意事項 / 已知限制

1. **尚未記錄 session 的遊戲**：`correction`（抓錯改錯）、`fill-in`（填空）、`adj-np`（形容詞+NP）、`restaurant-survival`（餐廳求生）。
   - 這些遊戲本來就沒接任何儲存。統一層已備好，補上 `GrammarDataTracker` 呼叫或 `gameData.record()` 即可納入。
2. **通關旗標**：Time Cop / Traveler 的 `time_cop_levelX_complete`、`traveler_quest_*_complete`（在 `gameProgress` store）維持獨立——那是「通關打勾」，不是成績紀錄。
3. **登入名仍是兩個 key**：閱讀側 `currentUser`、文法側 `current_user`（尚未合一，避免破壞既有登入流程）。
   - 統一資料層在過渡期同時認得兩邊：`user.current ?? readingProgress.getCurrentUser()`。
4. **舊資料**：採「fresh 重新開始」策略，舊的 `word_exam_all_data` / `grammar_platform_data` / `grammar_choice_data` / `grammar_unscramble_data` 不做遷移。
   - `readingProgress.saveReadingGameResult()` 已無人呼叫（死碼）；但 `readingProgress` 仍負責「登入身份」與「閱讀大廳任務進度（progress checklist）」，故保留。

---

## 6. 驗證

- `npm run check`（svelte-check）：0 errors。


## 數據需求

全站層面：
1. 全站總遊玩人次
2. 全站總完賽人次
3. 全站中途跳出人數
4. 全站平均完賽時間
5. 全站最常錯單字 (Top 5)
6. 全站最常錯的文法 (Top 5)


單字每個遊戲的：
1. 得分 (單個/平均)
2. 耗時 (單個/平均)
3. 完成次數  (單個/平均)
4. 測驗時間  (單個/平均)
5. 跳出次數  (單個/平均)
6. 常錯單字  (單個/平均)
7. 每題是否正確（正確與錯誤答案都要顯示）(外開/彈窗)

文法每個遊戲的：
1. 得分 (單個/平均)
2. 耗時 (單個/平均)
3. 完成次數  (單個/平均)
4. 測驗時間  (單個/平均)
5. 跳出次數  (單個/平均)
6. 常錯文法  (單個/平均)
7. 每題是否正確（正確與錯誤答案都要顯示）(外開/彈窗)

家教學生數據
1. 閱讀理解能力評分
2. 字彙辨識能力評分
3. 字彙應用（片與重組）能力評分
4. 造句能力評分
5. 字彙推理能力評分
6. 文法應用能力評分
7. 學生最常錯的五個單字（跨單元）
8. 學生最常錯的五個文法（跨單元）
9. 學生錯題練習（跨單元）
9. 學生錯題練習（該單元）
10. 學生名字