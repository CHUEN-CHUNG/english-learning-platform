<script lang="ts">
  import { onMount } from 'svelte';
  import { type AllReadingData } from '$lib/stores/readingProgress.svelte';
  import { aggregateAcrossUsers } from '$lib/utils/teacher-aggregate';
  import { readingUnits } from '$lib/data/reading-units';

  let allData = $state<AllReadingData>({});
  let selectedGameType = $state<'Matching' | 'Reading' | 'Quiz' | null>(null);
  let selectedUnit = $state<string | null>(null);
  let selectedStudent = $state<string | null>(null);
  
  onMount(async () => {
    const agg = await aggregateAcrossUsers(['word_exam_all_data']);
    allData = agg['word_exam_all_data'] as AllReadingData;
  });

  const gameTypes = [
    { id: 'Matching', name: '📊 同反義詞連連看', desc: 'Synonyms Match Data' },
    { id: 'Reading', name: '📈 閱讀練習', desc: 'Reading Practice Data' },
    { id: 'Quiz', name: '📝 單字總測驗', desc: 'Vocabulary Quiz Data' }
  ] as const;

  // Compute aggregate stats for a specific game type
  function getGameTypeStats(gameType: string) {
    let totalScore = 0;
    let totalDuration = 0;
    let completionCount = 0;
    let abandonCount = 0;
    const wrongWords: Record<string, number> = {};
    const wrongPhrases: Record<string, number> = {};
    const wrongReadingQs: Record<string, number> = {};

    Object.entries(allData).forEach(([student, data]) => {
      if (student.toLowerCase() === 'test') return;

      // History
      const records = (data.history || []).filter(r => r.gameType === gameType);
      records.forEach(r => {
        completionCount++;
        totalScore += r.score || 0;
        totalDuration += r.duration || 0;

        if (r.reviewData) {
          r.reviewData.forEach((q: any) => {
            if (!q.s1Correct || !q.s2Correct) {
              const word = q.word || q.phrase || q.question || '未知';
              // Check if phrase (e.g. contains space) - naive approach
              if (word.includes(' ') && gameType === 'Quiz') {
                wrongPhrases[word] = (wrongPhrases[word] || 0) + 1;
              } else if (gameType === 'Quiz' || gameType === 'Matching') {
                wrongWords[word] = (wrongWords[word] || 0) + 1;
              } else if (gameType === 'Reading') {
                wrongReadingQs[word] = (wrongReadingQs[word] || 0) + 1;
              }
            }
          });
        }
      });

      // Abandons
      const abandons = (data.abandons || []).filter(r => r.gameType === gameType);
      abandonCount += abandons.length;
    });

    const avgScore = completionCount ? Math.round(totalScore / completionCount) : 0;
    const avgDuration = completionCount ? Math.round(totalDuration / completionCount) : 0;

    const topWrongWords = Object.entries(wrongWords).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topWrongPhrases = Object.entries(wrongPhrases).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topWrongReadingQs = Object.entries(wrongReadingQs).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      avgScore,
      avgDuration,
      completionCount,
      abandonCount,
      topWrongWords,
      topWrongPhrases,
      topWrongReadingQs
    };
  }

  // Get list of units
  const units = readingUnits;

  // Get students who played specific unit and game type
  function getStudentsForUnit(gameType: string, unitCode: string) {
    const students: { name: string; recordCount: number }[] = [];
    Object.entries(allData).forEach(([student, data]) => {
      if (student.toLowerCase() === 'test') return;
      const records = (data.history || []).filter(r => r.gameType === gameType && (r.unit === unitCode || r.unit === unitCode.replace('YLE-', '')));
      if (records.length > 0) {
        students.push({ name: student, recordCount: records.length });
      }
    });
    return students;
  }

  // Get student's records for a specific unit and game type
  function getStudentRecord(gameType: string, unitCode: string, studentName: string) {
    const data = allData[studentName];
    if (!data) return [];
    return (data.history || []).filter(r => r.gameType === gameType && (r.unit === unitCode || r.unit === unitCode.replace('YLE-', '')));
  }

  // Aggregate student stats for specific game type and unit
  function getStudentStats(records: any[]) {
    if (!records.length) return null;
    let totalScore = 0;
    let totalDuration = 0;
    const wrongWords: Record<string, number> = {};
    const wrongPhrases: Record<string, number> = {};
    const wrongReadingQs: Record<string, number> = {};

    records.forEach(r => {
      totalScore += r.score || 0;
      totalDuration += r.duration || 0;
      if (r.reviewData) {
        r.reviewData.forEach((q: any) => {
          if (!q.s1Correct || !q.s2Correct) {
            const word = q.word || q.phrase || q.question || '未知';
            if (word.includes(' ') && r.gameType === 'Quiz') {
              wrongPhrases[word] = (wrongPhrases[word] || 0) + 1;
            } else if (r.gameType === 'Quiz' || r.gameType === 'Matching') {
              wrongWords[word] = (wrongWords[word] || 0) + 1;
            } else if (r.gameType === 'Reading') {
              wrongReadingQs[word] = (wrongReadingQs[word] || 0) + 1;
            }
          }
        });
      }
    });

    const completionCount = records.length;
    // We don't have abandon count at the student+unit level easily unless we filter abandons array too
    // But we can extract abandons if needed. Let's do it:
    return {
      avgScore: Math.round(totalScore / completionCount),
      avgDuration: Math.round(totalDuration / completionCount),
      completionCount,
      topWrongWords: Object.entries(wrongWords).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topWrongPhrases: Object.entries(wrongPhrases).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topWrongReadingQs: Object.entries(wrongReadingQs).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };
  }

  function getStudentAbandonCount(gameType: string, unitCode: string, studentName: string) {
    const data = allData[studentName];
    if (!data) return 0;
    const abandons = (data.abandons || []).filter(r => r.gameType === gameType && (r.unit === unitCode || r.unit === unitCode.replace('YLE-', '')));
    return abandons.length;
  }

</script>

<div class="reading-data-hub space-y-6">
  
  {#if !selectedGameType}
    <!-- Main Selection: Game Types -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each gameTypes as gt}
        <button 
          class="action-btn data-btn w-100 p-6 bg-white rounded-xl shadow-sm border border-blue-100 hover:border-blue-300 transition-colors text-left"
          onclick={() => { selectedGameType = gt.id; selectedUnit = null; selectedStudent = null; }}
          style="display: block; width: 100%; border-left: 4px solid #1976d2;"
        >
          <div class="text-xl font-bold text-blue-800 mb-2">{gt.name}</div>
          <div class="text-sm text-gray-500">{gt.desc}</div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Detail View for Selected Game Type -->
    {@const stats = getGameTypeStats(selectedGameType)}
    {@const gtName = gameTypes.find(g => g.id === selectedGameType)?.name}

    <div class="flex items-center gap-4 mb-4">
      <button 
        class="text-blue-600 hover:underline font-bold"
        onclick={() => { selectedGameType = null; selectedUnit = null; selectedStudent = null; }}
      >
        ← 返回選項
      </button>
      <h2 class="text-2xl font-black text-gray-800 m-0">{gtName} 總平均數據</h2>
    </div>

    <!-- Aggregate Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">🎯 平均得分</p>
        <p class="text-3xl font-black text-blue-700">{stats.avgScore}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">⏱️ 平均測驗時間</p>
        <p class="text-3xl font-black text-purple-600">{stats.avgDuration}s</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">✅ 總完成次數</p>
        <p class="text-3xl font-black text-green-600">{stats.completionCount}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
        <p class="text-xs text-gray-500 font-bold mb-1">🏃 跳出次數</p>
        <p class="text-3xl font-black text-red-500">{stats.abandonCount}</p>
      </div>
    </div>

    <!-- Error Analysis -->
    <div class="bg-red-50 p-4 rounded-xl border border-red-100 mb-8 space-y-4">
      <h3 class="text-lg font-bold text-red-800">⚠️ 全站常錯分析</h3>
      
      {#if selectedGameType === 'Matching' || selectedGameType === 'Quiz'}
        <div>
          <p class="text-sm font-bold text-gray-700 mb-2">常錯單字 (Top 5)</p>
          <div class="flex flex-wrap gap-2">
            {#each stats.topWrongWords as [word, count]}
              <span class="bg-white px-3 py-1 rounded-full text-red-600 border border-red-200 text-sm">
                {word} ({count}次)
              </span>
            {:else}
              <span class="text-gray-500 text-sm">無數據</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if selectedGameType === 'Quiz'}
        <div>
          <p class="text-sm font-bold text-gray-700 mb-2">常錯片語 (Top 5)</p>
          <div class="flex flex-wrap gap-2">
            {#each stats.topWrongPhrases as [phrase, count]}
              <span class="bg-white px-3 py-1 rounded-full text-red-600 border border-red-200 text-sm">
                {phrase} ({count}次)
              </span>
            {:else}
              <span class="text-gray-500 text-sm">無數據</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if selectedGameType === 'Reading'}
        <div>
          <p class="text-sm font-bold text-gray-700 mb-2">常錯閱讀題 (Top 5)</p>
          <div class="flex flex-wrap gap-2">
            {#each stats.topWrongReadingQs as [q, count]}
              <span class="bg-white px-3 py-1 rounded-full text-red-600 border border-red-200 text-sm">
                {q} ({count}次)
              </span>
            {:else}
              <span class="text-gray-500 text-sm">無數據</span>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Unit Options -->
    <h3 class="text-xl font-bold text-gray-800 border-b pb-2 mb-4">單元紀錄查詢</h3>
    <div class="flex flex-wrap gap-2 mb-6">
      {#each units as unit}
        <button 
          class="px-4 py-2 rounded-full font-bold transition-colors {selectedUnit === unit.unitCode ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}"
          onclick={() => { selectedUnit = selectedUnit === unit.unitCode ? null : unit.unitCode; selectedStudent = null; }}
        >
          {unit.title}
        </button>
      {/each}
    </div>

    <!-- Students in Selected Unit -->
    {#if selectedUnit}
      {@const students = getStudentsForUnit(selectedGameType, selectedUnit)}
      <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <h4 class="text-lg font-bold text-gray-800 mb-4">單元：{units.find(u => u.unitCode === selectedUnit)?.title} - 學生名單</h4>
        
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
              {#if studentStats && (studentStats.topWrongWords.length || studentStats.topWrongPhrases.length || studentStats.topWrongReadingQs.length)}
                <div class="bg-red-50 p-4 rounded-lg mb-6 text-sm">
                  <p class="font-bold text-red-800 mb-2">常錯項目：</p>
                  <div class="flex flex-wrap gap-2">
                    {#each studentStats.topWrongWords as [w, c]} <span class="bg-white px-2 py-1 rounded text-red-600 border border-red-200">{w} ({c}次)</span> {/each}
                    {#each studentStats.topWrongPhrases as [p, c]} <span class="bg-white px-2 py-1 rounded text-red-600 border border-red-200">{p} ({c}次)</span> {/each}
                    {#each studentStats.topWrongReadingQs as [q, c]} <span class="bg-white px-2 py-1 rounded text-red-600 border border-red-200">{q} ({c}次)</span> {/each}
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
                      <span class="text-sm text-gray-600 font-bold">得分: <span class="text-blue-600">{r.score}</span> | 耗時: {r.duration}s</span>
                    </div>
                    
                    {#if r.reviewData && r.reviewData.length > 0}
                      <div class="p-3 text-sm divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {#each r.reviewData as q, qIdx}
                          <div class="py-2 flex flex-col md:flex-row gap-2 md:items-center justify-between hover:bg-gray-50">
                            <div><span class="font-bold text-gray-700">Q{qIdx + 1}: {q.word || q.phrase || q.question || '未知'}</span></div>
                            <div class="text-xs">
                              英翻中: <span class="{q.s1Correct ? 'text-green-600' : 'text-red-500 line-through'}">{q.s1UserAns || '(未作答)'}</span> {q.s1Correct ? '✅' : '❌'} |
                              中翻英: <span class="{q.s2Correct ? 'text-green-600' : 'text-red-500 line-through'}">{q.s2UserAns || '(未作答)'}</span> {q.s2Correct ? '✅' : '❌'}
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
