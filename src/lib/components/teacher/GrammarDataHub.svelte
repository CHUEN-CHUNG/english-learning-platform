<script lang="ts">
  import { onMount } from 'svelte';
  import { aggregateAcrossUsers } from '$lib/utils/teacher-aggregate';
  import { GAME_DATA_KEY, gameCategory } from '$lib/game-core/game-data';

  let allData = $state<any>({});
  let selectedGameType = $state<string | null>(null);
  let selectedUnit = $state<string | null>(null);
  let selectedStudent = $state<string | null>(null);
  
  onMount(async () => {
    // 跨所有學生彙整統一資料層（Firebase 模式讀整個 users collection），取文法類場次。
    const agg = await aggregateAcrossUsers([GAME_DATA_KEY]);
    allData = adaptGrammar(agg[GAME_DATA_KEY]);
  });

  // 從統一資料層取出文法類場次，映射回本面板既有的紀錄形狀（含逐題 stats）。
  function adaptGrammar(byUser: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [u, d] of Object.entries<any>(byUser)) {
      const history: any[] = [];
      const abandons: any[] = [];
      for (const s of (d.sessions || [])) {
        if (gameCategory(s.gameType) !== 'grammar') continue;
        const rec = {
          gameType: s.gameType,
          unit: s.unitId,
          score: s.score,
          duration: Math.round(s.durationMs / 1000),
          date: (s.extra?.date as string) || s.date,
          stats: (s.questions || []).map((q: any) => ({
            grammarPoint: q.tags?.[0] || '',
            isCorrect: q.isCorrect,
            timeMs: q.timeMs || 0,
            text: q.prompt,
            targetSentence: q.prompt,
            clicks: q.metrics?.clicks,
            wrongClicks: q.metrics?.wrongClicks,
            wrongSubmits: q.metrics?.wrongSubmits,
            attaches: q.metrics?.attaches,
            detaches: q.metrics?.detaches
          }))
        };
        (s.status === 'completed' ? history : abandons).push(rec);
      }
      out[u] = { history, abandons };
    }
    return out;
  }

  const gameTypes = [
    { id: 'MultipleChoice', name: '🕳️ 打地鼠選擇題', desc: 'Multiple Choice Data' },
    { id: 'Unscramble', name: '🚂 火車重組題', desc: 'Unscramble Data' },
    { id: 'Correction', name: '🔧 挑錯題', desc: 'Correction Data' },
    { id: 'FillIn', name: '📝 填空題', desc: 'Fill-in Data' }
  ] as const;

  function getAvailableUnits() {
    const unitsSet = new Set<string>();
    Object.values(allData).forEach((data: any) => {
      (data.history || []).forEach((r: any) => {
        if (r.gameType === selectedGameType && r.unit) {
          unitsSet.add(r.unit);
        }
      });
    });
    return Array.from(unitsSet).sort();
  }

  // Compute aggregate stats for a specific game type
  function getGameTypeStats(gameType: string) {
    let totalScore = 0;
    let totalDuration = 0;
    let completionCount = 0;
    let abandonCount = 0;
    const wrongGrammarPoints: Record<string, number> = {};

    Object.entries(allData).forEach(([student, data]: [string, any]) => {
      if (student.toLowerCase() === 'test') return;

      // History
      const records = (data.history || []).filter((r: any) => r.gameType === gameType);
      records.forEach((r: any) => {
        completionCount++;
        totalScore += r.score || 0;
        totalDuration += r.duration || 0;

        if (r.stats) {
          r.stats.forEach((s: any) => {
            if (!s.isCorrect && s.grammarPoint) {
              wrongGrammarPoints[s.grammarPoint] = (wrongGrammarPoints[s.grammarPoint] || 0) + 1;
            }
          });
        }
      });

      // Abandons
      const abandons = (data.abandons || []).filter((r: any) => r.gameType === gameType);
      abandonCount += abandons.length;
    });

    const avgScore = completionCount ? Math.round((totalScore / completionCount) * 10) / 10 : 0;
    const avgDuration = completionCount ? Math.round(totalDuration / completionCount) : 0;

    const topWrongGrammarPoints = Object.entries(wrongGrammarPoints).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      avgScore,
      avgDuration,
      completionCount,
      abandonCount,
      topWrongGrammarPoints
    };
  }

  // Get students who played specific unit and game type
  function getStudentsForUnit(gameType: string, unit: string) {
    const students: { name: string; recordCount: number }[] = [];
    Object.entries(allData).forEach(([student, data]: [string, any]) => {
      if (student.toLowerCase() === 'test') return;
      const records = (data.history || []).filter((r: any) => r.gameType === gameType && r.unit === unit);
      if (records.length > 0) {
        students.push({ name: student, recordCount: records.length });
      }
    });
    return students;
  }

  // Get student's records for a specific unit and game type
  function getStudentRecord(gameType: string, unit: string, studentName: string) {
    const data = allData[studentName];
    if (!data) return [];
    return (data.history || []).filter((r: any) => r.gameType === gameType && r.unit === unit);
  }

  // Aggregate student stats for specific game type and unit
  function getStudentStats(records: any[]) {
    if (!records.length) return null;
    let totalScore = 0;
    let totalDuration = 0;
    const wrongGrammarPoints: Record<string, number> = {};

    records.forEach(r => {
      totalScore += r.score || 0;
      totalDuration += r.duration || 0;
      if (r.stats) {
        r.stats.forEach((s: any) => {
          if (!s.isCorrect && s.grammarPoint) {
            wrongGrammarPoints[s.grammarPoint] = (wrongGrammarPoints[s.grammarPoint] || 0) + 1;
          }
        });
      }
    });

    const completionCount = records.length;
    return {
      avgScore: Math.round((totalScore / completionCount) * 10) / 10,
      avgDuration: Math.round(totalDuration / completionCount),
      completionCount,
      topWrongGrammarPoints: Object.entries(wrongGrammarPoints).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }

  function getStudentAbandonCount(gameType: string, unit: string, studentName: string) {
    const data = allData[studentName];
    if (!data) return 0;
    const abandons = (data.abandons || []).filter((r: any) => r.gameType === gameType && r.unit === unit);
    return abandons.length;
  }

</script>

<div class="grammar-data-hub space-y-6">
  
  {#if !selectedGameType}
    <!-- Main Selection: Game Types -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each gameTypes as gt}
        <button 
          class="action-btn data-btn w-100 p-6 bg-white rounded-xl shadow-sm border border-indigo-100 hover:border-indigo-300 transition-colors text-left"
          onclick={() => { selectedGameType = gt.id; selectedUnit = null; selectedStudent = null; }}
          style="display: block; width: 100%; border-left: 4px solid #4f46e5;"
        >
          <div class="text-xl font-bold text-indigo-800 mb-2">{gt.name}</div>
          <div class="text-sm text-gray-500">{gt.desc}</div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Detail View for Selected Game Type -->
    {@const stats = getGameTypeStats(selectedGameType)}
    {@const gtName = gameTypes.find(g => g.id === selectedGameType)?.name}
    {@const availableUnits = getAvailableUnits()}

    <div class="flex items-center gap-4 mb-4">
      <button 
        class="text-indigo-600 hover:underline font-bold"
        onclick={() => { selectedGameType = null; selectedUnit = null; selectedStudent = null; }}
      >
        ← 返回選項
      </button>
      <h2 class="text-2xl font-black text-gray-800 m-0">{gtName} 總平均數據</h2>
    </div>

    <!-- Aggregate Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">🎯 平均得分</p>
        <p class="text-3xl font-black text-indigo-700">{stats.avgScore}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">⏱️ 平均測驗時間</p>
        <p class="text-3xl font-black text-purple-600">{stats.avgDuration}s</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">✅ 總完成次數</p>
        <p class="text-3xl font-black text-green-600">{stats.completionCount}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">🏃 跳出次數</p>
        <p class="text-3xl font-black text-red-500">{stats.abandonCount}</p>
      </div>
    </div>

    <!-- Error Analysis -->
    <div class="bg-red-50 p-4 rounded-xl border border-red-100 mb-8 space-y-4">
      <h3 class="text-lg font-bold text-red-800">⚠️ 全站常錯分析</h3>
      
      <div>
        <p class="text-sm font-bold text-gray-700 mb-2">常錯文法點 (Top 5)</p>
        <div class="flex flex-wrap gap-2">
          {#each stats.topWrongGrammarPoints as [gp, count]}
            <span class="bg-white px-3 py-1 rounded-full text-red-600 border border-red-200 text-sm">
              {gp} ({count}次)
            </span>
          {:else}
            <span class="text-gray-500 text-sm">無數據</span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Unit Options -->
    <h3 class="text-xl font-bold text-gray-800 border-b pb-2 mb-4">單元紀錄查詢</h3>
    {#if availableUnits.length === 0}
      <p class="text-gray-500 text-sm mb-6">此遊戲類型尚無任何測驗紀錄</p>
    {:else}
      <div class="flex flex-wrap gap-2 mb-6">
        {#each availableUnits as unit}
          <button 
            class="px-4 py-2 rounded-full font-bold transition-colors {selectedUnit === unit ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}"
            onclick={() => { selectedUnit = selectedUnit === unit ? null : unit; selectedStudent = null; }}
          >
            {unit}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Students in Selected Unit -->
    {#if selectedUnit}
      {@const students = getStudentsForUnit(selectedGameType, selectedUnit)}
      <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h4 class="text-lg font-bold text-gray-800 mb-4">單元：{selectedUnit} - 學生名單</h4>
        
        {#if students.length === 0}
          <p class="text-gray-500 text-sm">此單元尚無學生紀錄</p>
        {:else}
          <div class="flex flex-wrap gap-2 mb-6">
            {#each students as s}
              <button 
                class="px-4 py-2 rounded-lg font-bold transition-colors {selectedStudent === s.name ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}"
                onclick={() => selectedStudent = selectedStudent === s.name ? null : s.name}
              >
                🧑‍🎓 {s.name} ({s.recordCount}次)
              </button>
            {/each}
          </div>

          <!-- Selected Student Details -->
          {#if selectedStudent}
            {@const records = getStudentRecord(selectedGameType, selectedUnit, selectedStudent)}
            {@const studentStats = getStudentStats(records)}
            {@const studentAbandonCount = getStudentAbandonCount(selectedGameType, selectedUnit, selectedStudent)}
            
            <div class="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
              <h5 class="font-bold text-xl text-indigo-800 mb-4">🧑‍🎓 {selectedStudent} 的 {gtName} 紀錄</h5>
              
              <!-- Student Average Stats -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-indigo-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500 font-bold">🎯 平均得分</p>
                  <p class="text-xl font-black text-indigo-700">{studentStats?.avgScore}</p>
                </div>
                <div class="bg-indigo-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500 font-bold">⏱️ 平均時間</p>
                  <p class="text-xl font-black text-indigo-700">{studentStats?.avgDuration}s</p>
                </div>
                <div class="bg-indigo-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500 font-bold">✅ 完成次數</p>
                  <p class="text-xl font-black text-indigo-700">{studentStats?.completionCount}</p>
                </div>
                <div class="bg-indigo-50 p-3 rounded-lg">
                  <p class="text-xs text-gray-500 font-bold">🏃 跳出次數</p>
                  <p class="text-xl font-black text-red-500">{studentAbandonCount}</p>
                </div>
              </div>

              <!-- Student Errors -->
              {#if studentStats && studentStats.topWrongGrammarPoints.length > 0}
                <div class="bg-red-50 p-4 rounded-lg mb-6 text-sm">
                  <p class="font-bold text-red-800 mb-2">常錯項目：</p>
                  <div class="flex flex-wrap gap-2">
                    {#each studentStats.topWrongGrammarPoints as [gp, c]} <span class="bg-white px-2 py-1 rounded text-red-600 border border-red-200">{gp} ({c}次)</span> {/each}
                  </div>
                </div>
              {/if}

              <!-- Every Question Correctness Details (Per Session) -->
              <h6 class="font-bold text-gray-700 mb-2">每次測驗詳情：</h6>
              <div class="space-y-4">
                {#each records as r, index}
                  <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <div class="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200">
                      <span class="font-bold text-gray-700">測驗 #{records.length - index} ({r.date})</span>
                      <span class="text-sm text-gray-600 font-bold">得分: <span class="text-indigo-600">{r.score}</span> | 耗時: {r.duration}s</span>
                    </div>
                    
                    {#if r.stats && r.stats.length > 0}
                      <div class="p-3 text-sm divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {#each r.stats as s, sIdx}
                          <div class="py-2 flex flex-col md:flex-row gap-2 md:items-center justify-between hover:bg-gray-50">
                            <div class="flex-1">
                              <span class="font-bold text-gray-700">Q{sIdx + 1} ({s.grammarPoint}):</span>
                              <span class="text-gray-600 ml-2">{s.targetSentence || s.text || '未知題目'}</span>
                            </div>
                            <div class="text-xs text-right whitespace-nowrap mt-1 md:mt-0">
                              {#if r.gameType === 'MultipleChoice'}
                                打擊: {s.clicks || 0} | 錯擊: <span class="{s.wrongClicks > 0 ? 'text-red-500' : ''}">{s.wrongClicks || 0}</span> |
                              {:else if r.gameType === 'Unscramble'}
                                裝上: {s.attaches || 0} / 拆下: {s.detaches || 0} | 錯誤送出: <span class="{s.wrongSubmits > 0 ? 'text-red-500' : ''}">{s.wrongSubmits || 0}</span> |
                              {:else if s.wrongSubmits}
                                錯誤送出: <span class="text-red-500">{s.wrongSubmits}</span> |
                              {/if}
                              耗時: <span class="text-indigo-600">{s.timeMs}ms</span> |
                              <span class="font-bold ml-1 {s.isCorrect ? 'text-green-600' : 'text-red-500'}">
                                {s.isCorrect ? '✅' : '❌'}
                              </span>
                            </div>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="p-3 text-sm text-gray-500 text-center">本次測驗無逐題詳細紀錄</div>
                    {/if}
                  </div>
                {/each}
              </div>

            </div>
          {/if}
        {/if}
      </div>
    {/if}

  {/if}
</div>
