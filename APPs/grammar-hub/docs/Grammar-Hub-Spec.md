# 文法大廳 (Grammar Hub) 產品規格書 (PRD)

**文件版本**: V1.0  
**更新日期**: 2026-05-05  
**主要受眾**: 產品經理 (TPM)、技術負責人 (TL)、前端工程師 (RD)、UI/UX 設計師、系統架構師 (Architect)

---

## 1. 產品概述 (Product Overview)

### 1.1 產品定位
「文法大廳 (Grammar Hub)」是英語學習平台中，專為「學生端」設計的文法學習總入口。它將原本各自獨立的文法遊戲（如打地鼠、火車重組、對話挑戰等）整合在一個結構化的學習路徑中。

### 1.2 目標用戶與核心價值
*   **👨‍🎓 學生 (Students) - 從「死記硬背」到「遊戲化挑戰」**
    *   **深層任務 (JTBD)**：我想要搞懂複雜的英文時態與句型，但我不想看厚厚的文法書，我希望能在練習中自然而然地記住規則。
    *   **核心價值 (Core Value)**：**「互動反饋，直覺內化」**。透過將文法規則拆解為不同難度的遊戲任務（如挑錯、重組），讓學生在即時反饋中建立語感。

---

## 2. 系統架構與資料流 (Architecture & Data Flow) 
*(Target: Architect, TL, RD)*

### 2.1 模組位置
*   **主程式**：`apps/grammar-hub/index.html`
*   **共用樣式庫**：`shared/styles/hub-layout.css` (負責大廳的排版與元件樣式)
*   **進度與身分管理器**：`shared/utils/ProgressTracker.js` (未來將整合文法數據)

### 2.2 統一 UI 系統 (Unified UI System)
> ⚠️ **架構師規範：大廳樣式統一 (Hub UI Consistency)**
為了徹底解決平台 UI 碎裂問題，文法大廳已全面捨棄原本的 Tailwind 獨立刻版，改採與閱讀大廳、教師大廳完全相同的 HTML 結構與 CSS 類別。
1.  **共用 CSS**：強制引入 `shared/styles/hub-layout.css`。
2.  **主題切換**：`<body>` 必須加上 `class="theme-grammar"`，系統會自動套用紫色系的視覺主題。
3.  **元件類別**：卡片必須使用 `.unit-card`，按鈕必須使用 `.action-btn`。

---

## 3. 核心功能規格 (Core Features) 
*(Target: TPM, RD)*

### 3.1 文法主題頁籤切換 (Grammar Topic Tabs)
*   **功能描述**：畫面上方提供不同文法大類的切換頁籤。
*   **目前分類**：
    *   **時態 (Time Tenses)**：包含現在簡單式、過去簡單式、綜合時態對話挑戰。
    *   **基礎文法 (Basic Grammar)**：包含 Be 動詞等基礎句型。

### 3.2 學習行動按鈕 (Action Buttons)
每個文法單元卡片內包含多種挑戰模式，點擊後跳轉至對應遊戲並攜帶參數：

| 遊戲模式 | 互動行為 | 參數/路徑範例 |
| :--- | :--- | :--- |
| **打地鼠選擇 (Whack-a-Mole)** | 進入打地鼠選擇題（9 洞、4 選項隨機探出） | `../grammar-games/finish/multiple-choice/index.html?unit=Present-Simple-Choice`（規格見 `finish/multiple-choice/docs/Whack-a-Mole-Game.md`） |
| **火車重組 (Sentence Unscramble)** | 進入句子重組遊戲 | `../grammar-games/finish/unscramble/index.html?topic=past-simple` |
| **填空挑戰 (Fill in the Blanks)** | 進入填空遊戲 | `../grammar-games/to-do/fill-in/index.html?topic=be-verb` |
| **挑錯挑戰 (Error Correction)** | 進入挑錯遊戲 | `../grammar-games/to-do/correction/index.html?topic=be-verb` |
| **時空偵探與記者 (Dialogue Roleplay)** | 進入綜合對話挑戰 | `../grammar-games/dialogue-roleplay/index.html` |
| **講義下載 (Download Handout)** | 開啟靜態 PDF 檔案 | `../../content/grammar/time-tense/.../*.pdf` |

---

## 4. UI/UX 設計規範 (UI/UX Guidelines) 
*(Target: UI/UX, TL, RD)*

### 4.1 視覺層次與排版 (Visual Hierarchy)
*   **主色調 (Primary Color)**：採用**紫色 (Purple, `#6a1b9a`)** 作為 Header 與主要邊框顏色，營造魔法與探索的氛圍。
*   **卡片設計 (Card UI)**：單元卡片採用白底、圓角 (`12px`)，並帶有紫色左邊框 (`border-left: 4px solid #9c27b0`)。
*   **網格系統 (CSS Grid)**：卡片內的按鈕採用 Grid 排版 (`minmax(280px, 1fr)`)，確保響應式排列。

### 4.2 元件化與預設樣式規範 (Componentization & Default States)
> ⚠️ **架構師與 TL 規範**：
1.  **禁止 Inline Style 與 Local `<style>`**：所有共用 UI 必須依賴 `shared/styles/hub-layout.css`。
2.  **按鈕高度統一**：所有 `.action-btn` 的高度與字體已在共用 CSS 中統一，開發新功能時直接套用該 class 即可，嚴禁自行覆蓋 `height` 或 `font-family`。

---

## 5. 未來發展藍圖 (Roadmap)
*(Target: TPM, Architect)*

*   **Phase 1: 動態渲染 (Dynamic Rendering)**：將目前寫死在 HTML 中的文法卡片，比照閱讀大廳，抽離成 `grammar-units.json`，並透過 `UIFactory.js` 動態渲染。
*   **Phase 2: 進度追蹤整合 (Progress Tracking)**：將文法遊戲的過關紀錄整合進 `ProgressTracker.js`，並在文法大廳的卡片上顯示完成度進度條。
*   **Phase 3: 教師數據串接 (Teacher Hub Integration)**：將文法遊戲的錯題數據與過關時間，完整串接至 Teacher Hub 的「文法測驗數據總覽」面板。