# 英語學習平台 - 系統架構與產品願景 V3 (Platform Architecture & Vision V3)

## 1. 專案願景與核心理念 (Project Vision & Core Philosophy)

本專案旨在打造一個涵蓋「閱讀 (Reading)」與「文法 (Grammar)」兩大核心區塊的綜合英語學習應用程式。
核心理念基於《遊戲化實戰全書》(Octalysis 八角框架)，將傳統枯燥的英文測驗轉化為具備「進步與成就感」、「未知性與好奇心」以及「社會關聯性」的遊戲體驗，化被動學習為主動探索。

## 2. 系統架構 (System Architecture)

本專案採用 **Monorepo (多應用模組)** 架構，具備**高度模組化 (High Modularity)** 與 **UI 元件化 (Componentization)** 設計，大幅提升擴充性 (Scalability) 與維護性。
在 V3 版本中，我們進一步將平台入口簡化並重構為「閱讀」與「文法」兩大主軸，提供更直覺的學習路徑。

### 2.1 目錄結構 (Directory Structure)
- **`apps/`**: 存放所有獨立的遊戲與應用程式。
  - `reading-hub/`: 閱讀大廳，整合所有閱讀與單字相關的學習資源與測驗。
  - `grammar-hub/`: 文法大廳，整合所有文法相關的遊戲與挑戰。
  - 其他獨立遊戲模組（如：同義詞遊戲、打地鼠、火車重組等）。
- **`content/`**: 存放所有的學習教材與題庫（`.csv` 題庫、`.md` 說明文章、`.pdf` 講義）。依據 `vocabulary/`、`grammar/`、`reading/`、`handouts/` 進行嚴格分類。
- **`shared/`**: **全站共用核心 (Core Shared Modules)**
  - `game-core/`: 存放跨遊戲共用的業務邏輯與數據引擎。
  - `styles/`: 存放 CSS 元件庫 (`ui-components.scss`) 與全域樣式 (`style.scss`)。
  - `config/`: 存放統一的設計代幣 (`tailwind-theme.js`)。
- **`docs/`**: 存放全域的系統架構文件、產品指南 (`Website-Guide-V3.md`)、開發規範與 SOP。

### 2.2 核心技術與模組系統 (Core Technologies & Modular Systems)

#### A. 統一 UI 系統與設計代幣 (Unified UI & Design Tokens)
- 導入 **Design Tokens** 概念，將語意化顏色統一於 `tailwind-theme.js` 中定義。
- 採用 **CSS 元件化** (`ui-components.scss`)，實現前端關注點分離。
- **大廳共用佈局 (Hub Layout)**：所有大廳（閱讀、教師、文法）皆強制使用 `shared/styles/hub-layout.css` 進行佈局與元件樣式統一，並透過 `theme-reading`, `theme-teacher`, `theme-grammar` class 進行主題切換。
- **共用 UI 工廠 (UI Factory)**：透過 `shared/components/UIFactory.js` 動態渲染大廳卡片，確保資料結構與 HTML 結構的一致性。

#### B. 雙層學習數據追蹤器 (Dual-Layer Data Tracking)
- **`GrammarDataTracker.ts`**: 統一的事件與成效收集器。
- **雙層資料結構 (LocalStorage)**：存放在全站共用的 `grammar_platform_data` 鍵值中，紀錄共通指標與特定遊戲專屬指標。

#### C. 共用教師儀表板與邏輯渲染 (Unified Teacher Dashboard)
- **`GrammarDashboard.ts`**: 將全站跨遊戲的學習數據進行動態彙整。
- 透過隱藏的快捷操作動態將儀表板 UI 注入畫面，提供總覽數據與錯題分析。

---

## 3. 核心模組詳細規格 (Core Modules Specifications)

### 3.1 閱讀大廳模組 (Reading Hub) [✅ V3 新增]
將原本分散的單字與閱讀功能整合為單一入口，提供結構化的學習路徑：
*   **程度與單元選擇**：支援多種程度（如 YLE Flyers, TOEFL Junior, TOEFL），點擊進入對應單元。
*   **單元學習行動 (Unit Actions)**：
    *   **同反義詞連連看 (Synonyms Game)**：支援下拉選單選擇特定文章段落或全文章進行練習（段落數量由 `units.json` 動態設定）。
    *   **閱讀練習 (Reading Practice)**：支援下拉選單選擇特定文章段落或全文章進行閱讀理解（段落數量由 `units.json` 動態設定）。
    *   **課堂講義下載 (Class Handout)**：提供基於 SOP 自動生成的 PDF 講義下載。
    *   **例句重組測驗下載 (Phrase Reorganization Quiz)**：提供基於 SOP 自動生成的 PDF 測驗卷下載。
    *   **單字總測驗 (Comprehensive Vocabulary Quiz)**：進入該單元的總結性聽寫與拼字測驗。
*   **單字遊戲生成器**：位於閱讀大廳上方，提供教師上傳 CSV 與文章，自動生成測驗所需的資料。

### 3.2 文法大廳模組 (Grammar Hub & Games) [營運中]
*   **文法大廳**：作為所有文法遊戲的唯一入口，學生可先選擇文法主題，再選擇挑戰模式。
*   **文法遊戲群**：
    *   **打地鼠選擇題 (Multiple Choice Fast)**：結合反應力與文法判斷。
    *   **火車重組題 (Unscramble)**：透過拖曳/點擊車廂重組正確的英文句型結構。
*   **魔法文法海報編輯器**：提供教師編輯並匯出文法教學海報（此功能目前預設隱藏，視需求開啟）。

### 3.3 閱讀大富翁模組 (Reading Explorer) [🚧 開發中]
*   將長篇文章拆解為句子，結合大富翁機制，降低認知負荷。

### 3.4 教師專用區塊 (Teacher Zone) [✅ V3 新增]
建立專屬教師的備課與成效追蹤中心：
*   **安全機制**：進入大廳需輸入密碼（預設 `admin`）。
*   **單元學習數據 (Unit Data)**：點擊按鈕直接進入遊戲的教師數據面板（目前已實作「單字總測驗」的直達功能，其他遊戲的數據追蹤功能尚在開發中）。
*   **成效追蹤**：提供課堂講義與例句重組測驗的下載次數追蹤（開發中）。
*   **問卷回復**：收集與管理學生的問卷回饋（開發中）。
*   **單字遊戲生成器**：提供教師上傳 CSV 與文章，自動生成測驗所需的資料。

---

## 4. 開發優先順序與 Roadmap (Development Roadmap)

1. **Phase 1 & 2: 基礎架構與文法大廳 [✅ 已完成]**
   - 建立 Monorepo 架構、設計代幣與 UI CSS 元件庫。
   - 完成打地鼠與火車重組遊戲，實作精準錯題追蹤與教師儀表板。

2. **Phase 3: 閱讀大廳與學習路徑重構 (Reading Hub Integration) [✅ 已完成 (V3)]**
   - 重構首頁 UI，分為「閱讀」與「文法」兩大區塊。
   - 建立 `reading-hub`，實作程度與單元選擇。
   - 整合段落選擇下拉選單、PDF 講義下載與測驗連結，形成完整的單元學習閉環。

3. **Phase 4: 閱讀大富翁 MVP (Reading Explorer MVP) [🚧 進行中]**
   - 實作前端 UI：文章單句高亮顯示、環狀地圖繪製。
   - 整合數據追蹤與儀表板綁定。

4. **Phase 5: 系統擴充與自動化工具 (Integration & AI Tools) [⏳ 持續進行]**
   - 完善後台自動化生成腳本 (Handout & Phrase Reorganization SOP)，實現 PDF 講義的一鍵生成與部署。
