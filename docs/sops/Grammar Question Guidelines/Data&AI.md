# 文法通則 (數據與AI)

本文件旨在指導未來的文法遊戲開發與設計，確保所有遊戲能在統一的數據追蹤與 UI 框架下穩定運行。

## 1. 核心模組架構

目前文法遊戲平台已將「遊戲核心邏輯」、「資料追蹤」與「教師儀表板」抽出作為共用模組，存放於 `shared/game-core/` 目錄下：

*   **`GrammarDataTracker.ts`**: 統一負責數據收集與 `localStorage` 的讀寫。它提供了統一的 API 來記錄遊戲開始、每題的答題狀況（包含特定遊戲的自訂指標）、以及遊戲結束的狀態。
*   **`GrammarDashboard.ts`**: 負責渲染教師儀表板 UI。它會自動讀取由 `GrammarDataTracker` 存入的統一資料庫 `grammar_platform_data`，並在畫面上生成統計圖表與錯誤分析。

## 2. 雙層資料結構設計 (LocalStorage)

為了兼顧「統一數據分析」與「特定遊戲深度追蹤」，我們採用雙層資料結構，儲存於 `localStorage` 的 `grammar_platform_data` 鍵值中。

### 第一層：全站共通資料 (Common Metrics)
這些資料是所有遊戲都必須具備的，用於計算平台整體的留存率、平均分數等大指標。
```typescript
interface GameSessionData {
  gameType: string;       // 例如 "MultipleChoice", "Unscramble"
  date: string;           // 遊玩日期時間
  unit: string;           // 測驗單元名稱 (例如 "Present-Simple-Choice")
  status: "completed" | "abandoned"; // 遊戲完成狀態
  score: number;          // 答對總題數
  duration: number;       // 總耗時(秒)
  livesLeft: number;      // 剩餘生命值 (若無此機制可傳入 0)
  totalQuestions: number; // 總題數
  events: GameEvent[];    // 漏斗事件紀錄 (例如 click_start)
  stats: QuestionStat[];  // 每題的詳細數據 (見第二層)
}
```

### 第二層：特定遊戲專屬資料 (Game-Specific Metrics)
每題的詳細數據 `stats` 中，除了共通的 `grammarPoint`、`isCorrect`、`timeMs` 之外，還允許各遊戲記錄專屬的行為指標。

```typescript
export interface QuestionStat {
  grammarPoint: string;
  isCorrect: boolean;
  timeMs: number;
  
  // -- 共通文字欄位 --
  text?: string;           // 選擇題的題目文字
  targetSentence?: string; // 重組題的目標正確句子

  // -- 特定遊戲行為指標 --
  clicks?: number;         // 選擇題：打擊總次數
  wrongClicks?: number;    // 選擇題：打錯地鼠次數
  wrongSubmits?: number;   // 共用 / 重組題：錯誤送出次數
  attaches?: number;       // 重組題：裝上車廂次數
  detaches?: number;       // 重組題：拆下車廂次數
}
```

## 3. 新增文法遊戲開發步驟

若要開發新的文法遊戲（例如：配對遊戲、聽寫遊戲），請遵循以下步驟：

### 步驟一：初始化 Tracker
在遊戲的 `main.ts` 頂部引入並初始化 `GrammarDataTracker`。
```typescript
import { GrammarDataTracker } from "../../../../shared/game-core/GrammarDataTracker";
const tracker = new GrammarDataTracker("YourNewGameType"); // 命名您的遊戲類型
```

### 步驟二：串接遊戲生命週期
*   **設定玩家與單元**：當玩家輸入名字與選擇單元時呼叫：
    ```typescript
    tracker.setUserName(userName);
    tracker.setUnitName(unitName);
    ```
*   **遊戲開始**：
    ```typescript
    tracker.startGame();
    tracker.logEvent("click_start");
    ```
*   **每題開始與更新**：
    ```typescript
    // 開始一題，傳入 文法點、題目文字、是否為重組題(如果是以句子為主的話填 true)
    tracker.startQuestion(currentGrammarPoint, questionText, false);

    // 遊戲進行中，記錄自訂行為 (例如記錄拖曳次數)
    tracker.updateCurrentQuestionStat({ yourCustomMetric: value });
    ```
*   **每題結束**：
    ```typescript
    tracker.endQuestion(isCorrect); // 傳入這題最終是否答對
    ```
*   **遊戲結束與中途跳出**：
    ```typescript
    // 正常通關
    tracker.endGame("completed", correctCount, lives /* 若無生命值可傳 0 */, totalQuestions);

    // 視窗關閉前 (BeforeUnload)
    window.addEventListener("beforeunload", () => {
      if (gameActive) tracker.endGame("abandoned", correctCount, lives /* 若無生命值可傳 0 */, totalQuestions);
    });
    ```

### 步驟三：綁定教師儀表板
引入儀表板模組，並將「觸發點擊的元素」（例如標題）傳入。只要玩家對這些元素點擊 5 次並輸入密碼，儀表板就會以彈窗形式浮現，且不需要在你的 `index.html` 中寫一堆儀表板的 HTML。
```typescript
import { bindTeacherDashboard } from "../../../../shared/game-core/GrammarDashboard";

// 尋找遊戲內的標題元素
const titleElements = [
    document.getElementById("game-title"), 
    document.querySelector("#start-screen h2")
].filter(Boolean) as HTMLElement[];

// 綁定
bindTeacherDashboard(titleElements);
```

### 步驟四：更新儀表板 UI (非必要)
若您的新遊戲有獨特的資料維度（例如：`yourCustomMetric`），請到 `shared/game-core/GrammarDashboard.ts` 中的 `statsHtml` 生成邏輯，加上您的新指標顯示條件，以便教師查看。