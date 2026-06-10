# 英語學習平台 - 系統架構與產品願景 (Platform Architecture & Vision)

## 1. 專案願景與核心理念 (Project Vision & Core Philosophy)

本專案旨在打造一個涵蓋「閱讀 (Reading)」、「單字 (Vocabulary)」與「文法 (Grammar)」三位一體的綜合英語學習應用程式。
核心理念基於《遊戲化實戰全書》(Octalysis 八角框架)，將傳統枯燥的英文測驗轉化為具備「進步與成就感」、「未知性與好奇心」以及「社會關聯性」的遊戲體驗，化被動學習為主動探索。

## 2. 系統架構 (System Architecture)

本專案採用 **Monorepo (多應用模組)** 架構，透過「遊戲引擎 (Apps)」與「題庫教材 (Content)」徹底分離的設計，達到極高的擴充性 (Scalability) 與維護性。

### 2.1 目錄結構 (Directory Structure)
- **`apps/`**: 存放所有獨立的遊戲與應用程式（如：同義詞遊戲、閱讀大富翁、文法大廳）。每個 App 都有自己的 `index.html` 與 `src/`。
- **`content/`**: 存放所有的學習教材與題庫（如：`.csv` 題庫、`.md` 文章、圖片）。依據 `vocabulary/`、`grammar/`、`reading/` 分類。
- **`shared/`**: 存放跨 App 共用的資源（如：全域樣式 `style.scss`、共用 UI 元件、工具函式）。
- **`tools/`**: 存放後端 Python API 伺服器與自動化生成腳本（如：`server.py`）。
- **`docs/`**: 存放全域的系統架構文件、SOP 與 AI Prompts。

### 2.2 動態路由與載入機制 (Dynamic Routing & Loading)
所有遊戲皆支援透過 URL 參數（如 `?unit=2` 或 `?topic=present-simple`）動態載入對應的題庫。
- **智慧尋找機制 (Smart Fallback)**：前端程式會自動在 `content/` 對應的資料夾下進行地毯式搜索，同時支援 `.xlsx` 與 `.csv` 格式，大幅降低企劃人員建置題庫的門檻。

---

## 3. 核心模組詳細規格 (Core Modules Specifications)

### 3.1 單字模組 (Vocabulary) [已完成]
*   **同義詞反義詞連連看 (Synonyms Game)**：三欄式連線配對。支援翻牌顯示解釋、計時器、計分系統。
*   **單字測驗 (Word Exam)**：進行單字聽寫與拼字測驗。
*   **資料來源**：讀取 `content/vocabulary/` 下的題庫。

### 3.2 閱讀模組 (Reading Explorer 大富翁) [開發中]
將長篇文章拆解為句子，結合大富翁機制，降低認知負荷。
*   **核心機制**：左側顯示文章，右側為環狀大富翁地圖。玩家擲骰子移動，停留格子會觸發閱讀理解題（讀取 `content/reading/` 下的 `.csv` 題庫）。
*   **動態標題**：自動讀取 `.md` 文章的第一行作為遊戲標題。

### 3.3 文法模組 (Grammar Hub) [開發中]
*   **文法大廳**：作為所有文法遊戲的入口，學生可先選擇文法主題（如：現在簡單式），再選擇挑戰模式。
*   **挑戰模式**：包含「填空挑戰 (Fill-in)」、「重組挑戰 (Unscramble)」、「挑錯挑戰 (Correction)」。
*   **時態漫畫閱讀器 (Comic Reader)**：結合 AI 生成的 SVG 漫畫圖層，讓學生在情境中學習文法。

---

## 4. 開發優先順序與 Roadmap (Development Roadmap)

1. **Phase 1: 基礎架構與單字模組 (Infrastructure & Vocabulary) [✅ 已完成]**
   - 建立 Monorepo 架構與共用樣式。
   - 完成同義詞連連看與單字測驗，並實作單元選擇器與智慧尋找機制。
2. **Phase 2: 閱讀大富翁 MVP (Reading Explorer MVP) [🚧 進行中]**
   - 實作前端 UI：文章單句高亮顯示、環狀地圖繪製。
   - 串接 `content/reading/` 的文章與題庫。
3. **Phase 3: 文法大廳與遊戲引擎 (Grammar Hub & Games) [⏳ 待開發]**
   - 根據各文法遊戲的 SOP (`docs/sops/`) 實作填空、重組等遊戲引擎。
   - 串接時態漫畫閱讀器。
4. **Phase 4: 系統串聯與 AI 生成器 (Integration & AI Tools)**
   - 完善 `tools/server.py`，提供企劃人員一鍵上傳文章並自動生成各類題庫的後台介面。