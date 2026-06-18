<script lang="ts">
  import { onMount } from 'svelte';
  import { aggregateAcrossUsers } from '$lib/utils/teacher-aggregate';

  interface HistoryRecord {
    date?: string;
    gameType?: string;
    unit?: string;
    file?: string;
    duration?: number;
    timeString?: string;
    score?: number;
    total?: number;
    totalPercent?: number;
    stats?: any[];
    reviewData?: any[];
  }

  interface StudentData {
    history: HistoryRecord[];
    abandons: HistoryRecord[];
    streak: number;
  }

  interface StudentSummary {
    name: string;
    score: number;
    status: 'ahead' | 'normal' | 'behind';
    statusText: string;
  }

  const GAME_LABELS: Record<string, string> = {
    Matching: '同反義詞連連看',
    Reading: '閱讀練習',
    Quiz: '單字總測驗',
    MultipleChoice: '打地鼠選擇題',
    Unscramble: '火車重組題',
    Correction: '挑錯題',
    FillIn: '填空題'
  };

  // View states
  let currentView = $state<'overview' | 'student' | 'session'>('overview');
  let selectedStudent = $state<string | null>(null);
  let selectedSession = $state<HistoryRecord | null>(null);

  // Real data loaded from appStorage (Firebase / localStorage)
  let dataByStudent = $state<Record<string, StudentData>>({});
  let students = $state<StudentSummary[]>([]);
  let loading = $state(true);

  onMount(async () => {
    dataByStudent = await loadCombinedData();
    students = buildStudentSummaries(dataByStudent);
    loading = false;
  });

  // 合併 reading（word_exam_all_data）與 grammar（grammar_platform_data）兩邊紀錄，
  // Firebase 模式下會跨所有學生彙整。
  async function loadCombinedData(): Promise<Record<string, StudentData>> {
    const agg = await aggregateAcrossUsers([
      'word_exam_all_data',
      'grammar_platform_data',
      'grammar_choice_data',
      'grammar_unscramble_data'
    ]);

    const merged: Record<string, StudentData> = {};

    const add = (name: string, history: HistoryRecord[], abandons: HistoryRecord[], streak = 0) => {
      if (!name || name.toLowerCase() === 'test') return;
      if (!merged[name]) merged[name] = { history: [], abandons: [], streak: 0 };
      merged[name].history.push(...history);
      merged[name].abandons.push(...abandons);
      if (streak) merged[name].streak = Math.max(merged[name].streak, streak);
    };

    for (const [name, d] of Object.entries<any>(agg['word_exam_all_data'])) {
      add(name, d.history || [], d.abandons || [], d.profile?.streak || 0);
    }

    const grammar = buildGrammarData(agg);
    for (const [name, d] of Object.entries(grammar)) {
      add(name, d.history, d.abandons);
    }

    // 同一學生的紀錄依時間新到舊排序
    for (const d of Object.values(merged)) {
      d.history.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    }
    return merged;
  }

  // 將 grammar_platform_data 與舊資料（choice / unscramble）合併並補上 gameType
  function buildGrammarData(
    agg: Record<string, Record<string, any>>
  ): Record<string, { history: HistoryRecord[]; abandons: HistoryRecord[] }> {
    const data: Record<string, { history: HistoryRecord[]; abandons: HistoryRecord[] }> = {};

    for (const [u, d] of Object.entries<any>(agg['grammar_platform_data'])) {
      data[u] = { history: [...(d.history || [])], abandons: [...(d.abandons || [])] };
    }

    const mergeLegacy = (key: string, gameType: string) => {
      for (const [u, d] of Object.entries<any>(agg[key] || {})) {
        const history = (d.history || []).map((r: any) => ({ ...r, gameType }));
        const abandons = (d.abandons || []).map((r: any) => ({ ...r, gameType }));
        if (!data[u]) data[u] = { history, abandons };
        else {
          data[u].history.push(...history);
          data[u].abandons.push(...abandons);
        }
      }
    };

    mergeLegacy('grammar_choice_data', 'MultipleChoice');
    mergeLegacy('grammar_unscramble_data', 'Unscramble');
    return data;
  }

  function parseDate(date?: string): number {
    if (!date) return 0;
    const t = Date.parse(date);
    return Number.isNaN(t) ? 0 : t;
  }

  function recordPercent(r: HistoryRecord): number {
    return r.totalPercent ?? r.score ?? 0;
  }

  function avgScore(history: HistoryRecord[]): number {
    if (!history.length) return 0;
    const sum = history.reduce((s, r) => s + recordPercent(r), 0);
    return Math.round(sum / history.length);
  }

  function buildStudentSummaries(data: Record<string, StudentData>): StudentSummary[] {
    const names = Object.keys(data).filter((n) => data[n].history.length > 0);
    if (!names.length) return [];

    const scores = names.map((n) => avgScore(data[n].history));
    const siteAvg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

    return names
      .map((name) => {
        const score = avgScore(data[name].history);
        const diff = score - siteAvg;
        let status: StudentSummary['status'] = 'normal';
        let statusText = '➡️ 與全站平均持平';
        if (diff >= 5) {
          status = 'ahead';
          statusText = `⬆️ 領先全站平均 ${diff}%`;
        } else if (diff <= -5) {
          status = 'behind';
          statusText = `⬇️ 落後全站平均 ${Math.abs(diff)}%`;
        }
        return { name, score, status, statusText };
      })
      .sort((a, b) => b.score - a.score);
  }

  // 學生弱點：彙整 reading 錯詞 + grammar 錯誤文法點
  function getWeakness(history: HistoryRecord[]): { label: string; count: number; note: string }[] {
    const counts: Record<string, { count: number; note: string }> = {};
    history.forEach((r) => {
      (r.reviewData || []).forEach((q: any) => {
        if (q.s1Correct === false || q.s2Correct === false) {
          const label = q.word || q.phrase || q.question || '未知';
          if (!counts[label]) counts[label] = { count: 0, note: '字彙作答錯誤' };
          counts[label].count++;
        }
      });
      (r.stats || []).forEach((s: any) => {
        if (s.isCorrect === false && s.grammarPoint) {
          const label = s.grammarPoint;
          if (!counts[label]) counts[label] = { count: 0, note: '文法觀念錯誤' };
          counts[label].count++;
        }
      });
    });
    return Object.entries(counts)
      .map(([label, v]) => ({ label, count: v.count, note: v.note }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // 單次測驗的錯題清單（reading 用 reviewData、grammar 用 stats）
  function getSessionErrors(r: HistoryRecord | null) {
    if (!r) return [];
    const errors: { question: string; studentAnswer: string; correctAnswer: string; tag?: string }[] = [];

    (r.reviewData || []).forEach((q: any) => {
      if (q.s1Correct === false || q.s2Correct === false) {
        const parts: string[] = [];
        if (q.s1Correct === false) parts.push(`英翻中：${q.s1UserAns || '(未作答)'}`);
        if (q.s2Correct === false) parts.push(`中翻英：${q.s2UserAns || '(未作答)'}`);
        errors.push({
          question: q.word || q.phrase || q.question || '未知題目',
          studentAnswer: parts.join('　/　'),
          correctAnswer: q.answer || q.meaning || q.correctAnswer || '—'
        });
      }
    });

    (r.stats || []).forEach((s: any) => {
      if (s.isCorrect === false) {
        errors.push({
          question: s.targetSentence || s.text || '未知題目',
          studentAnswer: '答錯',
          correctAnswer: s.correctAnswer || '—',
          tag: s.grammarPoint
        });
      }
    });

    return errors;
  }

  function gameLabel(r: HistoryRecord): string {
    return GAME_LABELS[r.gameType || ''] || r.gameType || '未知遊戲';
  }

  function sessionTitle(r: HistoryRecord): string {
    return `${gameLabel(r)}・${r.unit || '未知單元'}`;
  }

  function goStudent(name: string) {
    selectedStudent = name;
    currentView = 'student';
  }

  function goSession(record: HistoryRecord) {
    selectedSession = record;
    currentView = 'session';
  }

  function exportReviewSheet() {
    if (!selectedStudent) return;
    const weakness = getWeakness(dataByStudent[selectedStudent]?.history || []);
    const list = weakness.length
      ? weakness.map((w, i) => `${i + 1}. ${w.label}（錯 ${w.count} 次・${w.note}）`).join('\n')
      : '目前尚無常錯紀錄。';
    alert(`即將依 ${selectedStudent} 的真實作答資料匯出專屬複習卷！\n\n常錯重點：\n${list}`);
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
        {#if loading}
          <div class="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
            ⏳ 正在從雲端載入學生資料…
          </div>
        {:else if students.length === 0}
          <div class="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
            尚無任何學生作答資料。學生完成遊戲後即會自動同步顯示於此。
          </div>
        {:else}
          <div class="space-y-4">
            {#each students as student}
              <button 
                class="w-full text-left bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center group"
                onclick={() => goStudent(student.name)}
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
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-black {student.score >= 80 ? 'text-green-600' : student.score >= 60 ? 'text-blue-600' : 'text-red-500'}">{student.score}<span class="text-sm text-gray-400 ml-0.5">分</span></span>
                  <span class="text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">檢視檔案 &rarr;</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if currentView === 'student' && selectedStudent}
    {@const profile = dataByStudent[selectedStudent]}
    {@const history = profile?.history || []}
    {@const weakness = getWeakness(history)}
    <!-- 第二層：學生個人檔案 -->
    <div class="student-profile animate-fade-in">
      <div class="flex flex-wrap justify-between items-end mb-6 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 class="text-3xl font-extrabold text-gray-800">🧑‍🎓 {selectedStudent} 的學習檔案</h2>
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
        <!-- 綜合數據摘要 -->
        <div class="bg-gray-50 rounded-2xl p-5 border border-gray-200 grid grid-cols-2 gap-3 content-center">
          <div class="bg-white rounded-xl p-3 text-center shadow-sm">
            <p class="text-xs text-gray-500 font-bold mb-1">🎯 平均得分</p>
            <p class="text-2xl font-black text-blue-700">{avgScore(history)}</p>
          </div>
          <div class="bg-white rounded-xl p-3 text-center shadow-sm">
            <p class="text-xs text-gray-500 font-bold mb-1">✅ 完成次數</p>
            <p class="text-2xl font-black text-green-600">{history.length}</p>
          </div>
          <div class="bg-white rounded-xl p-3 text-center shadow-sm">
            <p class="text-xs text-gray-500 font-bold mb-1">🔥 連續天數</p>
            <p class="text-2xl font-black text-orange-500">{profile?.streak || 0}</p>
          </div>
          <div class="bg-white rounded-xl p-3 text-center shadow-sm">
            <p class="text-xs text-gray-500 font-bold mb-1">🏃 跳出次數</p>
            <p class="text-2xl font-black text-red-500">{profile?.abandons.length || 0}</p>
          </div>
        </div>

        <!-- 常錯弱點 -->
        <div class="col-span-1 md:col-span-2 bg-red-50 rounded-2xl p-6 border border-red-100">
          <p class="text-red-800 font-extrabold text-lg mb-3 flex items-center gap-2">
            ⚠️ 歷史常錯弱點分析
          </p>
          {#if weakness.length === 0}
            <p class="text-gray-500 text-sm">目前尚無常錯紀錄，表現穩定！</p>
          {:else}
            <ul class="space-y-3">
              {#each weakness as w}
                <li class="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex items-center gap-3">
                  <span class="bg-red-100 text-red-700 font-black px-2 py-1 rounded whitespace-nowrap">錯 {w.count} 次</span>
                  <span class="font-bold text-gray-800">{w.label}</span>
                  <span class="text-gray-500 text-sm ml-auto">{w.note}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>

      <!-- 遊玩紀錄 -->
      <h3 class="text-xl font-extrabold text-gray-800 mb-4">📅 遊玩紀錄時間軸</h3>
      {#if history.length === 0}
        <p class="text-gray-500 text-sm">此學生尚無遊玩紀錄。</p>
      {:else}
        <div class="space-y-3">
          {#each history as log}
            <button 
              class="w-full text-left bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow flex justify-between items-center transition-all group"
              onclick={() => goSession(log)}
            >
              <div>
                <span class="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded mb-2">{log.date || '—'}</span>
                <p class="font-extrabold text-xl text-blue-900">{sessionTitle(log)}</p>
              </div>
              <div class="text-right">
                <p class="font-black text-xl mb-1 {recordPercent(log) >= 80 ? 'text-green-600' : 'text-red-500'}">
                  🎯 {recordPercent(log)} <span class="text-sm">分</span>
                </p>
                <p class="text-sm font-medium text-gray-500">⏱️ 耗時 {log.timeString || `${log.duration || 0}秒`}</p>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if currentView === 'session' && selectedSession}
    {@const errors = getSessionErrors(selectedSession)}
    <!-- 第三層：單次測驗明細 -->
    <div class="session-details animate-fade-in">
      <div class="bg-gradient-to-r from-blue-800 to-indigo-800 text-white p-6 rounded-t-2xl shadow-lg relative overflow-hidden">
        <div class="absolute top-0 right-0 opacity-10 text-9xl transform translate-x-4 -translate-y-4">🔍</div>
        <h2 class="text-3xl font-black mb-4 relative z-10">{sessionTitle(selectedSession)}</h2>
        <div class="flex flex-wrap gap-4 text-blue-100 font-medium relative z-10">
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">📅 測驗日期：{selectedSession.date || '—'}</span>
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">🎯 得分：{recordPercent(selectedSession)}</span>
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">⏱️ 花費時間：{selectedSession.timeString || `${selectedSession.duration || 0}秒`}</span>
        </div>
      </div>

      <div class="border-2 border-t-0 border-blue-100 rounded-b-2xl p-6 bg-white shadow-sm">
        <h3 class="text-xl font-extrabold text-gray-800 mb-6 border-b pb-3">🔍 錯題還原清單</h3>
        
        {#if errors.length === 0}
          <p class="text-gray-500 text-sm">本次測驗全部答對，或無逐題詳細紀錄。 🎉</p>
        {:else}
          <div class="space-y-5">
            {#each errors as err}
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
        {/if}
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