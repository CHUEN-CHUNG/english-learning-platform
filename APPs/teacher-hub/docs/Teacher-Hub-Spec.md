# 教師大廳 (Teacher Hub) 產品規格書 (PRD)

**文件版本**: V1.1  
**更新日期**: 2026-05-05  
**主要受眾**: 產品經理 (TPM)、技術負責人 (TL)、前端工程師 (RD)、UI/UX 設計師、系統架構師 (Architect)
> 📝 **版本備註**：舊有規範與不一致的設定已全面清除，後續開發與功能擴充皆以此版本規範為準，不會受到舊有設定影響。

---

## 1. 產品概述 (Product Overview)

### 1.1 產品定位
「教師大廳 (Teacher Hub)」是英語學習平台中，專為「教育者/管理者」設計的備課與數據追蹤總入口。它將原本隱藏在各遊戲內部的數據儀表板、散落的教材生成工具整合在一起，提供一站式的班級管理與成效分析體驗。

### 1.2 目標用戶與核心價值 (基於 JTBD 理論)
教師大廳的核心價值在於滿足不同利害關係人的「待辦任務 (Jobs-to-be-Done)」：

*   **👩‍🏫 教師 (Teachers) - 從「繁瑣指派」到「精準掌控」**
    *   **深層任務 (JTBD)**：我需要確保學生回家後的練習與我的課堂教學完美同步，且能快速掌握學生的學習盲點，但我不想浪費時間在處理教材版本不一或逐一檢查成績上。
    *   **核心價值 (Core Value)**：**「數據驅動教學，備課效率最大化」**。一鍵直達各單元測驗的成效數據庫，快速掌握學生盲點。整合「單字遊戲生成器」，方便教師隨時產出新教材。
*   **👨‍💼 平台管理者 (Admins) - 從「分散管理」到「集中監控」**
    *   **深層任務 (JTBD)**：我想要了解整個平台的教材使用率與學生滿意度，以便規劃未來的內容更新，但我不想去各個系統撈取零散的資料。
    *   **核心價值 (Core Value)**：**「全域視角，安全隱私」**。透過統一的下載成效追蹤與問卷回復系統，掌握平台營運狀況。透過密碼閘門機制，確保學生無法輕易窺探後台數據或解答。

---

## 2. 系統架構與資料流 (Architecture & Data Flow) 
*(Target: Architect, TL, RD)*

### 2.1 模組位置與入口
*   **主程式**：`apps/teacher-hub/index.html`
*   **設定檔**：無獨立設定檔，依賴 `apps/reading-hub/units.json` (單一真理來源)
*   **共用元件庫**：`shared/components/UIFactory.js` (負責動態渲染學生端與教師端的卡片 UI)
*   **進度與身分管理器**：`shared/utils/ProgressTracker.js` (處理全站登入狀態與寫入 `word_exam_all_data`)
*   **入口點**：首頁 (`index.html`) 的「👨‍🏫 教師專用 (Teacher Zone)」區塊。

### 2.2 全站身分識別與登入機制 (Global Authentication)
教師大廳與學生端共用底層的登入狀態架構，但具備獨立的安全驗證：
1.  **強制登入 (Auth Guard)**：進入 Teacher Hub 時，系統會透過 `prompt` 觸發密碼驗證。
2.  **身分隔離**：教師大廳的驗證獨立於學生的 `currentUser`，確保教師在檢視數據時不會覆蓋學生的學習進度。

### 2.3 資料依賴與同步策略 (Data Dependencies)
> ⚠️ **架構師規範：單一真理來源 (Single Source of Truth)**
為了避免學生端與教師端的單元架構脫鉤，Teacher Hub **禁止**擁有自己的單元設定檔。
1.  **單元設定同步**：必須透過 `fetch('../../apps/reading-hub/units.json')` 動態渲染單元卡片，確保兩邊的單元數量與名稱永遠一致。
2.  **靜態檔案檢查**：透過 HTTP `HEAD` 請求，即時檢查 `content/handouts/` 底下的 PDF 檔案是否存在，若無檔案則按鈕設為 Disabled 並顯示「教材準備中」。
3.  **數據庫介接**：目前各遊戲的成績存在 `localStorage`（如 `word_exam_all_data`）。Teacher Hub 透過 URL 參數 `?mode=teacher` 將教師導向遊戲模組，遊戲模組接收到該參數後，會跳過遊戲首頁，直接開啟隱藏的教師儀表板。
4.  **進度讀取**：透過 `ProgressTracker.js` 讀取 `word_exam_all_data`，即時渲染各單元的完成度進度與數據。

---

## 3. 核心功能規格 (Core Features) 
*(Target: TPM, RD)*

### 3.1 安全驗證機制 (Security Gate)
*   **功能描述**：進入 `teacher-hub/index.html` 時，系統會觸發 `prompt` 要求輸入密碼。
*   **驗證邏輯**：預設密碼為 `admin`。若輸入錯誤或取消，強制 `window.location.href = '../../index.html'` 退回首頁。

### 3.2 頂層分類切換 (Category Selection)
*   **功能描述**：畫面上方提供「📖 閱讀 (Reading)」與「🏰 文法 (Grammar)」兩大區塊切換。
*   **互動行為**：點擊後平滑切換下方內容區塊，閱讀區塊顯示 YLE 單元列表與生成器；文法區塊顯示文法數據總覽入口。

### 3.3 學習數據與行動按鈕 (Action Buttons)
每個單元卡片內固定包含以下行動入口（**無下拉選單，一鍵直達**）：

| 行動名稱 | 類型 | 互動行為 | 參數/路徑 |
| :--- | :--- | :--- | :--- |
| **同反義詞連連看 (數據)** | 數據報表 | 進入統一數據儀表板 (閱讀分頁) | `dashboard.html?tab=reading` |
| **閱讀練習 (數據)** | 數據報表 | 進入統一數據儀表板 (閱讀分頁) | `dashboard.html?tab=reading` |
| **課堂講義 (下載次數)** | 成效追蹤 | 檢查 PDF 是否存在，若無則 Disabled 並顯示「教材準備中」。顯示全域下載次數 | `javascript:void(0)` |
| **例句重組測驗 (下載次數)** | 成效追蹤 | 檢查 PDF 是否存在，若無則 Disabled 並顯示「教材準備中」。顯示全域下載次數 | `javascript:void(0)` |
| **單字總測驗 (數據)** | 數據報表 | 進入統一數據儀表板 (閱讀分頁) | `dashboard.html?tab=reading` |
| **問卷回復** | 表單回饋 | 顯示該單元已完成問卷的學生總數 | `javascript:void(0)` |

### 3.5 單字遊戲生成器 (Vocabulary Game Generator)
*   **功能描述**：提供教師上傳 CSV 與文章，自動生成測驗所需的資料。
*   **錯誤處理與防呆機制 (Error Handling & Fallbacks)**：
    *   **前端欄位檢查**：在上傳 CSV 前，前端必須先解析檔案標頭 (Headers)，確認是否包含必要的欄位（如 `Word`, `Chinese` 等）。若缺少必要欄位，應立即阻擋上傳並跳出具體提示（例如：「CSV 缺少 'Word' 欄位，請檢查後再試」）。
    *   **友善的錯誤提示**：若後端處理失敗（回傳 500 錯誤等），前端必須捕捉錯誤並顯示友善的提示訊息（例如：「哎呀！文章解析失敗，請確認上傳的是有效的 PDF 檔，或檔案是否損壞」），絕對禁止畫面卡死在 Loading 狀態。
    *   **按鈕狀態管理**：送出表單後，提交按鈕需設為 `disabled` 防止重複點擊；若發生錯誤，必須將按鈕恢復為可點擊狀態。
### 3.6 教師自訂教材上傳系統 (Custom Material Upload)
*   **功能描述**：允許教師自行上傳補充教材 (PDF)，並動態在學生端 (Reading Hub) 生成對應的下載按鈕。
*   **流程 1：檔案限制與驗證**：僅限上傳 `.pdf` 格式的檔案，且檔案大小限制為最大 10MB。前端在上傳前必須進行阻擋與提示。
*   **流程 2：歸屬單元與標籤設定**：教師在上傳前，必須透過下拉選單選擇「適用單元 (Unit)」(必須是 `units.json` 中已有的單元或自建區塊) 以及填寫/選擇「教材標籤 (Tag)」(例如：課堂講義、考前衝刺、延伸閱讀)。
*   **流程 3：系統自動重新命名與按鈕動態生成 (折衷方案)**：
    *   **自動命名**：為避免中文檔名導致的網址解析錯誤或檔名衝突，系統在儲存檔案時，必須自動將檔名重新命名為 `[UnitCode]-[Timestamp]-[UploaderName].pdf`。
    *   **標籤即按鈕名稱 (折衷作法)**：為了讓教師填寫的「教材標籤 (Tag)」能直接作為學生端的按鈕名稱，系統需建立一個 `materials_registry` (目前可先存於 `localStorage`，未來移至資料庫) 來記錄該檔案的 Metadata (包含 Tag、真實路徑、上傳者)。學生端 (`UIFactory.js`) 渲染單元卡片時，除了預設教材外，還會讀取此 Registry，並直接將「教材標籤 (Tag)」作為按鈕的標題（例如顯示為 `📥 考前衝刺`），副標題則顯示上傳者或檔案類型。這樣既解決了檔名亂碼問題，又滿足了按鈕名稱客製化的需求。
*   **流程 4：成效追蹤升級**：所有教材檔案的數據追蹤維度擴充，改為紀錄：「學生下載次數」、「學生測驗成績 (若有綁定測驗)」與「上傳者名稱 (Uploader Name)」，以便未來在 Dashboard 統計各教師產出教材的受歡迎程度與使用率。

*   **頁面刷新即更新**：所有資料（包含單元列表、段落數量、學生測驗數據等）在更新時，都必須能透過**重新整理頁面 (Page Refresh)** 達到即時更新，確保教師隨時獲取最新資料。

---

## 4. UI/UX 設計規範 (UI/UX Guidelines) 
*(Target: UI/UX, TL, RD)*

### 4.1 視覺層次與排版 (Visual Hierarchy)
*   **背景與容器**：背景使用淺灰白 (`#f4f7f6`)，內容容器最大寬度 `1000px` 置中，確保大螢幕閱讀舒適度。
*   **視覺區隔 (Visual Distinction)**：
    *   **主色調 (Primary Color)**：採用專業、沉穩的**深青色 (Teal, `#00695c`)** 作為 Header 與主要邊框顏色，與學生端的藍色 (Reading) / 紫色 (Grammar) 做出明確的「後台感」區隔。
    *   **按鈕語意色 (Semantic Colors)**：
        *   數據報表按鈕：左邊框為青色 (`#00acc1`)。
        *   下載成效按鈕：左邊框為琥珀色 (`#ffb300`)。
        *   問卷回復按鈕：左邊框為紫色 (`#8e24aa`)。
        *   工具按鈕 (生成器)：背景為淺琥珀色 (`#fff8e1`)，文字為橘色 (`#f57f17`)。
*   **網格系統 (CSS Grid)**：卡片內的按鈕採用 Grid 排版 (`minmax(280px, 1fr)`)，確保在手機、平板、桌機上皆能完美響應式排列。

### 4.2 元件化與預設樣式規範 (Componentization & Default States)
> ⚠️ **架構師與 TL 規範**：為解決 UI 碎裂問題，未來開發需嚴格遵守以下規範：
1.  **禁止 Inline Style 與 Local `<style>`**：所有共用 UI（如 `.action-btn`, `.dropdown-menu`）必須逐步遷移至 `shared/styles/ui-components.scss`。
2.  **按鈕高度統一**：所有 `.action-btn` 必須設定 `height: 100%; box-sizing: border-box; font-family: inherit;`，解決過去 `<a>` 與 `<button>` 混用導致的高度與字體不一致問題。
3.  **新功能預設一致性 (Default UI Consistency)**：當新功能出現時，UI 預設樣式皆須與現有規範相同。所有基本功能和數據呈現都必須具備「預設選項 (Default Options)」，避免因缺少資料而導致畫面跑版或空白。

---

## 5. 技術實作與防呆機制 (Technical Implementation)
*(Target: RD)*

### 5.1 密碼驗證防護 (Password Protection)
確保未授權使用者無法進入大廳：
```javascript
function checkPassword() {
    const pwd = prompt('請輸入教師密碼 (預設: admin)：');
    if (pwd !== 'admin') {
        alert('密碼錯誤！將返回首頁。');
        window.location.href = '../../index.html';
    }
}
```

### 5.2 跨應用資料獲取 (Cross-App Data Fetching)
透過 `fetch` 讀取 Reading Hub 的設定檔，確保單元資料一致：
```javascript
async function loadUnits() {
    try {
        const response = await fetch('../../apps/reading-hub/units.json');
        const units = await response.json();
        // 渲染邏輯...
    } catch (error) {
        console.error('Error loading units:', error);
    }
}
```

### 5.3 檔案存在性檢查 (File Existence Check)
為了與 Reading Hub 保持一致的防呆體驗，渲染卡片前必須執行非同步檢查，若教材尚未生成，則不開放下載次數追蹤按鈕：
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

---

## 6. 未來發展藍圖 (Roadmap)
*(Target: TPM, Architect)*

*   **Phase 2: 完善各遊戲數據面板**：目前僅「單字總測驗」有實作 `mode=teacher` 的直達邏輯，未來需在「同反義詞連連看」與「閱讀練習」中補齊數據追蹤與對應的教師儀表板。
*   **Phase 3: 統一 Dashboard 元件 (✅ 已完成)**：打破目前「跳轉至各遊戲看數據」的模式，在 Teacher Hub 內部建立一個統一的 Dashboard (`dashboard.html`)，直接讀取全站 `localStorage` (`word_exam_all_data` 與 `grammar_platform_data`) 繪製綜合圖表，並分為閱讀與文法兩大分頁。
*   **Phase 4: 串接真實後端資料庫**：將目前的 `localStorage` 機制替換為真實的 API (如 Firebase / Supabase)，讓跨裝置的數據同步成為可能。
*   **Phase 5: 新增文件下載按鈕 (Custom Material Upload)**：實作教師自訂教材上傳系統，包含 PDF 格式與大小限制、自動重新命名機制，並透過 Metadata Registry 讓學生端動態生成以「教材標籤」為名的下載按鈕，同時擴充成效追蹤維度（下載次數/成績、上傳者名稱）。

      ps：
      1. 提供檔案類型（僅限 .pdf）與檔案大小限制（例如最大 10MB）。
      2. 老師須在上傳前以下拉選單選擇 「適用單元 (Unit)」（必須在目前已有教材的區塊或是自建區塊） 與 「教材標籤 (Tag)」（例如：課堂講義、考前衝刺、延伸閱讀）；學生端 (Reading Hub) 會依據適用單元決定，動態長出下載按鈕。
      3. 檔名必須由系統自動重新命名（例如：[UnitCode]-[Timestamp]-[UploaderName].pdf），避免檔名衝突或中文檔名導致的網址解析錯誤。
      不把中文標籤直接當作實體檔案的檔名（因為這會導致網址解析錯誤或伺服器找不到檔案），而是採用 「實體檔名自動化 + Metadata 註冊表」 的雙軌機制：實體檔案自動命名：系統在儲存 PDF 時，強制將檔名重新命名為安全的英文與數字組合，例如：[UnitCode]-[Timestamp]-[UploaderName].pdf。這確保了檔案在任何伺服器上都能被正確讀取。Metadata 註冊表 (Registry)：在老師上傳成功時，系統會在資料庫（目前可先存在 localStorage）寫入一筆 Metadata，記錄這個檔案的「真實路徑」、「上傳者」以及老師填寫的「教材標籤 (Tag)」（例如：考前衝刺）。學生端動態渲染：當學生端 (UIFactory.js) 在渲染單元卡片時，會去讀取這個 Registry。它會用裡面的「教材標籤 (Tag)」直接當作按鈕的顯示文字（例如顯示為 📥 考前衝刺），但按鈕背後的 href 連結則是安全的實體檔案路徑。


