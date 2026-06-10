const app = document.getElementById('app');

const layoutHTML = `
<div class="max-w-6xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">👨‍🏫 統一數據儀表板 (Unified Dashboard)</h1>
        <a href="index.html" class="text-blue-600 hover:underline font-bold">← 返回教師大廳</a>
    </div>

    <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button id="tab-reading" class="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg">
                📖 閱讀大廳數據 (Reading Hub)
            </button>
            <button id="tab-grammar" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg">
                🏰 文法大廳數據 (Grammar Hub)
            </button>
        </nav>
    </div>

    <div id="content-reading" class="block">
        <!-- Game Type Filter -->
        <div class="mb-4 flex space-x-2">
            <button class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-blue-600 text-white shadow" data-filter="All">全部紀錄</button>
            <button class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300" data-filter="Matching">🎮 同反義詞連連看</button>
            <button class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300" data-filter="Reading">📖 閱讀練習</button>
            <button class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300" data-filter="Quiz">📝 單字總測驗</button>
        </div>

        <!-- Summary Dashboard -->
        <div class="p-6 bg-blue-50 border border-blue-100 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <p class="text-sm text-gray-500 font-bold mb-1">🎮 總遊玩人次</p>
                <p class="text-3xl font-black text-blue-700" id="rd-starts">0</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <p class="text-sm text-gray-500 font-bold mb-1">✅ 總完賽人次</p>
                <p class="text-3xl font-black text-green-600" id="rd-all-comp">0</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <p class="text-sm text-gray-500 font-bold mb-1">🏃 中途跳出</p>
                <p class="text-3xl font-black text-red-500" id="rd-abandon">0</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                <p class="text-sm text-gray-500 font-bold mb-1">⏱️ 平均完賽時間</p>
                <p class="text-3xl font-black text-purple-600" id="rd-avg-total">0s</p>
            </div>
            
            <div class="bg-white p-4 rounded-xl shadow-sm border border-blue-100 col-span-2 md:col-span-4">
                <p class="text-sm text-gray-500 font-bold mb-2">🔥 全站最常錯單字 (Top 5)</p>
                <div id="rd-top-errors" class="flex flex-wrap gap-2 text-sm">
                    <span class="text-gray-500">載入中...</span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold mb-4 text-blue-800">學生詳細學習數據</h2>
            <div id="reading-data-container" class="space-y-6">
                <p class="text-gray-500 text-center py-8">載入中...</p>
            </div>
        </div>
    </div>

    <div id="content-grammar" class="hidden">
        <!-- Summary Dashboard -->
        <div class="p-6 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div id="td-content" class="space-y-6">
            <p class="text-center text-gray-500 py-8">載入中...</p>
        </div>
    </div>
</div>
`;

app.innerHTML = layoutHTML;

// Tab Switching Logic
document.getElementById('tab-reading').addEventListener('click', () => {
    document.getElementById('tab-reading').className = "border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg";
    document.getElementById('tab-grammar').className = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg";
    document.getElementById('content-reading').classList.remove('hidden');
    document.getElementById('content-grammar').classList.add('hidden');
});

document.getElementById('tab-grammar').addEventListener('click', () => {
    document.getElementById('tab-grammar').className = "border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg";
    document.getElementById('tab-reading').className = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg";
    document.getElementById('content-grammar').classList.remove('hidden');
    document.getElementById('content-reading').classList.add('hidden');
});

// Render Reading Data
function renderReadingData(filterType = 'All') {
    const container = document.getElementById('reading-data-container');
    const allData = JSON.parse(localStorage.getItem('word_exam_all_data') || '{}');
    
    let totalStarts = 0;
    let totalCompletions = 0;
    let totalAbandons = 0;
    let totalDurations = 0;
    const wordFails = {};

    let html = '';
    for (const [user, data] of Object.entries(allData)) {
        let history = data.history || [];
        const abandons = data.abandons || [];
        const profile = data.profile || {};
        
        // Filter history by game type if not 'All'
        if (filterType !== 'All') {
            history = history.filter(record => record.gameType === filterType);
        }

        // If filtering and this user has no matching history, skip them
        if (filterType !== 'All' && history.length === 0) {
            continue;
        }
        
        const isTestUser = user.trim().toLowerCase() === "test";

        if (!isTestUser) {
            // For abandons, we might not have gameType in old data, but we count them for 'All'
            const relevantAbandons = filterType === 'All' ? abandons : abandons.filter(a => a.gameType === filterType);
            totalStarts += history.length + relevantAbandons.length;
            totalCompletions += history.length;
            totalAbandons += relevantAbandons.length;
        }

        const studentWordFails = {};

        html += `
        <div class="border-2 border-blue-100 p-5 rounded-xl bg-white mb-6 shadow-sm">
            <div class="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                <h3 class="font-bold text-xl text-blue-800">🧑‍🎓 學生：${user}</h3>
                <div class="text-right">
                    <p class="text-sm text-gray-600">完成測驗: ${profile.totalTests || 0} 次 | 連續學習: ${profile.streak || 0} 天</p>
                </div>
            </div>
            <div class="space-y-3">
        `;
        
        if (history.length === 0) {
            html += `<p class="text-xs text-gray-400">尚無符合條件的測驗紀錄</p>`;
        } else {
            history.forEach(record => {
                if (!isTestUser && record.duration) {
                    totalDurations += record.duration;
                }

                // 處理錯題統計 (主要來自 Vocabulary Quiz 的 reviewData)
                let errorDetailsHtml = '';
                if (record.reviewData) {
                    const errors = record.reviewData.filter(q => !q.s1Correct || !q.s2Correct);
                    if (errors.length > 0) {
                        errorDetailsHtml = `<div class="mt-2 p-2 bg-red-50 rounded text-xs border border-red-100">
                            <p class="font-bold text-red-700 mb-1">答錯單字：</p>
                            <div class="flex flex-wrap gap-1">`;
                        
                        errors.forEach(q => {
                            if (!isTestUser) {
                                wordFails[q.word] = (wordFails[q.word] || 0) + 1;
                            }
                            studentWordFails[q.word] = (studentWordFails[q.word] || 0) + 1;
                            errorDetailsHtml += `<span class="bg-white px-2 py-0.5 rounded text-red-600 border border-red-200">${q.word}</span>`;
                        });
                        
                        errorDetailsHtml += `</div></div>`;
                    }
                }

                const gameTypeName = record.gameType === 'Matching' ? '🎮 連連看' : 
                                     record.gameType === 'Reading' ? '📖 閱讀練習' : 
                                     record.gameType === 'Quiz' ? '📝 單字總測驗' : '未知遊戲';

                let detailedStatsHtml = '';
                if (record.gameType === 'Quiz' && record.reviewData) {
                    detailedStatsHtml = record.reviewData.map((q, i) => {
                        const s1Ans = q.s1UserAns ? q.s1UserAns : '(未作答)';
                        const s2Ans = q.s2UserAns ? q.s2UserAns : '(未作答)';
                        const s1Status = q.s1Correct ? '✅' : '❌';
                        const s2Status = q.s2Correct ? '✅' : '❌';
                        const s1Time = q.s1TimeMs ? (q.s1TimeMs/1000).toFixed(1) + 's' : '--';
                        const s2Time = q.s2TimeMs ? (q.s2TimeMs/1000).toFixed(1) + 's' : '--';
                        
                        return `<div class="mb-2 border-b border-gray-100 pb-2 hover:bg-gray-50 p-1 rounded flex flex-col md:flex-row gap-2 md:items-center justify-between">
                            <div><span class="font-bold text-gray-700">Q${i+1}: ${q.word}</span></div>
                            <div class="text-xs text-gray-600">
                                英翻中: <span class="${q.s1Correct ? 'text-green-600' : 'text-red-500 line-through'}">${s1Ans}</span> ${s1Status} (${s1Time}) | 
                                中翻英: <span class="${q.s2Correct ? 'text-green-600' : 'text-red-500 line-through'}">${s2Ans}</span> ${s2Status} (${s2Time})
                            </div>
                        </div>`;
                    }).join('');
                } else {
                    detailedStatsHtml = `<div class="text-gray-500 text-center py-2">此測驗無詳細逐題數據。</div>`;
                }

                html += `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                    <div class="flex flex-col md:flex-row justify-between font-bold pb-1 gap-2">
                        <span class="text-gray-700">${gameTypeName} <span class="text-xs text-gray-500 font-normal">(${record.date})</span><br><span class="text-xs text-blue-500">單元: ${record.file || record.unit || '未知'}</span></span>
                        <span class="text-blue-600 text-right md:text-left">
                            得分: <span class="text-lg">${record.score || 0}${record.total ? ` / ${record.total}` : ''}</span> 
                            ${record.totalPercent !== undefined ? `(${record.totalPercent}%)` : ''} | 
                            耗時: ${record.timeString || (record.duration ? record.duration + '秒' : '未知')}
                        </span>
                    </div>
                    ${errorDetailsHtml}
                    <details class="mt-3 bg-white rounded-md border border-gray-200">
                        <summary class="cursor-pointer text-blue-600 hover:text-blue-800 font-bold p-2 bg-blue-50/50 rounded-md outline-none">查看每題詳細數據 (點擊展開)</summary>
                        <div class="mt-2 p-3 max-h-60 overflow-y-auto text-xs">
                            ${detailedStatsHtml}
                        </div>
                    </details>
                </div>
                `;
            });
        }

        // 顯示該學生最常錯單字
        const topStudentFails = Object.entries(studentWordFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topStudentFails.length > 0) {
            html += `
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm">
                <span class="font-bold text-red-800">此學生最常錯單字:</span>
                <div class="flex gap-2">
                    ${topStudentFails.map(f => `<span class="bg-white text-red-600 px-2 py-0.5 rounded border border-red-200">${f[0]} (${f[1]}次)</span>`).join('')}
                </div>
            </div>
            `;
        }

        html += `</div></div>`;
    }
    
    // 更新 Summary UI
    const elStarts = document.getElementById("rd-starts");
    const elComps = document.getElementById("rd-all-comp");
    const elAbandons = document.getElementById("rd-abandon");
    const elAvgTotal = document.getElementById("rd-avg-total");
    const elTopErrors = document.getElementById("rd-top-errors");

    if (elStarts) elStarts.textContent = totalStarts.toString();
    if (elComps) elComps.textContent = totalCompletions.toString();
    if (elAbandons) elAbandons.textContent = totalAbandons.toString();

    const avgTotalTime = totalCompletions > 0 ? Math.floor(totalDurations / totalCompletions) : 0;
    if (elAvgTotal) elAvgTotal.textContent = `${avgTotalTime}s`;

    if (elTopErrors) {
        const topFails = Object.entries(wordFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topFails.length > 0) {
            elTopErrors.innerHTML = topFails.map(f => `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold border border-red-200 shadow-sm">${f[0]} (${f[1]}次)</span>`).join(" ");
        } else {
            elTopErrors.innerHTML = '<span class="text-gray-500">尚無錯字數據</span>';
        }
    }

    if (html === '') {
        html = '<p class="text-gray-500 col-span-full text-center py-8">目前尚無符合條件的數據。</p>';
    }
    container.innerHTML = html;
}

// Setup Reading Filter Buttons
document.querySelectorAll('.rd-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Reset all buttons
        document.querySelectorAll('.rd-filter-btn').forEach(b => {
            b.className = "rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300";
        });
        // Highlight clicked button
        e.target.className = "rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-blue-600 text-white shadow";
        
        const filter = e.target.getAttribute('data-filter');
        renderReadingData(filter);
    });
});

// Render Grammar Data (Ported from GrammarDashboard.ts)
function renderGrammarData() {
    const content = document.getElementById("td-content");
    if (!content) return;

    const allData = JSON.parse(localStorage.getItem("grammar_platform_data") || "{}");

    // Dashboard Aggregation Variables
    let totalStarts = 0;
    let totalCompletions = 0;
    let totalAbandons = 0;
    let totalDurations = 0;
    const grammarPointFails = {};

    let html = "";

    for (const [user, data] of Object.entries(allData)) {
        const history = data.history || [];
        const abandons = data.abandons || [];

        const isTestUser = user.trim().toLowerCase() === "test";

        if (!isTestUser) {
            totalStarts += history.length + abandons.length;
            totalCompletions += history.length;
            totalAbandons += abandons.length;
        }

        const studentGrammarFails = {};
        const studentGrammarQuestions = {};

        html += `
        <div class="border-2 border-indigo-100 p-5 rounded-xl bg-white mb-6 shadow-sm">
            <div class="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                <h4 class="font-bold text-xl text-indigo-800">🧑‍🎓 學生：${user}</h4>
                <p class="text-sm text-indigo-600 font-medium">完成: ${history.length}次 | 跳出: ${abandons.length}次</p>
            </div>
        `;

        if (history.length > 0) {
            html += `<div class="space-y-3">`;
            history.forEach((record, idx) => {
                if (!isTestUser) {
                    totalDurations += record.duration || 0;
                }

                let statsHtml = "無詳細數據";
                if (record.stats) {
                    statsHtml = record.stats.map((s, i) => {
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
                    }).join("");
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

        const topStudentFails = Object.entries(studentGrammarFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topStudentFails.length > 0) {
            html += `
            <div class="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm font-bold text-red-800 mb-3">此學生最常錯的題型 (Top 5):</p>
                <div class="flex flex-col gap-2">
                    ${topStudentFails.map(f => {
                        const gp = f[0];
                        const count = f[1];
                        const questions = studentGrammarQuestions[gp] || [];
                        const qListHtml = questions.map(q => `<li class="text-xs text-gray-700 ml-4 list-disc break-words my-1">${q.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`).join('');
                        return `
                        <details class="bg-white border border-red-200 rounded-lg text-sm shadow-sm group overflow-hidden">
                            <summary class="cursor-pointer font-bold text-red-700 px-4 py-3 list-none flex justify-between items-center hover:bg-red-50 transition-colors">
                                <span>${gp} (${count}次)</span>
                                <span class="text-red-400">▼</span>
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
        const topFails = Object.entries(grammarPointFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topFails.length > 0) {
            elTopErrors.innerHTML = topFails.map(f => `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold border border-red-200 shadow-sm">${f[0]} (${f[1]}次)</span>`).join(" ");
        } else {
            elTopErrors.innerHTML = '<span class="text-gray-500">尚無數據</span>';
        }
    }

    if (html === "") {
        html = '<div class="h-full flex items-center justify-center"><p class="text-gray-400 text-xl font-bold">目前尚無任何遊玩紀錄。去玩一場遊戲吧！</p></div>';
    }
    content.innerHTML = html;
}

// Initialize
renderReadingData();
renderGrammarData();

// Check if URL has tab param
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tab') === 'grammar') {
    document.getElementById('tab-grammar').click();
}
