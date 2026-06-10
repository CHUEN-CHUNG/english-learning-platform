// shared/game-core/GrammarDashboard.ts

import { appStorage } from "../storage/StorageManager";

export function injectGrammarDashboard() {
  // Check if dashboard already exists
  if (document.getElementById('teacher-dashboard-container')) return;

  const dashboardHTML = `
  <div id="teacher-dashboard-container" class="hidden fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
      <!-- Header -->
      <div class="bg-indigo-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
        <h2 class="text-2xl font-bold flex items-center gap-2">👨‍🏫 文法遊戲全站學習數據庫</h2>
        <button id="close-dashboard-btn" class="text-white hover:text-red-200 transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Summary Dashboard -->
      <div class="p-6 bg-indigo-50 border-b border-indigo-100 flex-shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <p class="text-sm text-gray-500 font-bold mb-1">🎮 總遊玩人次</p>
          <p class="text-3xl font-black text-indigo-700" id="td-starts">0</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <p class="text-sm text-gray-500 font-bold mb-1">✅ 總完賽人次</p>
          <p class="text-3xl font-black text-green-600" id="td-all-comp">0</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <p class="text-sm text-gray-500 font-bold mb-1">🏃 中途跳出</p>
          <p class="text-3xl font-black text-red-500" id="td-abandon">0</p>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <p class="text-sm text-gray-500 font-bold mb-1">⏱️ 平均完賽時間</p>
          <p class="text-3xl font-black text-purple-600" id="td-avg-total">0s</p>
        </div>
        
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 col-span-2 md:col-span-4">
          <p class="text-sm text-gray-500 font-bold mb-2">🔥 全站最常錯的文法點 (Top 5)</p>
          <div id="td-top-errors" class="flex flex-wrap gap-2 text-sm">
             <span class="text-gray-500">載入中...</span>
          </div>
        </div>
      </div>

      <!-- Student List Data -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-50" id="td-content">
        <p class="text-center text-gray-500 py-8">載入中...</p>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', dashboardHTML);

  document.getElementById("close-dashboard-btn")?.addEventListener("click", () => {
    document.getElementById("teacher-dashboard-container")?.classList.add("hidden");
  });
}

export function bindTeacherDashboard(triggerElements: HTMLElement[]) {
  injectGrammarDashboard();
  let titleClickCount = 0;
  
  const handleTitleClick = () => {
    titleClickCount++;
    if (titleClickCount === 5) {
      titleClickCount = 0;
      const pwd = prompt("請輸入教師密碼 (預設: admin)：");
      if (pwd === "admin") {
        renderDashboardData();
        document.getElementById("teacher-dashboard-container")?.classList.remove("hidden");
      } else if (pwd !== null) {
        alert("密碼錯誤！");
      }
    }
  };

  triggerElements.forEach(el => el.addEventListener('click', handleTitleClick));
}

async function renderDashboardData() {
  const content = document.getElementById("td-content");
  if (!content) return;

  const allData = await appStorage.load("grammar_platform_data") || {};

  // Migrate legacy data if exists (optional, simple migration)
  const legacyChoiceData = await appStorage.load("grammar_choice_data") || {};
  const legacyUnscrambleData = await appStorage.load("grammar_unscramble_data") || {};
  
  // Merge legacy data if grammar_platform_data is empty for the user
  for (const [user, data] of Object.entries(legacyChoiceData)) {
    if (!allData[user]) {
       // Flag them as MultipleChoice
       const history = ((data as any).history || []).map((d: any) => ({...d, gameType: "MultipleChoice"}));
       const abandons = ((data as any).abandons || []).map((d: any) => ({...d, gameType: "MultipleChoice"}));
       allData[user] = { history, abandons };
    }
  }

  for (const [user, data] of Object.entries(legacyUnscrambleData)) {
    if (!allData[user]) {
       const history = ((data as any).history || []).map((d: any) => ({...d, gameType: "Unscramble"}));
       const abandons = ((data as any).abandons || []).map((d: any) => ({...d, gameType: "Unscramble"}));
       allData[user] = { history, abandons };
    } else {
      // Append if user exists from choice data
       const history = ((data as any).history || []).map((d: any) => ({...d, gameType: "Unscramble"}));
       const abandons = ((data as any).abandons || []).map((d: any) => ({...d, gameType: "Unscramble"}));
       allData[user].history = [...(allData[user].history || []), ...history];
       allData[user].abandons = [...(allData[user].abandons || []), ...abandons];
    }
  }


  // Dashboard Aggregation Variables
  let totalStarts = 0;
  let totalCompletions = 0;
  let totalAbandons = 0;
  let totalDurations = 0;
  const grammarPointFails: Record<string, number> = {};

  let html = "";

  for (const [user, data] of Object.entries(allData)) {
    const history = (data as any).history || [];
    const abandons = (data as any).abandons || [];

    // Only aggregate summary stats if user is not "test" (case-insensitive)
    const isTestUser = user.trim().toLowerCase() === "test";

    if (!isTestUser) {
      totalStarts += history.length + abandons.length;
      totalCompletions += history.length;
      totalAbandons += abandons.length;
    }

    // Student specific error tracking
    const studentGrammarFails: Record<string, number> = {};
    const studentGrammarQuestions: Record<string, string[]> = {};

    html += `
      <div class="border-2 border-indigo-100 p-5 rounded-xl bg-white mb-6 shadow-sm">
        <div class="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
          <h4 class="font-bold text-xl text-indigo-800">🧑‍🎓 學生：${user}</h4>
          <p class="text-sm text-indigo-600 font-medium">完成: ${history.length}次 | 跳出: ${abandons.length}次</p>
        </div>
    `;

    if (history.length > 0) {
      html += `<div class="space-y-3">`;
      // Sort history by date descending (assuming they are already unshifted, but let's be safe)
      history.forEach((record: any, idx: number) => {
        if (!isTestUser) {
          totalDurations += record.duration || 0;
        }

        let statsHtml = "無詳細數據";
        if (record.stats) {
          statsHtml = record.stats
            .map((s: any, i: number) => {
              
              if (!s.isCorrect) {
                if (!isTestUser) {
                  grammarPointFails[s.grammarPoint] = (grammarPointFails[s.grammarPoint] || 0) + 1;
                }
                studentGrammarFails[s.grammarPoint] = (studentGrammarFails[s.grammarPoint] || 0) + 1;
                
                const questionText = s.targetSentence || s.text || "未知題目";
                if (!studentGrammarQuestions[s.grammarPoint]) {
                  studentGrammarQuestions[s.grammarPoint] = [];
                }
                if (!studentGrammarQuestions[s.grammarPoint].includes(questionText)) {
                  studentGrammarQuestions[s.grammarPoint].push(questionText);
                }
              }

              // Build game-specific metrics text
              let specificMetrics = "";
              if (record.gameType === "MultipleChoice") {
                  specificMetrics = `打擊 <span class="font-bold">${s.clicks || 0}</span> 次 | 錯擊 <span class="font-bold text-red-500">${s.wrongClicks || 0}</span> 次`;
              } else if (record.gameType === "Unscramble") {
                  specificMetrics = `裝上 <span class="font-bold">${s.attaches || 0}</span> 次 / 拆下 <span class="font-bold">${s.detaches || 0}</span> 次 | 錯誤送出 <span class="font-bold text-red-500">${s.wrongSubmits || 0}</span> 次`;
              } else {
                 specificMetrics = s.wrongSubmits ? `錯誤送出 <span class="font-bold text-red-500">${s.wrongSubmits}</span> 次` : "";
              }

              return `<div class="mb-2 border-b border-gray-100 pb-2 hover:bg-gray-50 p-1 rounded">
                    <span class="font-bold text-gray-700">Q${i + 1} (${s.grammarPoint}):</span> 
                    耗時 <span class="font-bold text-indigo-600">${s.timeMs}ms</span> | 
                    ${specificMetrics} | 
                    最終: ${s.isCorrect ? "✅ 成功" : "❌ 失敗"}
                </div>`;
            })
            .join("");
        }

        const gameTypeName = record.gameType === "MultipleChoice" ? "🕳️ 選擇題" : record.gameType === "Unscramble" ? "🚂 重組題" : record.gameType || "未知遊戲";
        
        html += `
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
            <div class="flex flex-col md:flex-row justify-between font-bold border-b pb-2 mb-3 gap-2">
              <span class="text-gray-700">${gameTypeName} <span class="text-xs text-gray-500 font-normal">(${record.date})</span><br><span class="text-xs text-indigo-500">單元: ${record.unit}</span></span>
              <span class="text-indigo-600 text-right md:text-left">答對: <span class="text-lg">${record.score}</span> | 耗時: ${record.duration}s</span>
            </div>
            <details class="bg-white rounded-md border border-gray-200">
              <summary class="cursor-pointer text-indigo-600 hover:text-indigo-800 font-bold p-2 bg-indigo-50/50 rounded-md outline-none">查看每題詳細數據 (點擊展開)</summary>
              <div class="mt-2 p-3 max-h-60 overflow-y-auto text-xs">
                ${statsHtml}
              </div>
            </details>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Display top errors for this student
    const topStudentFails = Object.entries(studentGrammarFails)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    if (topStudentFails.length > 0) {
      html += `
        <div class="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm font-bold text-red-800 mb-3 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg> 此學生最常錯的題型 (Top 5):</p>
          <div class="flex flex-col gap-2">
            ${topStudentFails.map(f => {
              const gp = f[0];
              const count = f[1];
              const questions = studentGrammarQuestions[gp] || [];
              const qListHtml = questions.map(q => `<li class="text-xs text-gray-700 ml-4 list-disc break-words my-1">${(q || "未知題目").toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('');
              
              return `
              <details class="bg-white border border-red-200 rounded-lg text-sm shadow-sm group overflow-hidden">
                <summary class="cursor-pointer font-bold text-red-700 px-4 py-3 list-none flex justify-between items-center group-open:bg-red-50 hover:bg-red-50 transition-colors">
                  <span>${gp} (${count}次)</span>
                  <span class="text-red-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div class="p-4 bg-white border-t border-red-100">
                  <p class="text-xs text-gray-500 mb-2 font-bold">答錯的具體題目：</p>
                  <ul class="space-y-1">${qListHtml}</ul>
                </div>
              </details>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  // Populate Dashboard Summary
  const elStarts = document.getElementById("td-starts");
  const elComps = document.getElementById("td-all-comp");
  const elAbandons = document.getElementById("td-abandon");
  const elAvgTotal = document.getElementById("td-avg-total");
  const elTopErrors = document.getElementById("td-top-errors");

  if (elStarts) elStarts.textContent = totalStarts.toString();
  if (elComps) elComps.textContent = totalCompletions.toString();
  if (elAbandons) elAbandons.textContent = totalAbandons.toString();

  const avgTotalTime = totalCompletions > 0 ? Math.floor(totalDurations / totalCompletions) : 0;
  if (elAvgTotal) elAvgTotal.textContent = `${avgTotalTime}s`;

  if (elTopErrors) {
    const topFails = Object.entries(grammarPointFails)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topFails.length > 0) {
      elTopErrors.innerHTML = topFails
        .map(f => `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold border border-red-200 shadow-sm">${f[0]} (${f[1]}次)</span>`)
        .join(" ");
    } else {
      elTopErrors.innerHTML = '<span class="text-gray-500">尚無數據</span>';
    }
  }

  if (html === "") {
    html = '<div class="h-full flex items-center justify-center"><p class="text-gray-400 text-xl font-bold">目前尚無任何遊玩紀錄。去玩一場遊戲吧！</p></div>';
  }
  content.innerHTML = html;
}
