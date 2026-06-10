# 英語學習平台 - 系統架構與產品願景 V2 (Platform Architecture & Vision V2)

## 1. 專案願景與核心理念 (Project Vision & Core Philosophy)

本專案旨在打造一個涵蓋「閱讀 (Reading)」、「單字 (Vocabulary)」與「文法 (Grammar)」三位一體的綜合英語學習應用程式。
核心理念基於《遊戲化實戰全書》(Octalysis 八角框架)，將傳統枯燥的英文測驗轉化為具備「進步與成就感」、「未知性與好奇心」以及「社會關聯性」的遊戲體驗，化被動學習為主動探索。

## 2. 系統架構 (System Architecture)

本專案採用 **Monorepo (多應用模組)** 架構，並於近期導入了**高度模組化 (High Modularity)** 與 **UI 元件化 (Componentization)** 設計，大幅提升擴充性 (Scalability) 與維護性。

### 2.1 目錄結構 (Directory Structure)
- **`apps/`**: 存放所有獨立的遊戲與應用程式（如：同義詞遊戲、文法大廳、打地鼠、火車重組）。每個 App 皆為獨立入口，但深度依賴共用的核心模組。
- **`content/`**: 存放所有的學習教材與題庫（`.csv` 題庫、`.md` 說明文章）。依據 `vocabulary/`、`grammar/`、`reading/` 進行嚴格分類，並遵循標準化的 Schema 規範。
- **`shared/`**: **全站共用核心 (Core Shared Modules)**
  - `game-core/`: 存放跨遊戲共用的業務邏輯與數據引擎（如：`GrammarDataTracker.ts`, `GrammarDashboard.ts`）。
  - `styles/`: 存放 CSS 元件庫 (`ui-components.scss`) 與全域樣式 (`style.scss`)。
  - `config/`: 存放統一的設計代幣 (`tailwind-theme.js`)。
- **`docs/`**: 存放全域的系統架構文件、產品指南 (`Website-Guide-New.md`)、開發規範 (`Grammar-Game-Development-Guide.md`) 與題庫格式定義 (`Grammar-Question-Schema.md`)。

### 2.2 核心技術與模組系統 (Core Technologies & Modular Systems)

為解決早期「複製貼上」架構帶來的維護痛點，平台現已全面升級為三大模組系統：

#### A. 統一 UI 系統與設計代幣 (Unified UI & Design Tokens)
為確保全站視覺一致性並具備未來擴充性 (Future-Proofing)：
- 導入了 **Design Tokens** 概念，將語意化顏色（如 `primary`, `success`, `warning`, `error`）統一於 `tailwind-theme.js` 中定義，並動態注入為原生 CSS 變數 (`--color-primary`)。
- 採用 **CSS 元件化** (`ui-components.scss`)，將重複的 Tailwind utility classes 封裝為可重用的語意化類別（如 `.btn-primary`, `.card-panel`），實現前端關注點分離。

#### B. 雙層學習數據追蹤器 (Dual-Layer Data Tracking)
為精準掌握學習成效並提供教師洞察，我們打造了強大的數據引擎：
- **`GrammarDataTracker.ts`**: 統一的事件與成效收集器。
- **雙層資料結構 (LocalStorage)**：存放在全站共用的 `grammar_platform_data` 鍵值中。
  1. **第一層（共通指標）**：紀錄遊戲類型、完賽總耗時、最終得分、剩餘生命（若遊戲有生命值機制）、完賽或中途跳出狀態等大指標。
  2. **第二層（特定遊戲專屬指標）**：紀錄「每一題」的答對與否、單題耗時，以及專屬行為特徵（如：選擇題的打擊/錯擊次數、重組題的拆裝車廂次數、以及具體的錯題內容）。

#### C. 共用教師儀表板與邏輯渲染 (Unified Teacher Dashboard)
- **`GrammarDashboard.ts`**: 將全站跨遊戲的學習數據進行動態彙整。
- 透過隱藏的快捷操作（在遊戲標題連點五次 + 密碼 `admin`）動態將儀表板 UI 注入畫面。
- 提供總覽數據與學生特定的「最常錯文法點 Top 5」深度分析，並支援展開查看具體錯題內容。

---

## 3. 核心模組詳細規格 (Core Modules Specifications)

### 3.1 單字模組 (Vocabulary) [營運中]
*   **同義詞反義詞連連看 (Synonyms Game)**、**單字測驗 (Word Exam)**。

### 3.2 文法模組 (Grammar Hub & Games) [✅ 核心架構已完成，持續擴充中]
*   **文法大廳**：作為所有文法遊戲的入口，學生可先選擇文法主題（如：現在簡單式），再選擇挑戰模式。
*   **文法遊戲群**：各自搭載專屬的生命值或無盡學習機制，並皆具備錯題詳解功能。
    *   **打地鼠選擇題 (Multiple Choice Fast)**：結合反應力與文法判斷，透過打擊正確選項過關。
    *   **火車重組題 (Unscramble)**：透過拖曳/點擊車廂重組正確的英文句型結構。
*   **題庫格式 (`Grammar-Question-Schema.md`)**：高度標準化、相容性強的 9 欄位 CSV 格式，確保未來新遊戲能快速掛載相同題庫。

### 3.3 閱讀模組 (Reading Explorer 大富翁) [🚧 開發中]
*   將長篇文章拆解為句子，結合大富翁機制，降低認知負荷。
*   **核心機制**：左側顯示文章，右側為環狀大富翁地圖。玩家擲骰子移動，停留格子會觸發閱讀理解題。

---

## 4. 開發優先順序與 Roadmap (Development Roadmap)

1. **Phase 1: 基礎架構與單字模組 [✅ 已完成]**
   - 建立初步的 Monorepo 架構。
   - 完成同義詞連連看與單字測驗。

2. **Phase 2: 文法大廳與共用遊戲核心架構 (Grammar Hub & Core Architecture) [✅ 已完成]**
   - 建立 `shared/game-core` 核心邏輯、設計代幣 (`Design Tokens`) 與 UI CSS 元件庫。
   - 完成打地鼠與火車重組遊戲，實作精準錯題追蹤，並支援不同遊戲規則（如打地鼠的無盡模式、火車的 3 命機制）。
   - 實作雙層 LocalStorage 資料結構與全站共用、動態生成的教師儀表板。
   - 產出《開發指南》與《題庫 Schema》。

3. **Phase 3: 閱讀大富翁 MVP (Reading Explorer MVP) [🚧 進行中]**
   - 實作前端 UI：文章單句高亮顯示、環狀地圖繪製。
   - 整合 `shared/game-core` 模組進行跨遊戲的數據追蹤與儀表板綁定。

4. **Phase 4: 系統擴充與自動化工具 (Integration & AI Tools) [⏳ 待開發]**
   - 基於核心架構，快速擴充更多文法小遊戲（如配對遊戲、聽寫遊戲）。
   - 開發/完善後台自動化生成腳本，提供企劃人員一鍵上傳文章並自動生成各類題庫的工具。