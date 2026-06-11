<script lang="ts">
  let { triggerCount = $bindable(0) }: { triggerCount?: number } = $props();

  const PASSWORD = 'admin';
  let visible = $state(false);

  // Dashboard data
  interface StudentRecord {
    userName: string;
    originalIndex: number;
    gameType: string;
    date: string;
    unit: string;
    score: number;
    duration: number;
    totalQuestions: number;
    stats?: Array<{
      grammarPoint: string;
      isCorrect: boolean;
      timeMs: number;
      text?: string;
      targetSentence?: string;
      clicks?: number;
      wrongClicks?: number;
      wrongSubmits?: number;
      attaches?: number;
      detaches?: number;
    }>;
  }

  interface AllData {
    [user: string]: { history: StudentRecord[]; abandons: StudentRecord[] };
  }

  interface DashboardStats {
    totalStarts: number;
    totalCompletions: number;
    totalAbandons: number;
    avgTime: number;
    topErrors: Array<{ point: string; count: number }>;
    students: Array<{
      name: string;
      history: StudentRecord[];
      abandons: StudentRecord[];
      topFails: Array<{ point: string; count: number; questions: string[] }>;
    }>;
  }

  let stats = $state<DashboardStats | null>(null);

  $effect(() => {
    if (triggerCount > 0 && triggerCount % 5 === 0) {
      const pwd = prompt('請輸入教師密碼 (預設: admin)：');
      if (pwd === PASSWORD) {
        stats = computeStats();
        visible = true;
      } else if (pwd !== null) {
        alert('密碼錯誤！');
      }
    }
  });

  function computeStats(): DashboardStats {
    const allData: AllData = JSON.parse(localStorage.getItem('grammar_platform_data') || '{}');

    // Migrate legacy data
    const legacyChoice: AllData = JSON.parse(localStorage.getItem('grammar_choice_data') || '{}');
    const legacyUnscramble: AllData = JSON.parse(localStorage.getItem('grammar_unscramble_data') || '{}');

    for (const [u, d] of Object.entries(legacyChoice)) {
      if (!allData[u]) {
        allData[u] = {
          history: (d.history || []).map((r: any) => ({ ...r, gameType: 'MultipleChoice' })),
          abandons: (d.abandons || []).map((r: any) => ({ ...r, gameType: 'MultipleChoice' })),
        };
      }
    }
    for (const [u, d] of Object.entries(legacyUnscramble)) {
      if (!allData[u]) {
        allData[u] = {
          history: (d.history || []).map((r: any) => ({ ...r, gameType: 'Unscramble' })),
          abandons: (d.abandons || []).map((r: any) => ({ ...r, gameType: 'Unscramble' })),
        };
      } else {
        allData[u].history.push(...(d.history || []).map((r: any) => ({ ...r, gameType: 'Unscramble' })));
        allData[u].abandons.push(...(d.abandons || []).map((r: any) => ({ ...r, gameType: 'Unscramble' })));
      }
    }

    let totalStarts = 0, totalCompletions = 0, totalAbandons = 0, totalDurations = 0;
    const globalFails: Record<string, number> = {};
    const students = [];

    for (const [userName, data] of Object.entries(allData)) {
      const isTest = userName.trim().toLowerCase() === 'test';
      const history = data.history || [];
      const abandons = data.abandons || [];

      if (!isTest) {
        totalStarts += history.length + abandons.length;
        totalCompletions += history.length;
        totalAbandons += abandons.length;
        totalDurations += history.reduce((s, r) => s + (r.duration || 0), 0);
      }

      const studentFails: Record<string, number> = {};
      const studentQuestions: Record<string, string[]> = {};

      for (const record of history) {
        for (const stat of record.stats || []) {
          if (!stat.isCorrect) {
            if (!isTest) globalFails[stat.grammarPoint] = (globalFails[stat.grammarPoint] || 0) + 1;
            studentFails[stat.grammarPoint] = (studentFails[stat.grammarPoint] || 0) + 1;
            const q = stat.targetSentence || stat.text || '未知題目';
            if (!studentQuestions[stat.grammarPoint]) studentQuestions[stat.grammarPoint] = [];
            if (!studentQuestions[stat.grammarPoint].includes(q)) studentQuestions[stat.grammarPoint].push(q);
          }
        }
      }

      students.push({
        name: userName,
        history,
        abandons,
        topFails: Object.entries(studentFails)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([point, count]) => ({ point, count, questions: studentQuestions[point] || [] })),
      });
    }

    return {
      totalStarts,
      totalCompletions,
      totalAbandons,
      avgTime: totalCompletions > 0 ? Math.floor(totalDurations / totalCompletions) : 0,
      topErrors: Object.entries(globalFails)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([point, count]) => ({ point, count })),
      students,
    };
  }

  function gameTypeName(t: string) {
    if (t === 'MultipleChoice') return '🕳️ 選擇題';
    if (t === 'Unscramble') return '🚂 重組題';
    return t || '未知遊戲';
  }
</script>

{#if visible && stats}
  <div class="td-overlay" role="dialog" aria-modal="true" aria-label="教師數據面板">
    <div class="td-panel">
      <!-- Header -->
      <div class="td-header">
        <h2>👨‍🏫 文法遊戲全站學習數據庫</h2>
        <button class="td-close" onclick={() => (visible = false)} aria-label="關閉">✕</button>
      </div>

      <!-- Summary -->
      <div class="td-summary">
        <div class="td-stat-box"><p class="td-stat-label">🎮 總遊玩人次</p><p class="td-stat-val">{stats.totalStarts}</p></div>
        <div class="td-stat-box"><p class="td-stat-label">✅ 總完賽人次</p><p class="td-stat-val" style="color:#16a34a">{stats.totalCompletions}</p></div>
        <div class="td-stat-box"><p class="td-stat-label">🏃 中途跳出</p><p class="td-stat-val" style="color:#dc2626">{stats.totalAbandons}</p></div>
        <div class="td-stat-box"><p class="td-stat-label">⏱️ 平均完賽時間</p><p class="td-stat-val" style="color:#9333ea">{stats.avgTime}s</p></div>
        <div class="td-stat-box td-stat-wide">
          <p class="td-stat-label">🔥 全站最常錯的文法點 (Top 5)</p>
          <div class="td-top-errors">
            {#each stats.topErrors as e}
              <span class="td-error-tag">{e.point} ({e.count}次)</span>
            {:else}
              <span style="color:#666">尚無數據</span>
            {/each}
          </div>
        </div>
      </div>

      <!-- Student Data -->
      <div class="td-content">
        {#if stats.students.length === 0}
          <p class="td-empty">目前尚無任何遊玩紀錄。去玩一場遊戲吧！</p>
        {:else}
          {#each stats.students as s}
            <div class="td-student">
              <div class="td-student-header">
                <h4>🧑‍🎓 學生：{s.name}</h4>
                <p>完成: {s.history.length}次 | 跳出: {s.abandons.length}次</p>
              </div>

              {#each s.history as record, idx}
                <div class="td-record">
                  <div class="td-record-header">
                    <span>{gameTypeName(record.gameType)} <small>({record.date}) — 單元: {record.unit}</small></span>
                    <span>答對: {record.score} | 耗時: {record.duration}s</span>
                  </div>
                  <details>
                    <summary>查看每題詳細數據（點擊展開）</summary>
                    <div class="td-stats">
                      {#each record.stats || [] as stat, qi}
                        <div class="td-stat-row" class:correct={stat.isCorrect} class:wrong={!stat.isCorrect}>
                          <strong>Q{qi + 1} ({stat.grammarPoint}):</strong>
                          耗時 {stat.timeMs}ms |
                          {#if record.gameType === 'MultipleChoice'}
                            打擊 {stat.clicks || 0} 次 | 錯擊 {stat.wrongClicks || 0} 次 |
                          {:else if record.gameType === 'Unscramble'}
                            裝上 {stat.attaches || 0} 次 / 拆下 {stat.detaches || 0} 次 | 錯誤送出 {stat.wrongSubmits || 0} 次 |
                          {/if}
                          最終: {stat.isCorrect ? '✅ 成功' : '❌ 失敗'}
                        </div>
                      {/each}
                    </div>
                  </details>
                </div>
              {/each}

              {#if s.topFails.length > 0}
                <div class="td-top-fails">
                  <p class="td-top-fails-title">⚠️ 此學生最常錯的題型 (Top 5):</p>
                  {#each s.topFails as f}
                    <details class="td-fail-detail">
                      <summary>{f.point} ({f.count}次)</summary>
                      <ul>
                        {#each f.questions as q}<li>{q}</li>{/each}
                      </ul>
                    </details>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .td-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .td-panel {
    background: white; border-radius: 16px; width: 100%; max-width: 1000px;
    max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  .td-header {
    background: #4338ca; color: white; padding: 16px 24px; border-radius: 16px 16px 0 0;
    display: flex; justify-content: space-between; align-items: center;
  }
  .td-header h2 { margin: 0; font-size: 1.3em; }
  .td-close {
    background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px;
    border-radius: 50%; cursor: pointer; font-size: 1em; font-weight: bold;
  }
  .td-close:hover { background: rgba(255,255,255,0.35); }
  .td-summary {
    padding: 16px 24px; background: #eef2ff; border-bottom: 1px solid #c7d2fe;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; flex-shrink: 0;
  }
  .td-stat-box { background: white; padding: 12px 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .td-stat-wide { grid-column: span 4; }
  .td-stat-label { font-size: 0.8em; color: #555; font-weight: bold; margin: 0 0 4px 0; }
  .td-stat-val { font-size: 1.8em; font-weight: 900; color: #312e81; margin: 0; }
  .td-top-errors { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .td-error-tag { background: #fee2e2; color: #b91c1c; padding: 4px 12px; border-radius: 999px; font-weight: bold; font-size: 0.85em; }
  .td-content { flex: 1; overflow-y: auto; padding: 24px; background: #f9fafb; }
  .td-empty { text-align: center; color: #9ca3af; font-size: 1.2em; padding: 40px; }
  .td-student { border: 2px solid #e0e7ff; border-radius: 12px; background: white; padding: 16px; margin-bottom: 24px; }
  .td-student-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .td-student-header h4 { margin: 0; color: #3730a3; font-size: 1.1em; }
  .td-student-header p { margin: 0; color: #6366f1; font-size: 0.85em; }
  .td-record { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 8px; font-size: 0.9em; }
  .td-record-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; font-weight: bold; }
  details summary { cursor: pointer; color: #4338ca; font-weight: bold; padding: 4px 0; }
  .td-stats { max-height: 200px; overflow-y: auto; margin-top: 8px; }
  .td-stat-row { padding: 4px 8px; margin-bottom: 4px; border-radius: 4px; font-size: 0.85em; }
  .td-stat-row.correct { background: #f0fdf4; }
  .td-stat-row.wrong { background: #fef2f2; }
  .td-top-fails { margin-top: 12px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; }
  .td-top-fails-title { font-size: 0.85em; font-weight: bold; color: #991b1b; margin: 0 0 8px 0; }
  .td-fail-detail { background: white; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 4px; padding: 4px 12px; }
  .td-fail-detail summary { font-weight: bold; color: #b91c1c; }
  .td-fail-detail ul { margin: 4px 0; padding-left: 20px; font-size: 0.85em; }
  @media (max-width: 600px) {
    .td-summary { grid-template-columns: repeat(2, 1fr); }
    .td-stat-wide { grid-column: span 2; }
  }
</style>
