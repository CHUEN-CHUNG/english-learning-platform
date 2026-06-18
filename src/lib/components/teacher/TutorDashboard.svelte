<script lang="ts">
  // View states
  let currentView = $state<'overview' | 'student' | 'session'>('overview');
  let selectedStudent = $state<any>(null);
  let selectedSession = $state<any>(null);

  // Mock Data
  const students = [
    { id: 1, name: 'John Doe', status: 'ahead', statusText: '⬆️ 領先全站平均 20%', score: 85 },
    { id: 2, name: 'Mary Smith', status: 'normal', statusText: '➡️ 與全站平均持平', score: 70 },
    { id: 3, name: 'Leo Wang', status: 'behind', statusText: '⬇️ 落後全站平均 15%', score: 55 }
  ];

  const historyLogs = [
    { id: 101, date: '2026/06/15', unit: 'YLE 食物篇', score: 80, time: '1m 50s' },
    { id: 102, date: '2026/06/12', unit: 'YLE 食物篇', score: 40, time: '2m 30s' },
    { id: 103, date: '2026/06/10', unit: '文法大廳 (現在簡單式)', score: 90, time: '1m 20s' }
  ];

  const sessionDetails = {
    id: 102,
    unit: 'YLE 食物篇',
    date: '2026/06/12',
    score: 40,
    time: '2m 30s',
    errors: [
      { question: 'apple', studentAnswer: '香蕉', correctAnswer: '蘋果' },
      { question: 'He _____ to school everyday.', studentAnswer: 'go', correctAnswer: 'goes', tag: '第三人稱單數動詞變化' }
    ]
  };

  function goStudent(student: any) {
    selectedStudent = student;
    currentView = 'student';
  }

  function goSession(session: any) {
    selectedSession = sessionDetails; // 使用 Mock 資料
    currentView = 'session';
  }

  function exportReviewSheet() {
    alert(`即將匯出 ${selectedStudent.name} 的專屬複習卷！\n\n內容包含：\n1. 【字彙特訓】: restaurant, apple 等 5 個常錯單字填空\n2. 【文法診斷】: 針對「現在簡單式」的 3 題客製化改錯題\n3. 【情境重現】: 擷取上次「YLE 食物篇」閱讀錯題的上下文`);
  }

  function goBack() {
    if (currentView === 'session') currentView = 'student';
    else if (currentView === 'student') currentView = 'overview';
  }
</script>

<div class="tutor-dashboard bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
  {#if currentView !== 'overview'}
    <button class="mb-4 text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors" onclick={goBack}>
      &larr; 返回上一層
    </button>
  {/if}

  {#if currentView === 'overview'}
    <!-- 第一層：我的學生名單 -->
    <div class="max-w-3xl mx-auto">
      <!-- 我的學生列表 -->
      <div class="student-list">
        <h3 class="text-xl font-extrabold text-gray-800 mb-5">👦 我的家教名單</h3>
        <div class="space-y-4">
          {#each students as student}
            <button 
              class="w-full text-left bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center group"
              onclick={() => goStudent(student)}
            >
              <div>
                <p class="font-extrabold text-xl text-gray-800 group-hover:text-blue-700 transition-colors">{student.name}</p>
                <p class="text-sm font-bold mt-2 px-3 py-1 rounded-full inline-block
                  {student.status === 'ahead' ? 'bg-green-100 text-green-700' : ''}
                  {student.status === 'normal' ? 'bg-gray-100 text-gray-600' : ''}
                  {student.status === 'behind' ? 'bg-red-100 text-red-600' : ''}">
                  {student.statusText}
                </p>
              </div>
              <div class="text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                檢視檔案 &rarr;
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if currentView === 'student'}
    <!-- 第二層：學生個人檔案 -->
    <div class="student-profile animate-fade-in">
      <div class="flex flex-wrap justify-between items-end mb-6 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-800">🧑‍🎓 {selectedStudent.name} 的學習檔案</h2>
          <p class="text-gray-500 font-medium mt-2">綜合學習表現與專屬弱點分析</p>
        </div>
        <button 
          class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5"
          onclick={exportReviewSheet}
        >
          📥 一鍵匯出專屬複習卷
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- 雷達圖 Mock -->
        <div class="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col items-center justify-center min-h-[220px]">
          <p class="text-gray-600 font-bold mb-2">綜合能力雷達</p>
          <div class="w-full relative max-w-[200px] aspect-square">
            <!-- 簡易的雷達圖 CSS 視覺化替代方案 -->
            <div class="absolute inset-0 bg-blue-100 rounded-full opacity-50"></div>
            <div class="absolute inset-4 bg-blue-200 rounded-full opacity-50"></div>
            <div class="absolute inset-8 bg-blue-300 rounded-full opacity-50"></div>
            <!-- 能力指標標籤 -->
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 whitespace-nowrap">字彙辨識</div>
            <div class="absolute top-1/4 -right-8 text-xs font-bold text-gray-700 whitespace-nowrap">拼寫準確</div>
            <div class="absolute bottom-1/4 -right-8 text-xs font-bold text-gray-700 whitespace-nowrap">文法觀念</div>
            <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 whitespace-nowrap">閱讀理解</div>
            <div class="absolute bottom-1/4 -left-8 text-xs font-bold text-gray-700 whitespace-nowrap">作答速度</div>
            <div class="absolute top-1/4 -left-8 text-xs font-bold text-gray-700 whitespace-nowrap">聽力直覺</div>
            <!-- 假想的學生數據多邊形 -->
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <polygon points="50,15 85,35 80,75 50,90 25,65 30,30" fill="rgba(59, 130, 246, 0.4)" stroke="#2563eb" stroke-width="2" />
            </svg>
          </div>
        </div>

        <!-- 常錯弱點 -->
        <div class="col-span-1 md:col-span-2 bg-red-50 rounded-2xl p-6 border border-red-100">
          <p class="text-red-800 font-extrabold text-lg mb-3 flex items-center gap-2">
            ⚠️ 歷史常錯弱點分析
          </p>
          <ul class="space-y-3">
            <li class="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-center gap-3">
              <span class="bg-red-100 text-red-700 font-black px-2 py-1 rounded">錯 5 次</span>
              <span class="font-bold text-gray-800">apple</span>
              <span class="text-gray-500 text-sm ml-auto">常選成「香蕉」</span>
            </li>
            <li class="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-center gap-3">
              <span class="bg-red-100 text-red-700 font-black px-2 py-1 rounded">錯 4 次</span>
              <span class="font-bold text-gray-800">現在簡單式動詞變化</span>
              <span class="text-gray-500 text-sm ml-auto">常漏加 's'</span>
            </li>
            <li class="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-center gap-3">
              <span class="bg-red-100 text-red-700 font-black px-2 py-1 rounded">錯 3 次</span>
              <span class="font-bold text-gray-800">restaurant</span>
              <span class="text-gray-500 text-sm ml-auto">拼字錯誤</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 遊玩紀錄 -->
      <h3 class="text-xl font-extrabold text-gray-800 mb-4">📅 遊玩紀錄時間軸</h3>
      <div class="space-y-3">
        {#each historyLogs as log}
          <button 
            class="w-full text-left bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow flex justify-between items-center transition-all group"
            onclick={() => goSession(log)}
          >
            <div>
              <span class="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded mb-2">{log.date}</span>
              <p class="font-extrabold text-xl text-blue-900">{log.unit}</p>
            </div>
            <div class="text-right">
              <p class="font-black text-xl mb-1 {log.score >= 80 ? 'text-green-600' : 'text-red-500'}">
                🎯 {log.score} <span class="text-sm">分</span>
              </p>
              <p class="text-sm font-medium text-gray-500">⏱️ 耗時 {log.time}</p>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if currentView === 'session'}
    <!-- 第三層：單次測驗明細 -->
    <div class="session-details animate-fade-in">
      <div class="bg-gradient-to-r from-blue-800 to-indigo-800 text-white p-6 rounded-t-2xl shadow-lg relative overflow-hidden">
        <div class="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-4 -translate-y-4">🔍</div>
        <h2 class="text-3xl font-black mb-4 relative z-10">{selectedSession.unit}</h2>
        <div class="flex flex-wrap gap-4 text-blue-100 font-medium relative z-10">
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">📅 測驗日期：{selectedSession.date}</span>
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">🎯 正確率：{selectedSession.score}%</span>
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">⏱️ 花費時間：{selectedSession.time}</span>
        </div>
      </div>

      <div class="border-2 border-t-0 border-blue-100 rounded-b-2xl p-6 bg-white shadow-sm">
        <h3 class="text-xl font-extrabold text-gray-800 mb-6 border-b pb-3">🔍 錯題還原清單</h3>
        
        <div class="space-y-5">
          {#each selectedSession.errors as err}
            <div class="bg-red-50/50 border border-red-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <p class="font-bold text-xl text-gray-800 mb-4">{err.question}</p>
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1 bg-white p-4 rounded-lg shadow-sm border-l-4 border-l-red-500">
                  <span class="text-gray-500 text-sm font-bold block mb-1">學生的選擇 ❌</span>
                  <span class="text-red-600 font-bold text-lg line-through">{err.studentAnswer}</span>
                </div>
                <div class="flex-1 bg-white p-4 rounded-lg shadow-sm border-l-4 border-l-green-500">
                  <span class="text-gray-500 text-sm font-bold block mb-1">正確答案 ✅</span>
                  <span class="text-green-600 font-bold text-lg">{err.correctAnswer}</span>
                </div>
              </div>
              {#if err.tag}
                <div class="mt-4 border-t border-red-100 pt-3">
                  <span class="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-bold">
                    🏷️ 錯誤類型：{err.tag}
                  </span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>