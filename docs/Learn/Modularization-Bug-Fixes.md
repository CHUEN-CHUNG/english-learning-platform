# 模組化與架構重構的錯誤修復紀錄 (Modularization Bug Fixes)

這份文件記錄了在進行「遊戲核心模組化」與「UI 元件化」時所引發的後續錯誤，以及最終的修復方案。
此文件的目的在於為未來類似的大規模架構變更提供參考，確保修改時能將相關的依賴與設定一併處理，避免重蹈覆轍。

## 1. 發生的情境 (Context)

在將「打地鼠選擇題」與「火車重組題」的資料追蹤邏輯與「教師儀表板」抽出，建立為 `shared/game-core/GrammarDataTracker.ts` 與 `GrammarDashboard.ts` 模組時，對原本的 `main.ts` 進行了大量刪減與重構。
同時，為了解決全站的顏色統一問題，導入了 `shared/config/tailwind-theme.js` 並且在 `shared/styles/style.scss` 引入了 CSS 元件庫。

## 2. 做的修正與遇到的錯誤 (Modifications & Errors Encountered)

### A. 語法與殘留變數錯誤 (Syntax & Leftover Variable Errors)
*   **現象 1**：火車重組遊戲無法載入，Vite 拋出 `[PARSE_ERROR] Expected '}' but found 'EOF'` 錯誤。
    *   **原因**：在刪除舊版長達數百行的 `showTeacherDashboard` 函數時，不小心漏刪了最尾端的一小段程式碼，導致大括號 `{}` 無法閉合。
    *   **修正**：徹底清除檔案底部的舊函數殘留，並以乾淨的 `bindTeacherDashboard(...)` 取代。
*   **現象 2**：打地鼠遊戲畫面卡在「加載題目中...」，完全無法遊玩。
    *   **原因**：舊版用來存放資料的物件變數 `trackingData` 已被移除，改用全新的 `tracker` 類別。但在 `handleMoleClick` 等深層邏輯中，仍有殘留程式碼試圖寫入 `trackingData.currentQStats.clicks++`，導致拋出 `ReferenceError`，進而中斷了畫面的渲染進程。
    *   **修正**：將所有存取 `trackingData` 的程式碼徹底替換，改用區域變數（如 `currentQuestionClicks`）計數，並透過 `tracker.updateCurrentQuestionStat()` 同步至新模組。

### B. 構建工具 (Vite) 的 ES 模組匯入錯誤 (Build Tool Import Errors)
*   **現象**：在執行 `npx vite build` 測試構建時，拋出多個 HTML 檔案的錯誤：`<script src="../../shared/config/tailwind-theme.js"> can't be bundled without type="module" attribute`。
    *   **原因**：Vite 在建置 (Build) 階段時，對於外部引入的 JavaScript 腳本有嚴格的模組化要求。若沒有標記為 `type="module"`，它無法正確將其打包進最終產物中。
    *   **修正**：在所有用到 `tailwind-theme.js` 的 `index.html` 中，為 `<script>` 標籤加上了 `type="module"` 屬性。

### C. SCSS 預處理器的相對路徑解析錯誤 (SCSS Import Path Errors)
*   **現象**：在執行 `npx vite build` 時，`apps/reading-practice/src/reading.scss` 拋出 `Error: [sass] Can't find stylesheet to import`。
*   **原因**：`@import` 路徑錯誤。在重構時不小心將 `../../shared/styles/ui-components.scss` 直接套用到不同深度的檔案。從 `apps/reading-practice/src/` 回到根目錄需要跳出三層，正確路徑應為 `../../../shared/styles/ui-components.scss`。
*   **修正**：精準修正各個 SCSS 檔案的相對匯入路徑。

### D. 新舊系統切換時的資料相容性當機 (Data Migration Silent Crash)
*   **現象**：「火車重組」的教師儀表板一直卡在「載入中...」，而「打地鼠」卻能正常運作。
*   **原因**：
    1.  **打地鼠未切換**：「打地鼠」的程式碼中不小心遺留了舊版的儀表板程式碼，所以表面上運作正常，但實際上並沒有吃到新的共用模組。
    2.  **新版模組的資料相容性問題**：「火車重組」使用了新版的 `GrammarDashboard`，該模組會嘗試讀取並合併舊版系統留下的資料 (`legacy data`)。但舊資料格式不齊全（例如可能沒有題目的文字 `text` 或 `targetSentence`），當新版程式試圖對這些空值 (`undefined`) 執行字串操作或寫入 DOM 時，JavaScript 發生了「沉默崩潰 (Silent Crash)」，導致渲染流程中斷，永遠停留在「載入中...」。
*   **修正**：
    1.  清理「打地鼠」殘留的舊儀表板程式碼，統一改用 `bindTeacherDashboard`。
    2.  在新版 `GrammarDashboard.ts` 的資料合併與渲染邏輯中，加入空值防護機制（如 `(q || "未知題目").toString()` 與 `...(allData[user].history || [])`），確保遇到格式不完整的舊資料時也能安全過關不當機。

## 3. 未來改動時「必須一起調整」的檢查清單 (Checklist for Future Refactoring)

為避免未來在搬移模組或重構程式碼時發生相同問題，請在完成改動後執行以下確認：

1.  **徹底清除舊變數 (Variable Cleanup)**
    *   使用全域搜尋 (Global Search) 檢查剛被移除的變數（如本次的 `trackingData`、`showTeacherDashboard`）是否還有在其他函數或檔案中被呼叫。
2.  **確保大括號閉合 (Brace Matching)**
    *   在大量刪除程式碼區塊時，務必確保沒有留下孤立的括號 `}` 或未閉合的字串模板 `` ` ``。
3.  **路徑層級確認 (Relative Path Verification)**
    *   當抽離出 `shared` 共用樣式或腳本時，各個 App 對它的相對路徑（`../` 的數量）會因為該 App 檔案的位置深度而不同（`index.html` 和 `src/main.ts` 的深度通常差一層），請勿直接無腦複製貼上 `@import` 語法。
4.  **Vite 打包規範 (Vite Bundling Rules)**
    *   未來如果新增任何跨頁面共用的 JS 設定檔（如 `tailwind-theme.js`），在 `index.html` 引入時，請預設加上 `type="module"`，以符合 Vite 的生產環境打包規範。
5.  **務必執行構建測試 (Build Test)**
    *   在開發伺服器 (Dev Server) 看似正常的畫面，在打包 (Build) 時仍可能報錯。重構完成後，請務必執行 `npx vite build` 確保終端機能以 Exit Code 0 順利通過。