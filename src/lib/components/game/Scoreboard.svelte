<script lang="ts">
  import type { GameSessionData, QuestionStat } from '$lib/game-core/GrammarDataTracker';

  let {
    sessionData = null,
    userName = '',
    onRestart,
    onHome,
  }: {
    sessionData?: GameSessionData | null;
    userName?: string;
    onRestart: () => void;
    onHome: () => void;
  } = $props();

  type Screen = 'result' | 'review' | 'history';
  let screen = $state<Screen>('result');
  let overlayVisible = $state(false);
  let historyUserFilter = $state('all');
  let reviewSource = $state<'result' | 'history'>('result');

  // Data for history screen
  interface HistoryRecord extends GameSessionData {
    userName: string;
    originalIndex: number;
  }
  let historyRecords = $state<HistoryRecord[]>([]);
  let historyUsers = $state<string[]>([]);
  let reviewRecord = $state<GameSessionData | null>(null);

  function readAllData(): Record<string, { history: GameSessionData[]; abandons: GameSessionData[] }> {
    return JSON.parse(localStorage.getItem('grammar_platform_data') || '{}');
  }

  function openResult() {
    screen = 'result';
    overlayVisible = true;
  }

  function openHistory() {
    const allData = readAllData();
    historyUsers = Object.keys(allData);

    refreshHistory(allData, historyUserFilter);
    screen = 'history';
    overlayVisible = true;
  }

  function refreshHistory(
    allData: Record<string, { history: GameSessionData[]; abandons: GameSessionData[] }>,
    filter: string
  ) {
    const records: HistoryRecord[] = [];
    if (filter === 'all') {
      for (const [u, d] of Object.entries(allData)) {
        (d.history || []).forEach((r, i) => records.push({ ...r, userName: u, originalIndex: i }));
      }
      records.reverse();
    } else {
      const d = allData[filter];
      if (d?.history) {
        d.history.forEach((r, i) => records.push({ ...r, userName: filter, originalIndex: i }));
      }
    }
    historyRecords = records;
  }

  function handleFilterChange(e: Event) {
    historyUserFilter = (e.target as HTMLSelectElement).value;
    refreshHistory(readAllData(), historyUserFilter);
  }

  function showReviewFromHistory(targetUser: string, idx: number) {
    const allData = readAllData();
    const record = allData[targetUser]?.history?.[idx];
    if (!record) return;
    reviewRecord = record;
    reviewSource = 'history';
    screen = 'review';
  }

  function backFromReview() {
    screen = reviewSource === 'history' ? 'history' : 'result';
  }

  export function show(data: GameSessionData) {
    reviewRecord = data;
    openResult();
  }

  // Expose for parent to call
  $effect(() => {
    if (sessionData) openResult();
  });

  function formatTime(seconds: number) {
    return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
  }

  function pct(score: number, total: number) {
    return Math.round((score / total) * 100) || 0;
  }

  function scoreColor(p: number) {
    if (p >= 80) return '#10b981';
    if (p >= 60) return '#f59e0b';
    return '#ef4444';
  }

  function gameTypeName(t: string) {
    if (t === 'MultipleChoice') return '🕳️ 選擇題';
    if (t === 'Unscramble') return '🚂 重組題';
    return t || '未知';
  }
</script>

<!-- Floating Action Button -->
<button
  class="fab-score"
  onclick={openHistory}
  aria-label="History Score"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="fab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
  <span>History<br>Score</span>
</button>

{#if overlayVisible}
  <div class="gs-overlay">

    <!-- Result Screen -->
    {#if screen === 'result' && sessionData}
      <div class="gs-card gs-result">
        <h2 class="gs-title" style="color:#38bdf8;">🎉 Quiz Complete!</h2>
        <div class="gs-info-box">
          <p>Player: <strong>{userName}</strong></p>
          <p>Time: <strong>{formatTime(sessionData.duration)}</strong></p>
          <p class="gs-score-line">
            Score: <span style="color:#fbbf24; font-size:1.3em;">{sessionData.score} / {sessionData.totalQuestions} ({pct(sessionData.score, sessionData.totalQuestions)}%)</span>
          </p>
        </div>
        <div class="gs-actions">
          <button class="gs-btn gs-btn-amber" onclick={() => { reviewRecord = sessionData; reviewSource = 'result'; screen = 'review'; }}>Review Mistakes</button>
          <button class="gs-btn gs-btn-sky" onclick={() => { overlayVisible = false; onRestart(); }}>Play Again</button>
          <button class="gs-btn gs-btn-slate" onclick={onHome}>🏠 Back to Hub</button>
        </div>
      </div>
    {/if}

    <!-- Review Screen -->
    {#if screen === 'review' && reviewRecord}
      <div class="gs-card gs-review">
        <h2 class="gs-title" style="color:#fbbf24;">Mistake Review</h2>
        <div class="gs-review-content">
          {#each reviewRecord.stats as stat, i}
            <div class="gs-stat-row" class:correct={stat.isCorrect} class:wrong={!stat.isCorrect}>
              <div class="gs-stat-header">
                <span><strong>Q{i+1}.</strong> <span class="gs-gp-tag">{stat.grammarPoint.replace(/_/g, ' ')}</span></span>
                <span class="gs-time">⏱️ {stat.timeMs ? (stat.timeMs / 1000).toFixed(1) + 's' : '--'}</span>
              </div>
              {#if reviewRecord.gameType === 'MultipleChoice'}
                <p><strong>Question:</strong> {stat.text || 'No record'}</p>
                <p class:text-correct={stat.isCorrect} class:text-wrong={!stat.isCorrect}>
                  {stat.isCorrect ? '✅ Correct!' : `❌ Wrong (${stat.wrongClicks || 0} miss${stat.wrongClicks === 1 ? '' : 'es'})`}
                </p>
              {:else if reviewRecord.gameType === 'Unscramble'}
                <p><strong>Answer:</strong> {stat.targetSentence || 'No record'}</p>
                <p class:text-correct={stat.isCorrect} class:text-wrong={!stat.isCorrect}>
                  {stat.isCorrect ? '✅ Built correctly!' : `❌ Wrong order (${stat.wrongSubmits || 0} wrong submit${stat.wrongSubmits === 1 ? '' : 's'})`}
                </p>
              {:else}
                <p><strong>Content:</strong> {stat.targetSentence || stat.text || 'No record'}</p>
                <p class:text-correct={stat.isCorrect} class:text-wrong={!stat.isCorrect}>
                  {stat.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </p>
              {/if}
            </div>
          {/each}
        </div>
        <div class="gs-actions">
          <button class="gs-btn gs-btn-slate" onclick={backFromReview}>Back</button>
        </div>
      </div>
    {/if}

    <!-- History Screen -->
    {#if screen === 'history'}
      <div class="gs-card gs-history">
        <h2 class="gs-title" style="color:#38bdf8;">Score History</h2>
        <div class="gs-filter-row">
          <select class="gs-filter-select" value={historyUserFilter} onchange={handleFilterChange}>
            <option value="all">All players</option>
            {#each historyUsers as u}
              <option value={u}>{u}</option>
            {/each}
          </select>
        </div>
        <div class="gs-history-content">
          {#if historyRecords.length === 0}
            <p class="gs-empty">No quiz records yet!</p>
          {:else}
            {#each historyRecords as record}
              {@const p = pct(record.score, record.totalQuestions)}
              <div class="gs-history-row">
                <div class="gs-history-row-header">
                  <div>
                    <strong style="color:#7dd3fc">{record.userName}</strong>
                    <span class="gs-type-tag">{gameTypeName(record.gameType)}</span>
                  </div>
                  <span class="gs-date">{record.date}</span>
                </div>
                <div class="gs-history-row-body">
                  <div><span class="gs-label">Unit:</span> {record.unit.replace(/-/g, ' ')}</div>
                  <div><span class="gs-label">Time:</span> {formatTime(record.duration)}</div>
                  <div class="gs-score-display">
                    <span>Score</span>
                    <span style="color:{scoreColor(p)}; font-size:1.1em; font-weight:bold;">
                      {record.score} / {record.totalQuestions} ({p}%)
                    </span>
                  </div>
                </div>
                {#if record.stats && record.stats.length > 0}
                  <div class="gs-history-review-btn">
                    <button
                      class="gs-btn gs-btn-amber"
                      style="font-size:0.85em; padding:6px 12px;"
                      onclick={() => showReviewFromHistory(record.userName, record.originalIndex)}
                    >Review mistakes</button>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
        <div class="gs-actions">
          <button class="gs-btn gs-btn-slate" onclick={() => { overlayVisible = false; }}>Close</button>
        </div>
      </div>
    {/if}

  </div>
{/if}

<style>
  .fab-score {
    position: fixed; bottom: 32px; right: 32px;
    width: 96px; height: 96px;
    background: #0ea5e9; color: white;
    border: 1px solid rgba(125,211,252,0.3);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(14,165,233,0.5);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    cursor: pointer; z-index: 50; font-weight: bold; font-size: 0.85em; text-align: center;
    transition: transform 0.2s, background 0.2s; gap: 2px;
    font-family: inherit;
  }
  .fab-score:hover { background: #38bdf8; transform: scale(1.1); }
  .fab-icon { width: 32px; height: 32px; }

  .gs-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.9);
    backdrop-filter: blur(8px); z-index: 40;
    overflow-y: auto; display: flex; flex-direction: column;
    align-items: center; padding: 40px 16px;
  }
  .gs-card {
    width: 100%; max-width: 720px; border-radius: 16px;
    padding: 32px; margin-top: 40px;
    background: rgba(30,41,59,0.9);
    border: 1px solid rgba(14,165,233,0.3);
    box-shadow: 0 0 30px rgba(14,165,233,0.2);
    color: #e2e8f0;
  }
  .gs-review { max-width: 860px; border-color: rgba(245,158,11,0.3); box-shadow: 0 0 30px rgba(245,158,11,0.2); }
  .gs-history { max-width: 900px; }
  .gs-title { font-size: 1.8em; font-weight: bold; margin: 0 0 24px 0; text-align: center; }
  .gs-info-box {
    background: rgba(15,23,42,0.8); border: 1px solid #334155;
    border-radius: 12px; padding: 24px; margin-bottom: 24px;
  }
  .gs-info-box p { margin: 0 0 12px 0; font-size: 1.1em; color: #bae6fd; }
  .gs-info-box p:last-child { margin: 0; }
  .gs-score-line { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
  .gs-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 24px; }
  .gs-btn { padding: 10px 24px; font-weight: bold; border-radius: 12px; border: none; cursor: pointer; font-size: 1em; transition: all 0.2s; font-family: inherit; }
  .gs-btn-amber { background: #d97706; color: white; box-shadow: 0 0 15px rgba(245,158,11,0.4); }
  .gs-btn-amber:hover { background: #f59e0b; }
  .gs-btn-sky { background: #0284c7; color: white; box-shadow: 0 0 15px rgba(14,165,233,0.4); }
  .gs-btn-sky:hover { background: #0ea5e9; }
  .gs-btn-slate { background: #334155; color: #bae6fd; border: 1px solid rgba(14,165,233,0.3); }
  .gs-btn-slate:hover { background: #475569; }

  /* Review */
  .gs-review-content { max-height: 55vh; overflow-y: auto; margin-bottom: 16px; }
  .gs-stat-row { padding: 16px; border-radius: 12px; border: 2px solid; margin-bottom: 12px; position: relative; }
  .gs-stat-row.correct { background: rgba(6,78,59,0.3); border-color: rgba(16,185,129,0.5); }
  .gs-stat-row.wrong { background: rgba(127,29,29,0.3); border-color: rgba(248,113,113,0.5); }
  .gs-stat-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .gs-gp-tag { background: #1e293b; border: 1px solid #334155; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; color: #94a3b8; }
  .gs-time { font-size: 0.8em; color: #94a3b8; }
  .text-correct { color: #34d399; font-weight: bold; }
  .text-wrong { color: #f87171; font-weight: bold; }

  /* History */
  .gs-filter-row { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .gs-filter-select { padding: 8px 16px; border: 1px solid rgba(14,165,233,0.5); border-radius: 8px; background: #0f172a; color: #bae6fd; font-weight: bold; font-size: 0.95em; }
  .gs-history-content { max-height: 55vh; overflow-y: auto; margin-bottom: 16px; }
  .gs-empty { text-align: center; color: rgba(148,163,184,0.5); font-size: 1.1em; padding: 40px 0; }
  .gs-history-row { background: rgba(30,41,59,0.8); border: 1px solid rgba(14,165,233,0.3); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .gs-history-row:hover { box-shadow: 0 0 15px rgba(14,165,233,0.3); }
  .gs-history-row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #334155; gap: 8px; flex-wrap: wrap; }
  .gs-type-tag { background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.3); color: #bae6fd; font-size: 0.75em; padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-left: 8px; }
  .gs-date { font-size: 0.8em; color: rgba(148,163,184,0.5); }
  .gs-history-row-body { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em; color: #bae6fd; }
  .gs-score-display { grid-column: span 2; display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.8); padding: 8px 16px; border-radius: 8px; border: 1px solid #334155; }
  .gs-label { font-weight: bold; color: rgba(148,163,184,0.7); }
  .gs-history-review-btn { margin-top: 12px; text-align: right; }
</style>
