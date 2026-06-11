<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';
  import { gameProgress } from '$lib/stores/gameProgress.svelte';

  let crystals = $state(0);
  let shellOpen = $state(false);
  let frameSrc = $state('about:blank');

  const flags = $derived(gameProgress.flags);
  const l1Done = $derived(flags['time_cop_level1_complete']);
  const l2Done = $derived(flags['time_cop_level2_complete']);
  const l3Done = $derived(flags['time_cop_level3_complete']);

  const RANKS = [
    { min: 0, label: 'Rookie 🔰' },
    { min: 10, label: 'Detective 🕵️' },
    { min: 25, label: 'Inspector 🏅' },
    { min: 50, label: 'Master Time Lord 👑' },
  ];
  const rank = $derived([...RANKS].reverse().find((r) => crystals >= r.min) ?? RANKS[0]);

  const TC_BGM: Record<string, string> = {
    mission1: `${base}/audio/time-cop/game1.mp3`,
    mission2: `${base}/audio/time-cop/game2.mp3`,
    mission3: `${base}/audio/time-cop/game3.mp3`,
    victory: `${base}/audio/time-cop/final.mp3`,
  };
  let bgm: HTMLAudioElement | null = null;
  let bgmUrl = '';

  function setBgm(track: string) {
    const url = TC_BGM[track];
    if (!url || url === bgmUrl) return;
    if (bgm) { bgm.pause(); bgm = null; }
    bgm = new Audio(url);
    bgm.loop = true;
    bgm.volume = 0.2;
    bgm.play().catch(() => {});
    bgmUrl = url;
  }

  function stopBgm() {
    if (bgm) { bgm.pause(); bgm.currentTime = 0; bgm = null; }
    bgmUrl = '';
  }

  function loadProgress() {
    crystals = parseInt(localStorage.getItem('time_cop_crystals') || '0');
  }

  function openGame() {
    frameSrc = `${base}/games/time-cop/game`;
    shellOpen = true;
    document.body.style.overflow = 'hidden';
    setBgm('mission1');
  }

  function closeGame() {
    stopBgm();
    frameSrc = 'about:blank';
    shellOpen = false;
    document.body.style.overflow = '';
    loadProgress();
  }

  function onMessage(e: MessageEvent) {
    if (e.data === 'grammar:time-cop-close') { closeGame(); return; }
    if (e.data?.type === 'timecop-bgm') { setBgm(e.data.track); return; }
    if (e.data?.type === 'timecop-bgm-stop') { stopBgm(); return; }
  }

  onMount(() => {
    gameProgress.init();
    loadProgress();
    window.addEventListener('message', onMessage);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', onMessage);
      stopBgm();
      document.body.style.overflow = '';
    }
  });
</script>

<svelte:head>
  <title>🚔 Time Cop NYC</title>
</svelte:head>

<div class="tc-picker bg-slate-100 min-h-screen">
  <header class="bg-slate-900 text-white p-4 shadow-lg">
    <div class="max-w-2xl mx-auto flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">🚔 Time Cop NYC</h1>
        <p class="text-slate-300 text-sm">時空戰警：紐約時空救援任務</p>
      </div>
      <a href="{base}/grammar-hub?tab=wh" class="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition">🏠 Back</a>
    </div>
  </header>

  <main class="max-w-2xl mx-auto p-4 pt-6">
    <div class="city-bar"></div>

    <div class="bg-white rounded-2xl p-6 shadow mb-6 border-l-4 border-slate-700">
      <p class="text-lg font-bold text-slate-800 mb-2">🦹 Dr. Chronos has stolen NYC's Time Fragments!</p>
      <p class="text-slate-600 text-sm leading-relaxed">
        The departure board at Grand Central is blank. Holidays have vanished from the calendar.
        Fake prepositions are exploding all over the city.<br>
        <strong>Time Cop</strong> — only YOU can fix this. Use the right time prepositions to restore New York!
      </p>
      <p class="text-slate-500 text-xs mt-3">文法焦點：When / What time ＆ in / on / at（含零介係詞陷阱）</p>
    </div>

    <div class="bg-indigo-900 text-white rounded-2xl p-4 mb-6 flex items-center justify-between shadow">
      <div>
        <p class="text-xs text-indigo-300 font-semibold uppercase tracking-wide">Time Crystals</p>
        <p class="text-3xl font-black"><span class="crystal">🔮</span> {crystals}</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-indigo-300 font-semibold uppercase tracking-wide">Rank</p>
        <p class="text-lg font-bold">{rank.label}</p>
      </div>
    </div>

    <div class="space-y-4">
      <button type="button" class="level-card l1" class:done={l1Done} onclick={openGame}>
        {#if l1Done}<span class="badge-done">✓ Complete</span>{/if}
        <div class="flex items-start gap-4">
          <span class="text-4xl">🚉</span>
          <div class="flex-1">
            <p class="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Level 1</p>
            <h2 class="text-xl font-bold text-slate-800">Grand Central Chaos</h2>
            <p class="text-slate-500 text-sm mt-1">中央車站大亂！選對疑問詞與 at + 精確時刻</p>
            <div class="flex gap-3 mt-3 text-xs flex-wrap">
              <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">When vs. What time</span>
              <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">at + time</span>
              <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">🎯 MC · 12 題</span>
            </div>
          </div>
        </div>
      </button>

      <button type="button" class="level-card l2" class:done={l2Done} onclick={openGame}>
        {#if l2Done}<span class="badge-done">✓ Complete</span>{/if}
        <div class="flex items-start gap-4">
          <span class="text-4xl">🗽</span>
          <div class="flex-1">
            <p class="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">Level 2</p>
            <h2 class="text-xl font-bold text-slate-800">The Lost Holidays</h2>
            <p class="text-slate-500 text-sm mt-1">節日消失了！用 on/in 找回特定日子與長時段</p>
            <div class="flex gap-3 mt-3 text-xs flex-wrap">
              <span class="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">on + days/dates</span>
              <span class="bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">in + months/seasons</span>
              <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">✏️ Fill-in · 排句 · 24 題</span>
            </div>
          </div>
        </div>
      </button>

      <button type="button" class="level-card l3" class:done={l3Done} onclick={openGame}>
        {#if l3Done}<span class="badge-done">✓ Complete</span>{/if}
        <div class="flex items-start gap-4">
          <span class="text-4xl">💣</span>
          <div class="flex-1">
            <p class="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Level 3 — Final Boss</p>
            <h2 class="text-xl font-bold text-slate-800">Zero-Preposition Trap</h2>
            <p class="text-slate-500 text-sm mt-1">怪盜丟出假介係詞炸彈！倒數內拆除它們</p>
            <div class="flex gap-3 mt-3 text-xs flex-wrap">
              <span class="bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">this/next/last/every → no prep!</span>
              <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">💣 Bomb Defuse · 12 題</span>
            </div>
          </div>
        </div>
      </button>
    </div>

    <div class="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
      <p class="font-bold mb-1">📌 Quick Rule Recap</p>
      <ul class="space-y-1 text-xs">
        <li><strong>at</strong> + exact time → at 7:00 · at noon · at midnight</li>
        <li><strong>on</strong> + specific day/date → on Monday · on July 4th · on my birthday</li>
        <li><strong>in</strong> + longer period → in 2025 · in summer · in the morning</li>
        <li><strong>❌ Zero prep</strong> → tomorrow / last year / next Monday / every night (NO in/on/at!)</li>
      </ul>
    </div>
  </main>

  {#if shellOpen}
    <div class="tc-game-shell">
      <iframe title="Time Cop NYC" allow="autoplay" src={frameSrc}></iframe>
    </div>
  {/if}
</div>

<style lang="scss">
  .level-card {
    background: white;
    border-radius: 1rem;
    border: 3px solid #e2e8f0;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: block;
    position: relative;
    width: 100%;
    text-align: left;
  }
  .level-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
  .level-card.l1 { border-color: #1565c0; }
  .level-card.l2 { border-color: #e65100; }
  .level-card.l3 { border-color: #b71c1c; }
  .level-card.done { border-color: #2e7d32; background: #f1f8e9; }
  .badge-done {
    position: absolute; top: 1rem; right: 1rem;
    background: #2e7d32; color: white;
    font-size: 0.7rem; font-weight: 700;
    padding: 3px 10px; border-radius: 20px;
  }
  .crystal { display: inline-block; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
  .city-bar { height: 6px; background: linear-gradient(90deg, #1565c0, #e65100, #b71c1c); border-radius: 3px; margin-bottom: 2rem; }

  .tc-game-shell {
    position: fixed; inset: 0; z-index: 9999; background: #060c1a;
  }
  .tc-game-shell iframe { width: 100%; height: 100%; border: none; }
</style>
