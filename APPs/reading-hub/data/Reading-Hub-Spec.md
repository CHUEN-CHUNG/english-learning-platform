# 閱讀大廳 (Reading Hub) 產品規格書 (PRD)

**文件版本**: V1.1  
**更新日期**: 2026-05-05  
**主要受眾**: 產品經理 (TPM)、技術負責人 (TL)、前端工程師 (RD)、UI/UX 設計師、系統架構師 (Architect)
> 📝 **版本備註**：舊有規範與不一致的設定已全面清除，後續開發與功能擴充皆以此版本規範為準，不會受到舊有設定影響。

---

## 1. 產品概述 (Product Overview)

### 1.1 產品定位
「閱讀大廳 (Reading Hub)」是英語學習平台中，專為「學生端」設計的閱讀與單字學習總入口。包含以下功能：

### 1.2 目標用戶與核心價值 (基於 JTBD 理論)
閱讀大廳的核心價值在於滿足不同利害關係人的「待辦任務 (Jobs-to-be-Done)」：

*   **👨‍🎓 學生 (Students) - 從「被動練習」到「主動破關」**
    *   **深層任務 (JTBD)**：我想要在學習英文時感到自己是進步的、有能力的，而不是一直面對看不懂的長篇文章感到挫折。
    *   **核心價值 (Core Value)**：**「無痛沉浸，建立自信」**。透過將長篇閱讀拆解為「分段落」的遊戲化任務，我們將龐大的學習壓力轉化為可輕鬆消化的破關體驗。降低認知負荷的同時，讓每一次的點擊與練習都成為累積成就感的里程碑。
*   **👩‍👦 家長 (Parents) - 從「焦慮監督」到「輕鬆陪伴」**
    *   **深層任務 (JTBD)**：我想要知道孩子的學習進度，並在他們需要時提供正確的幫助，但我不想花太多時間摸索系統或成為嘮叨的監督者。
    *   **核心價值 (Core Value)**：**「進度透明，零摩擦陪伴」**。提供一目了然的單元進度與即時的教材狀態，消除家長「不知道孩子學到哪」的資訊焦慮。讓家長能以最少的操作成本，精準提供孩子所需的學習資源，成為孩子學習路上的神隊友。
*   **👩‍🏫 教師 (Teachers) - 從「繁瑣指派」到「精準掌控」**
    *   **深層任務 (JTBD)**：我需要確保學生回家後的練習與我的課堂教學完美同步，但我不想浪費時間在處理教材版本不一或確認學生到底玩了哪個段落的問題上。
    *   **核心價值 (Core Value)**：**「無縫對齊，教學指揮中心」**。閱讀大廳是教師的強大後盾，透過嚴格的「段落一致性」規範，確保線上遊戲與線下課堂的無縫接軌。大幅降低行政與溝通成本，讓教師能專注於教學本質，提升整體教學品質與專業度。

---

## 2. 系統架構與資料流 (Architecture & Data Flow) 
*(Target: Architect, TL, RD)*

### 2.1 模組位置
*   **主程式**：`apps/reading-hub/index.html`
*   **設定檔**：`apps/reading-hub/units.json` (單一真理來源，定義單元與段落數)
*   **共用元件庫**：`shared/components/UIFactory.js` (負責動態渲染學生端與教師端的卡片 UI)
*   **進度與身分管理器**：`shared/utils/ProgressTracker.js` (負責處理全站登入狀態與寫入 `word_exam_all_data`)

### 2.2 全站身分識別與登入機制 (Global Authentication)
為了解決跨遊戲資料不互通的問題，系統採用「全站統一登入」架構：
1.  **強制登入 (Auth Guard)**：學生進入 Reading Hub 時，若未登入，系統會彈出 Modal 要求輸入名字。
2.  **身分儲存**：名字會被存入 `localStorage` 的 `currentUser` 鍵值中。
3.  **無縫接軌 (Seamless UX)**：所有子遊戲（如單字總測驗）皆會自動讀取 `currentUser`，學生不需重複輸入名字即可開始測驗。若未登入直接進入子遊戲，會被強制導回 Reading Hub 登入。

### 2.3 資料依賴關係 (Data Dependencies)
閱讀大廳作為入口，不直接處理遊戲邏輯，但負責正確地將參數傳遞給各子應用：
1.  **設定資料**：透過 `fetch('./units.json')` 動態渲染單元卡片與段落下拉選單。
2.  **靜態檔案檢查**：透過 HTTP `HEAD` 請求，即時檢查 `content/handouts/` 底下的 PDF 檔案是否存在。
3.  **進度讀取**：透過 `ProgressTracker.js` 讀取 `word_exam_all_data[currentUser].progress`，即時渲染各單元的完成度進度條。
4.  **路由跳轉**：
    *   遊戲類：攜帶 `?unit={unitNumber}&para={paragraph}` 參數跳轉至對應遊戲目錄。
    *   下載類：直接開啟 PDF 靜態檔案連結。

---

## 3. 核心功能規格 (Core Features) 
*(Target: TPM, RD)*

### 3.1 程度頁籤切換 (Level Tabs)
*   **功能描述**：畫面上方提供不同檢定程度的切換頁籤。
*   **目前狀態**：預設啟用 `YLE Flyers`。`TOEFL Junior` 與 `TOEFL` 設為 `disabled` 狀態（點擊無效並顯示「目前無資料」）。

### 3.2 單元卡片動態渲染 (Dynamic Unit Cards)
*   **功能描述**：讀取 `units.json`，為每個單元生成一張專屬卡片。
*   **資料結構需求** (`units.json`)：
    ```json
    {
      "id": "yle-1",
      "title": "Unit 1 (YLE-1)",
      "unitCode": "YLE-1",
      "unitNumber": "1",
      "paragraphs": 6  // 決定下拉選單的段落數量
    }
    ```

### 3.3 閱讀大廳各項功能與規範 (Feature Specifications)
每個單元卡片內固定包含以下核心功能，各功能皆有明確的個別標示與規範。
**進度追蹤機制 (Progress Tracking)**：學生點擊以下任何一項核心任務（遊戲、測驗、問卷）時，系統會自動呼叫 `ProgressTracker.markTaskComplete` 寫入完成紀錄，並即時更新卡片上方的**「完成度進度條 (Progress Bar)」**。

#### 3.3.1 遊戲類：同反義詞連連看 & 閱讀練習
*   **功能描述**：提供單字與閱讀的互動遊戲。
*   **互動行為**：點擊展開下拉選單，同反義詞連連看可選擇「全文章」或「特定段落」；**閱讀練習已取消「全文章」選項，僅可選擇「特定段落」**。
*   **段落一致性規範 (嚴格要求)**：各遊戲在閱讀大廳顯示的段落選項，**必須**和遊戲內實際的段落完全一致。點擊特定段落後，路由參數 (`?unit=X&para=Y`) 必須精準導航至遊戲內的該段落，絕不可發生點擊後未到達指定段落或段落數不一致的狀況。

#### 3.3.2 下載類：課堂講義 & 例句重組測驗
*   **功能描述**：提供 PDF 靜態檔案下載。
*   **互動行為**：系統需即時檢查 PDF 是否存在。若無檔案則按鈕設為 Disabled 並顯示「教材準備中」。
*   **數據追蹤**：點擊下載時，會自動觸發 `ProgressTracker.recordDownload(unitId, type)`，將下載次數寫入全域統計資料 (`platform_stats_data`) 中，供教師大廳讀取。

#### 3.3.3 測驗類：單字總測驗
*   **功能描述**：單元總結的單字測驗（三階段：定義填空 → 例句填空 → 中翻英句子）。
*   **互動行為**：點擊直接進入總測驗 (`apps/Vocabulary-Quiz/index.html?unit=X`)。系統會自動帶入 `currentUser`，不需再次輸入名字。
*   **第三階段題庫來源**：讀取 `{單元}-Dictionary.csv` 的 `Example-Chinnese 3`（題目）與 `Example-English 3`（標準答案）。
*   **第三階段例句規範**：須符合 [`Dictionary-Generation.md`](../../../docs/sops/Words%20&%20Reading/Dictionary-Generation.md) 之 **「第三階段專用句型規範」**（YLE Flyers **句型菜單**：S + V + O、S + be + adj、There is/are…、can/must + V、S + V + to + V、S + like/want + n/v-ing、片語；時態限現在簡單式／現在進行式／未來式／過去式；句長 6～10 詞；禁止 because/so/when/if 從句、關係子句 who/that/which、分號雙句、or…or 選擇複句）。`Example-English 1/2` 不受此限。

#### 3.3.4 表單類：課後問卷
*   **功能描述**：收集學生學習回饋 (使用 Tally 嵌入表單)。
*   **互動行為**：點擊彈出問卷 Modal，並自動呼叫 `ProgressTracker.markTaskComplete(unitId, 'questionnaire')` 將該單元的問卷狀態標記為「已完成」。此狀態會由教師大廳匯總，計算出該單元已完成問卷的「學生總數」。

### 3.4 資料更新機制 (Data Refresh Rule)
*   **頁面刷新即更新**：所有資料（包含單元列表、段落數量、講義存在狀態等）在更新時，都必須能透過**重新整理頁面 (Page Refresh)** 達到即時更新，確保使用者隨時獲取最新資料。

---

## 4. UI/UX 設計規範 (UI/UX Guidelines) 
*(Target: UI/UX, TL, RD)*

### 4.1 視覺層次與排版 (Visual Hierarchy)
*   **背景與容器**：背景使用淺灰白 (`#f4f7f6`)，內容容器最大寬度 `1000px` 置中，確保大螢幕閱讀舒適度。
*   **卡片設計 (Card UI)**：單元卡片採用白底、圓角 (`12px`)、輕微陰影 (`box-shadow`)，並帶有藍色左邊框 (`border-left: 4px solid #007bff`) 以強調層次。
*   **網格系統 (CSS Grid)**：卡片內的按鈕採用 Grid 排版 (`minmax(280px, 1fr)`)，確保在手機、平板、桌機上皆能完美響應式排列。

### 4.2 元件化與預設樣式規範 (Componentization & Default States)
> ⚠️ **架構師與 TL 規範**：為解決 UI 碎裂問題，未來開發需嚴格遵守以下規範：
1.  **禁止 Inline Style 與 Local `<style>`**：所有共用 UI（如 `.action-btn`, `.dropdown-menu`）必須逐步遷移至 `shared/styles/ui-components.scss`。
2.  **按鈕高度統一**：所有 `.action-btn` 必須設定 `height: 100%; box-sizing: border-box; font-family: inherit;`，解決過去 `<a>` 與 `<button>` 混用導致的高度與字體不一致問題。
3.  **新功能預設一致性 (Default UI Consistency)**：當新功能出現時，UI 預設樣式皆須與現有規範相同。所有基本功能和數據呈現都必須具備「預設選項 (Default Options)」，避免因缺少資料而導致畫面跑版或空白。

---

## 5. 技術實作與防呆機制 (Technical Implementation)
*(Target: RD)*

### 5.1 檔案存在性檢查 (File Existence Check)
為了避免學生點擊下載連結後遇到 404 錯誤，必須在渲染卡片前執行非同步檢查：
```javascript
async function checkFileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}
```
*   **效能考量**：使用 `Promise.all` 併發檢查講義與測驗卷，避免阻塞渲染。

### 5.2 下拉選單互動 (Dropdown Interaction)
*   **互斥開啟**：點擊任一下拉選單時，必須自動關閉其他已開啟的選單。
*   **點擊外部關閉**：監聽全域 `click` 事件，若點擊目標不在 `.dropdown-container` 內，則關閉所有選單。

---

## 6. 未來發展藍圖 (Roadmap)
*(Target: TPM, Architect)*

*   **Phase 5: 串接真實後端資料庫**：將目前的 `localStorage` (ProgressTracker) 機制替換為真實的 API (如 Firebase / Supabase)，讓資料能跨裝置同步。
*   **Phase 6: 遊戲化獎勵機制**：將整體遊戲故事化，並加入闖關元素，或許還可以加入角色和吉祥物。