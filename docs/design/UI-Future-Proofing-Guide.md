# 英文教學平台 UI/UX 未來架構優化指南 (Future-Proofing Guide)

隨著平台功能與小遊戲（單字測驗、打地鼠、火車重組等）越來越多，為了確保未來 UI/UX 的更新能夠「改一處，全站生效」，建議開發團隊逐步導入以下三項核心架構調整：

## 1. 統一設計語彙 (Design Tokens & Centralized Tailwind Config)

### 目前痛點
目前的 Tailwind CSS 類別中，顏色被直接寫死（Hardcoded），例如 `bg-blue-600`、`bg-green-500`。若未來品牌主視覺從「藍色」改為「靛色 (Indigo)」，需要全站搜尋並取代。

### 解決方案
將品牌顏色抽象化為「語意化變數 (Semantic Tokens)」。透過共用的 Tailwind 設定檔，定義 `primary`, `secondary`, `success`, `warning`, `danger` 等顏色。
- **作法**：由於目前專案多數檔案使用 CDN 載入 Tailwind，可建立一個 `shared/config/tailwind-theme.js`。
- **未來使用方式**：在 HTML 中使用 `bg-primary` 代替 `bg-blue-600`。

## 2. CSS 類別元件化 (Component Classes with `@apply`)

### 目前痛點
HTML 中的按鈕充滿了長長的 Utility Classes（例如：`class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-2xl transition shadow-md"`）。這導致若未來要將圓角從 `rounded-xl` 改為 `rounded-2xl`，需要修改無數個標籤。

### 解決方案
利用 Tailwind 的 `@apply` 語法，在 `shared/styles/ui-components.scss` 中將常用的樣式打包成獨立的 CSS Class。
- **作法**：定義 `.btn-primary`, `.btn-secondary`, `.card-panel` 等。
- **未來使用方式**：HTML 只要寫 `<button class="btn-primary">開始</button>`，大幅降低維護成本與 HTML 雜亂度。

## 3. HTML 結構模組化 (JS Template Injection / Web Components)

### 目前痛點
像「Teacher Dashboard (教師資料庫)」與「開始畫面 (Start Screen)」，它們的 HTML 程式碼在 `multiple-choice-fast`、`unscramble`、`vocabulary-quiz` 中被重複複製（Copy-Paste）。若未來教師資料庫需要新增一個分析指標，所有遊戲的 `index.html` 都要改一次。

### 解決方案
將共用的 UI 區塊封裝成 JavaScript 函數或 Web Components，統一放置於 `shared/components/`。
- **作法**：例如建立 `shared/components/TeacherDashboard.ts`，裡面包含 `function injectTeacherDashboard()`，動態將 HTML 字串插入到 `<body>` 內。
- **未來使用方式**：每個遊戲的 `index.html` 只要負責遊戲主體，共用 UI 透過 JS 統一載入。這能實現「一處更新，所有遊戲的教師後台同步升級」。

## 4. 逐步導入 Vite 的 PostCSS 建置 (Long-term Goal)
目前專案雖然有 Vite，但 Tailwind 仍仰賴 CDN `<script src="https://cdn.tailwindcss.com"></script>`。
- **建議**：未來可考慮透過 `npm install tailwindcss` 將 Tailwind 整合進 Vite 的編譯流程中。這不僅能提升網頁載入速度（避免 CDN 執行時的閃爍），也能更完美地支援 SCSS 與 `@apply` 的整合。