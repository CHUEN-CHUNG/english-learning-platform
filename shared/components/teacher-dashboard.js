/**
 * 教師資料庫 (Teacher Dashboard) 共用模組
 * 負責動態產生並注入教師後台的 HTML 結構，達到「改一處全站生效」的效果。
 */
export function injectTeacherDashboard(options = {}) {
    const {
        title = "👨‍🏫 教師專屬資料庫 (Teacher Dashboard)",
        themeColor = "blue", // 支援 'blue' (打地鼠選擇) 或 'green' (火車重組)
        metric1Label = "答錯 (未過關)：",
        metric2Label = "總錯擊次數 (被干擾項騙到)：",
        topErrorsLabel = "最常答錯的題目 (Top 5)："
    } = options;

    // 根據主題顏色動態切換 Tailwind Classes
    const bg1 = themeColor === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100';
    const text1 = themeColor === 'blue' ? 'text-blue-800 border-blue-200' : 'text-green-800 border-green-200';
    const border1 = themeColor === 'blue' ? 'border-blue-200' : 'border-green-200';
    
    // 反轉顏色用作時間追蹤區塊 (若主色為藍，時間為綠；若主色為綠，時間為藍)
    const timeBg = themeColor === 'blue' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100';
    const timeText = themeColor === 'blue' ? 'text-green-800 border-green-200' : 'text-blue-800 border-blue-200';
    const timeValue = themeColor === 'blue' ? 'text-green-600' : 'text-blue-600';

    const html = `
    <!-- Teacher Dashboard Modal (Injected by shared component) -->
    <div id="teacher-dashboard" class="fixed inset-0 bg-gray-100 flex flex-col z-[100] hidden overflow-y-auto p-8">
      <div class="max-w-6xl mx-auto w-full">
        
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold text-red-600">${title}</h2>
          <button id="close-dashboard-btn" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm">
            關閉 / 登出
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <!-- 漏斗與參與度分析 -->
          <div class="p-6 rounded-2xl border-2 ${bg1}">
            <h3 class="text-xl font-bold mb-4 border-b pb-2 ${text1}">📊 測驗漏斗與參與度</h3>
            <ul class="space-y-3 text-base md:text-lg text-gray-700">
              <li class="flex justify-between"><span>進入首頁並點擊開始：</span> <span id="td-starts" class="font-bold">0</span></li>
              <li class="flex justify-between"><span>完成所有測驗：</span> <span id="td-all-comp" class="font-bold text-green-600">0</span></li>
              <li class="flex justify-between text-red-500 mt-2 pt-2 border-t ${border1}">
                <span>中途跳出 (Abandonment)：</span> <span id="td-abandon" class="font-bold">0</span>
              </li>
            </ul>
          </div>

          <!-- 錯誤分析 -->
          <div class="bg-red-50 p-6 rounded-2xl border-2 border-red-100">
            <h3 class="text-xl font-bold text-red-800 mb-4 border-b border-red-200 pb-2">🚨 錯誤類型與常錯題目</h3>
            <ul class="space-y-2 text-base md:text-lg text-gray-700 mb-4">
              <li class="flex justify-between"><span>${metric1Label}</span> <span id="td-err-wrong" class="font-bold text-purple-500">0</span></li>
              <li class="flex justify-between"><span>${metric2Label}</span> <span id="td-err-clicks" class="font-bold text-orange-500">0</span></li>
            </ul>
            <div>
              <span class="text-sm text-gray-600 block mb-2">${topErrorsLabel}</span>
              <div id="td-top-errors" class="flex flex-wrap gap-2 text-sm"></div>
            </div>
          </div>

          <!-- 時間追蹤 -->
          <div class="p-6 rounded-2xl border-2 ${timeBg} md:col-span-2">
            <h3 class="text-xl font-bold mb-4 border-b pb-2 ${timeText}">⏱️ 測驗時間追蹤 (Time-on-Task)</h3>
            <div class="flex flex-col md:flex-row gap-4 justify-around text-center">
              <div class="bg-white p-4 rounded-xl shadow-sm flex-1">
                <div class="text-sm text-gray-500 mb-1">平均每題耗時</div>
                <div class="text-2xl font-bold ${timeValue}" id="td-avg-q">0s</div>
              </div>
              <div class="bg-white p-4 rounded-xl shadow-sm flex-1">
                <div class="text-sm text-gray-500 mb-1">總平均耗時</div>
                <div class="text-2xl font-bold ${timeValue}" id="td-avg-total">0s</div>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-4 text-center">💡 詳細的「每一題停留時間」請參閱下方各別紀錄檢視。</p>
          </div>

        </div>

        <div class="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
          <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">📋 測驗紀錄與詳細數據</h3>
          <div id="td-content" class="space-y-4">
            <!-- Data will be injected here -->
          </div>
        </div>

      </div>
    </div>
    `;

    // 將 HTML 注入到 <body> 的最後面
    document.body.insertAdjacentHTML('beforeend', html);
}
