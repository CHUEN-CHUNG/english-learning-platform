import { appStorage } from '../../shared/storage/StorageManager.js';

/**
 * 教師大廳內嵌學習數據面板（與 dashboard 共用邏輯，支援單元／遊戲篩選）
 */

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** 判斷一筆紀錄是否屬於指定單元 */
export function recordMatchesUnit(record, unit) {
    if (!unit) return true;
    const code = unit.unitCode || '';
    const num = String(unit.unitNumber || '');
    const haystack = `${record.file || ''} ${record.unit || ''} ${record.unitCode || ''}`.toLowerCase();
    return (
        haystack.includes(code.toLowerCase()) ||
        haystack.includes(`yle-${num}`) ||
        record.unit === num ||
        record.unit === code
    );
}

function buildQuizDetailHtml(record) {
    if (!record.reviewData?.length) {
        return '<div class="text-gray-500 text-center py-2">此測驗無詳細逐題數據。</div>';
    }
    return record.reviewData.map((q, i) => {
        const s1Ans = q.s1UserAns ? escapeHtml(q.s1UserAns) : '(未作答)';
        const s2Ans = q.s2UserAns ? escapeHtml(q.s2UserAns) : '(未作答)';
        const s1Status = q.s1Correct ? '✅' : '❌';
        const s2Status = q.s2Correct ? '✅' : '❌';
        const s1Time = q.s1TimeMs ? (q.s1TimeMs / 1000).toFixed(1) + 's' : '--';
        const s2Time = q.s2TimeMs ? (q.s2TimeMs / 1000).toFixed(1) + 's' : '--';
        return `<div class="mb-2 border-b border-gray-100 pb-2 hover:bg-gray-50 p-1 rounded flex flex-col md:flex-row gap-2 md:items-center justify-between">
            <div><span class="font-bold text-gray-700">Q${i + 1}: ${escapeHtml(q.word)}</span></div>
            <div class="text-xs text-gray-600">
                英翻中: <span class="${q.s1Correct ? 'text-green-600' : 'text-red-500 line-through'}">${s1Ans}</span> ${s1Status} (${s1Time}) |
                中翻英: <span class="${q.s2Correct ? 'text-green-600' : 'text-red-500 line-through'}">${s2Ans}</span> ${s2Status} (${s2Time})
            </div>
        </div>`;
    }).join('');
}

function buildReadingRecordHtml(record, { isTestUser, wordFails, studentWordFails }) {
    let errorDetailsHtml = '';
    if (record.reviewData) {
        const errors = record.reviewData.filter(q => !q.s1Correct || !q.s2Correct);
        if (errors.length > 0) {
            errorDetailsHtml = `<div class="mt-2 p-2 bg-red-50 rounded text-xs border border-red-100">
                <p class="font-bold text-red-700 mb-1">答錯單字：</p>
                <div class="flex flex-wrap gap-1">`;
            errors.forEach(q => {
                if (!isTestUser) wordFails[q.word] = (wordFails[q.word] || 0) + 1;
                studentWordFails[q.word] = (studentWordFails[q.word] || 0) + 1;
                errorDetailsHtml += `<span class="bg-white px-2 py-0.5 rounded text-red-600 border border-red-200">${escapeHtml(q.word)}</span>`;
            });
            errorDetailsHtml += `</div></div>`;
        }
    }

    const gameTypeName =
        record.gameType === 'Matching' ? '🎮 連連看' :
        record.gameType === 'Reading' ? '📖 閱讀練習' :
        record.gameType === 'Quiz' ? '📝 單字總測驗' : '未知遊戲';

    const openDetails = record.gameType === 'Quiz' && record.reviewData?.length ? ' open' : '';

    return `
    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
        <div class="flex flex-col md:flex-row justify-between font-bold pb-1 gap-2">
            <span class="text-gray-700">${gameTypeName} <span class="text-xs text-gray-500 font-normal">(${escapeHtml(record.date)})</span><br><span class="text-xs text-blue-500">單元: ${escapeHtml(record.file || record.unit || '未知')}</span></span>
            <span class="text-blue-600 text-right md:text-left">
                得分: <span class="text-lg">${record.score || 0}${record.total ? ` / ${record.total}` : ''}</span>
                ${record.totalPercent !== undefined ? `(${record.totalPercent}%)` : ''} |
                耗時: ${escapeHtml(record.timeString || (record.duration ? record.duration + '秒' : '未知'))}
            </span>
        </div>
        ${errorDetailsHtml}
        <details class="mt-3 bg-white rounded-md border border-gray-200"${openDetails}>
            <summary class="cursor-pointer text-blue-600 hover:text-blue-800 font-bold p-2 bg-blue-50/50 rounded-md outline-none">查看每題詳細數據 (點擊展開)</summary>
            <div class="mt-2 p-3 max-h-60 overflow-y-auto text-xs">
                ${buildQuizDetailHtml(record)}
            </div>
        </details>
    </div>`;
}

export async function renderReadingDataPanel(options = {}) {
    const { filterType = 'All', unit = null } = options;
    const container = document.getElementById('reading-data-container');
    if (!container) return;

    const allData = await appStorage.load('word_exam_all_data') || {};

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

        if (filterType !== 'All') {
            history = history.filter(r => r.gameType === filterType);
        }
        if (unit) {
            history = history.filter(r => recordMatchesUnit(r, unit));
        }
        if (history.length === 0 && (filterType !== 'All' || unit)) continue;

        const isTestUser = user.trim().toLowerCase() === 'test';
        if (!isTestUser) {
            const relevantAbandons =
                filterType === 'All' && !unit
                    ? abandons
                    : abandons.filter(a => {
                        if (filterType !== 'All' && a.gameType !== filterType) return false;
                        return unit ? recordMatchesUnit(a, unit) : true;
                    });
            totalStarts += history.length + relevantAbandons.length;
            totalCompletions += history.length;
            totalAbandons += relevantAbandons.length;
        }

        const studentWordFails = {};
        html += `
        <div class="border-2 border-blue-100 p-5 rounded-xl bg-white mb-6 shadow-sm">
            <div class="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                <h3 class="font-bold text-xl text-blue-800">🧑‍🎓 學生：${escapeHtml(user)}</h3>
                <p class="text-sm text-gray-600">完成測驗: ${profile.totalTests || 0} 次 | 連續學習: ${profile.streak || 0} 天</p>
            </div>
            <div class="space-y-3">`;

        if (history.length === 0) {
            html += `<p class="text-xs text-gray-400">尚無符合條件的測驗紀錄</p>`;
        } else {
            history.forEach(record => {
                if (!isTestUser && record.duration) totalDurations += record.duration;
                html += buildReadingRecordHtml(record, { isTestUser, wordFails, studentWordFails });
            });
        }

        const topStudentFails = Object.entries(studentWordFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topStudentFails.length > 0) {
            html += `
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-wrap items-center gap-2 text-sm">
                <span class="font-bold text-red-800">此學生最常錯單字:</span>
                ${topStudentFails.map(f => `<span class="bg-white text-red-600 px-2 py-0.5 rounded border border-red-200">${escapeHtml(f[0])} (${f[1]}次)</span>`).join('')}
            </div>`;
        }
        html += `</div></div>`;
    }

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('rd-starts', String(totalStarts));
    setText('rd-all-comp', String(totalCompletions));
    setText('rd-abandon', String(totalAbandons));
    setText('rd-avg-total', totalCompletions > 0 ? `${Math.floor(totalDurations / totalCompletions)}s` : '0s');

    const elTopErrors = document.getElementById('rd-top-errors');
    if (elTopErrors) {
        const topFails = Object.entries(wordFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        elTopErrors.innerHTML = topFails.length
            ? topFails.map(f => `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold border border-red-200 shadow-sm">${escapeHtml(f[0])} (${f[1]}次)</span>`).join('')
            : '<span class="text-gray-500">尚無錯字數據</span>';
    }

    container.innerHTML = html || '<p class="text-gray-500 text-center py-8">目前尚無符合條件的數據。</p>';
}

export async function renderGrammarDataPanel() {
    const content = document.getElementById('td-content');
    if (!content) return;

    const allData = await appStorage.load('grammar_platform_data') || {};
    let totalStarts = 0;
    let totalCompletions = 0;
    let totalAbandons = 0;
    let totalDurations = 0;
    const grammarPointFails = {};
    let html = '';

    for (const [user, data] of Object.entries(allData)) {
        const history = data.history || [];
        const abandons = data.abandons || [];
        const isTestUser = user.trim().toLowerCase() === 'test';

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
                <h4 class="font-bold text-xl text-indigo-800">🧑‍🎓 學生：${escapeHtml(user)}</h4>
                <p class="text-sm text-indigo-600 font-medium">完成: ${history.length}次 | 跳出: ${abandons.length}次</p>
            </div>`;

        if (history.length > 0) {
            html += `<div class="space-y-3">`;
            history.forEach(record => {
                if (!isTestUser) totalDurations += record.duration || 0;

                let statsHtml = '無詳細數據';
                if (record.stats) {
                    statsHtml = record.stats.map((s, i) => {
                        if (!s.isCorrect) {
                            if (!isTestUser) grammarPointFails[s.grammarPoint] = (grammarPointFails[s.grammarPoint] || 0) + 1;
                            studentGrammarFails[s.grammarPoint] = (studentGrammarFails[s.grammarPoint] || 0) + 1;
                            const questionText = s.targetSentence || s.text || '未知題目';
                            if (!studentGrammarQuestions[s.grammarPoint]) studentGrammarQuestions[s.grammarPoint] = [];
                            if (!studentGrammarQuestions[s.grammarPoint].includes(questionText)) {
                                studentGrammarQuestions[s.grammarPoint].push(questionText);
                            }
                        }
                        let specificMetrics = '';
                        if (record.gameType === 'MultipleChoice') {
                            specificMetrics = `打擊 <span class="font-bold">${s.clicks || 0}</span> 次 | 錯擊 <span class="font-bold text-red-500">${s.wrongClicks || 0}</span> 次`;
                        } else if (record.gameType === 'Unscramble') {
                            specificMetrics = `裝上 <span class="font-bold">${s.attaches || 0}</span> 次 / 拆下 <span class="font-bold">${s.detaches || 0}</span> 次 | 錯誤送出 <span class="font-bold text-red-500">${s.wrongSubmits || 0}</span> 次`;
                        } else {
                            specificMetrics = s.wrongSubmits ? `錯誤送出 <span class="font-bold text-red-500">${s.wrongSubmits}</span> 次` : '';
                        }
                        return `<div class="mb-2 border-b border-gray-100 pb-2 hover:bg-gray-50 p-1 rounded">
                            <span class="font-bold text-gray-700">Q${i + 1} (${escapeHtml(s.grammarPoint)}):</span>
                            耗時 <span class="font-bold text-indigo-600">${s.timeMs}ms</span> |
                            ${specificMetrics} |
                            最終: ${s.isCorrect ? '✅ 成功' : '❌ 失敗'}
                        </div>`;
                    }).join('');
                }

                const gameTypeName =
                    record.gameType === 'MultipleChoice' ? '🕳️ 選擇題' :
                    record.gameType === 'Unscramble' ? '🚂 重組題' : record.gameType || '未知遊戲';

                html += `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                    <div class="flex flex-col md:flex-row justify-between font-bold border-b pb-2 mb-3 gap-2">
                        <span class="text-gray-700">${gameTypeName} <span class="text-xs text-gray-500 font-normal">(${escapeHtml(record.date)})</span><br><span class="text-xs text-indigo-500">單元: ${escapeHtml(record.unit)}</span></span>
                        <span class="text-indigo-600">答對: <span class="text-lg">${record.score}</span> | 耗時: ${record.duration}s</span>
                    </div>
                    <details class="bg-white rounded-md border border-gray-200" open>
                        <summary class="cursor-pointer text-indigo-600 hover:text-indigo-800 font-bold p-2 bg-indigo-50/50 rounded-md outline-none">查看每題詳細數據 (點擊展開)</summary>
                        <div class="mt-2 p-3 max-h-60 overflow-y-auto text-xs">${statsHtml}</div>
                    </details>
                </div>`;
            });
            html += `</div>`;
        }

        const topStudentFails = Object.entries(studentGrammarFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (topStudentFails.length > 0) {
            html += `<div class="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm font-bold text-red-800 mb-3">此學生最常錯的題型 (Top 5):</p>
                <div class="flex flex-col gap-2">
                ${topStudentFails.map(f => {
                    const gp = f[0];
                    const questions = (studentGrammarQuestions[gp] || []).map(q =>
                        `<li class="text-xs text-gray-700 ml-4 list-disc break-words my-1">${escapeHtml(q)}</li>`
                    ).join('');
                    return `<details class="bg-white border border-red-200 rounded-lg text-sm shadow-sm">
                        <summary class="cursor-pointer font-bold text-red-700 px-4 py-3">${escapeHtml(gp)} (${f[1]}次)</summary>
                        <div class="p-4 border-t border-red-100"><ul>${questions}</ul></div>
                    </details>`;
                }).join('')}
                </div></div>`;
        }
        html += `</div>`;
    }

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('td-starts', String(totalStarts));
    setText('td-all-comp', String(totalCompletions));
    setText('td-abandon', String(totalAbandons));
    setText('td-avg-total', totalCompletions > 0 ? `${Math.floor(totalDurations / totalCompletions)}s` : '0s');

    const elTopErrors = document.getElementById('td-top-errors');
    if (elTopErrors) {
        const topFails = Object.entries(grammarPointFails).sort((a, b) => b[1] - a[1]).slice(0, 5);
        elTopErrors.innerHTML = topFails.length
            ? topFails.map(f => `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold border border-red-200 shadow-sm">${escapeHtml(f[0])} (${f[1]}次)</span>`).join('')
            : '<span class="text-gray-500">尚無數據</span>';
    }

    content.innerHTML = html || '<p class="text-gray-500 text-center py-8">目前尚無文法遊戲紀錄。</p>';
}

let panelState = { tab: 'reading', filterType: 'All', unit: null, unitTitle: '' };

async function switchDataTab(tab) {
    panelState.tab = tab;
    const tabReading = document.getElementById('tab-reading');
    const tabGrammar = document.getElementById('tab-grammar');
    const contentReading = document.getElementById('content-reading');
    const contentGrammar = document.getElementById('content-grammar');

    const readingActive =
        'border-blue-500 text-blue-600 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg';
    const readingIdle =
        'border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg';
    const grammarActive =
        'border-indigo-500 text-indigo-600 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg';
    const grammarIdle =
        'border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg';

    if (tab === 'reading') {
        if (tabReading) tabReading.className = readingActive;
        if (tabGrammar) tabGrammar.className = grammarIdle;
        if (contentReading) {
            contentReading.classList.remove('hidden');
            contentReading.style.display = '';
        }
        if (contentGrammar) {
            contentGrammar.classList.add('hidden');
            contentGrammar.style.display = 'none';
        }
        await applyReadingFilters();
    } else {
        if (tabGrammar) tabGrammar.className = grammarActive;
        if (tabReading) tabReading.className = readingIdle;
        if (contentGrammar) {
            contentGrammar.classList.remove('hidden');
            contentGrammar.style.display = '';
        }
        if (contentReading) {
            contentReading.classList.add('hidden');
            contentReading.style.display = 'none';
        }
        await renderGrammarDataPanel();
    }
    updatePanelSubtitle();
}

async function applyReadingFilters() {
    await renderReadingDataPanel({ filterType: panelState.filterType, unit: panelState.unit });
    highlightReadingFilterButtons();
}

function highlightReadingFilterButtons() {
    document.querySelectorAll('.rd-filter-btn').forEach(btn => {
        const active = btn.getAttribute('data-filter') === panelState.filterType;
        btn.className = active
            ? 'rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-blue-600 text-white shadow'
            : 'rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300';
    });
}

function updatePanelSubtitle() {
    const el = document.getElementById('teacher-data-subtitle');
    if (!el) return;
    const parts = [];
    if (panelState.unitTitle) parts.push(panelState.unitTitle);
    if (panelState.filterType !== 'All') {
        const names = { Matching: '同反義詞連連看', Reading: '閱讀練習', Quiz: '單字總測驗' };
        parts.push(names[panelState.filterType] || panelState.filterType);
    }
    el.textContent = parts.length ? parts.join(' · ') : '全站學習數據';
}

/** 初始化面板 DOM 與事件（教師大廳 index 載入時呼叫一次） */
export function initTeacherDataPanel() {
    document.getElementById('tab-reading')?.addEventListener('click', () => switchDataTab('reading'));
    document.getElementById('tab-grammar')?.addEventListener('click', () => switchDataTab('grammar'));
    document.getElementById('teacher-data-close')?.addEventListener('click', closeTeacherDataPanel);

    document.querySelectorAll('.rd-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            panelState.filterType = e.target.getAttribute('data-filter') || 'All';
            applyReadingFilters();
        });
    });
}

/** 從教師大廳單元卡片開啟數據面板 */
export async function openTeacherDataPanel({ tab = 'reading', gameType = 'All', unit = null, unitTitle = '' } = {}) {
    panelState = { tab, filterType: gameType, unit, unitTitle };
    const overlay = document.getElementById('teacher-data-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    await switchDataTab(tab);
}

export function closeTeacherDataPanel() {
    document.getElementById('teacher-data-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
}
