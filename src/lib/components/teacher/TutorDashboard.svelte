<script lang="ts">
  import { onMount } from 'svelte';
  import { aggregateAcrossUsers } from '$lib/utils/teacher-aggregate';
  import { GAME_DATA_KEY, gameLabel as gameTypeLabel, type GameSession } from '$lib/game-core/game-data';

  interface StudentData {
    history: GameSession[]; // 完成的場次（新到舊）
    abandons: GameSession[]; // 跳出的場次
    streak: number;
  }

  interface StudentSummary {
    name: string;
    score: number;
    status: 'ahead' | 'normal' | 'behind';
    statusText: string;
  }

  // View states
  let currentView = $state<'overview' | 'student' | 'session'>('overview');
  let selectedStudent = $state<string | null>(null);
  let selectedSession = $state<GameSession | null>(null);

  // 從全平台統一資料層（platform_game_data）跨學生彙整
  let dataByStudent = $state<Record<string, StudentData>>({});
  let students = $state<StudentSummary[]>([]);
  let loading = $state(true);

  onMount(async () => {
    dataByStudent = await loadData();
    students = buildStudentSummaries(dataByStudent);
    loading = false;
  });

  async function loadData(): Promise<Record<string, StudentData>> {
    const agg = await aggregateAcrossUsers([GAME_DATA_KEY]);
    const merged: Record<string, StudentData> = {};

    for (const [name, d] of Object.entries<any>(agg[GAME_DATA_KEY])) {
      if (!name || name.toLowerCase() === 'test') continue;
      const sessions = (d.sessions || []) as GameSession[];
      const history = sessions
        .filter((s) => s.status === 'completed')
        .sort((a, b) => parseDate(rawDate(b)) - parseDate(rawDate(a)));
      const abandons = sessions.filter((s) => s.status === 'abandoned');
      merged[name] = { history, abandons, streak: d.profile?.streak || 0 };
    }
    return merged;
  }

  function rawDate(s: GameSession): string {
    return (s.extra?.date as string) || s.date;
  }

  function parseDate(date?: string): number {
    if (!date) return 0;
    const t = Date.parse(date);
    return Number.isNaN(t) ? 0 : t;
  }

  // 評分型遊戲回傳百分比；純計分型（maxScore 0）回傳原始分數
  function recordPercent(s: GameSession): number {
    return s.maxScore > 0 ? s.percent : s.score;
  }

  function avgScore(history: GameSession[]): number {
    if (!history.length) return 0;
    const sum = history.reduce((acc, s) => acc + recordPercent(s), 0);
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

  // 學生弱點：彙整所有答錯題目（文法點優先，否則題目本身）
  function getWeakness(history: GameSession[]): { label: string; count: number; note: string }[] {
    const counts: Record<string, { count: number; note: string }> = {};
    history.forEach((s) => {
      (s.questions || []).forEach((q) => {
        if (q.isCorrect) return;
        const tag = q.tags?.[0];
        const label = tag || q.prompt || '未知';
        const note = tag ? '文法觀念錯誤' : '作答錯誤';
        if (!counts[label]) counts[label] = { count: 0, note };
        counts[label].count++;
      });
    });
    return Object.entries(counts)
      .map(([label, v]) => ({ label, count: v.count, note: v.note }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // 單次測驗的錯題清單
  function getSessionErrors(s: GameSession | null) {
    if (!s) return [];
    return (s.questions || [])
      .filter((q) => !q.isCorrect)
      .map((q) => ({
        question: q.prompt || '未知題目',
        studentAnswer: q.userAnswer || '答錯',
        correctAnswer: q.correctAnswer || '—',
        tag: q.tags?.[0]
      }));
  }

  function sessionTitle(s: GameSession): string {
    return `${gameTypeLabel(s.gameType)}・${s.unitTitle || s.unitId || '未知單元'}`;
  }

  function sessionDate(s: GameSession): string {
    return (s.extra?.date as string) || new Date(s.date).toLocaleString('zh-TW');
  }

  function sessionTime(s: GameSession): string {
    const sec = Math.round(s.durationMs / 1000);
    return sec >= 60 ? `${Math.floor(sec / 60)} 分 ${sec % 60} 秒` : `${sec} 秒`;
  }

  function goStudent(name: string) {
    selectedStudent = name;
    currentView = 'student';
  }

  function goSession(record: GameSession) {
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
                <span class="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded mb-2">{sessionDate(log)}</span>
                <p class="font-extrabold text-xl text-blue-900">{sessionTitle(log)}</p>
              </div>
              <div class="text-right">
                <p class="font-black text-xl mb-1 {recordPercent(log) >= 80 ? 'text-green-600' : 'text-red-500'}">
                  🎯 {recordPercent(log)} <span class="text-sm">分</span>
                </p>
                <p class="text-sm font-medium text-gray-500">⏱️ 耗時 {sessionTime(log)}</p>
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
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">📅 測驗日期：{sessionDate(selectedSession)}</span>
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">🎯 得分：{recordPercent(selectedSession)}</span>
          <span class="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">⏱️ 花費時間：{sessionTime(selectedSession)}</span>
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