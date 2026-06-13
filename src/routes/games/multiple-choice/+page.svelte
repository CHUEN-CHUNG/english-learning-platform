<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { GrammarDataTracker } from '$lib/game-core/GrammarDataTracker';
  import type { GameSessionData } from '$lib/game-core/GrammarDataTracker';
  import { parseCSVRows } from '$lib/utils/csv-parser';
  import { playEnterGameSfx } from '$lib/utils/audio';
  import { user } from '$lib/stores/user.svelte';
  import Scoreboard from '$lib/components/game/Scoreboard.svelte';
  import TeacherDashboard from '$lib/components/game/TeacherDashboard.svelte';

  interface Question {
    grammarPoint: string;
    questionText: string;
    options: { key: string; text: string }[];
    correctAnswer: string;
    explanation: string;
  }

  interface Hole {
    optionKey: string;
    optionText: string;
    face: string;
    up: boolean;
    result: '' | 'correct' | 'wrong';
    whack: boolean;
    active: boolean;
    disabled: boolean;
  }

  const THEME_PRESETS: Record<
    string,
    { title: string; emoji: string; bodyClass: string; accent: string }
  > = {
    'Present-Simple-Choice': { title: '打地鼠 · Present Simple', emoji: '🎯', bodyClass: 'bg-amber-50', accent: 'border-amber-500' },
    'Present-Continuous-Choice': { title: '打地鼠 · Present Continuous', emoji: '🎯', bodyClass: 'bg-amber-50', accent: 'border-amber-500' },
    'Past-Simple-Choice': { title: '打地鼠 · Past Simple', emoji: '🎯', bodyClass: 'bg-amber-50', accent: 'border-amber-500' },
    'Future-Simple-Choice': { title: '打地鼠 · Future Simple', emoji: '🎯', bodyClass: 'bg-amber-50', accent: 'border-amber-500' },
    'WHQA-Traveler-Level1-MC': { title: 'Super Traveler · Level 1', emoji: '✈️', bodyClass: 'bg-sky-50', accent: 'border-sky-500' },
    'WHQA-Traveler-Level3-MC': { title: 'Super Traveler · Level 3', emoji: '🛍️', bodyClass: 'bg-rose-50', accent: 'border-rose-500' },
    'WHQA-How-Units9-10-MC': { title: '打地鼠 · Transport & Status', emoji: '✈️', bodyClass: 'bg-sky-50', accent: 'border-sky-500' },
    'WHQA-How-Units11-12-MC': { title: '打地鼠 · How Often & How Long', emoji: '🎒', bodyClass: 'bg-amber-50', accent: 'border-amber-500' },
    'WHQA-How-Unit14-Quantity-MC': { title: '打地鼠 · Souvenir Shop', emoji: '🛍️', bodyClass: 'bg-rose-50', accent: 'border-rose-500' },
  };

  // unit -> path relative to static/content/grammar/
  const CSV_BANK: Record<string, string> = {
    'Present-Simple-Choice': 'time-tense/Present-Simple/Present-Simple-Choice.csv',
    'Present-Continuous-Choice': 'time-tense/Present-Continuous/Present-Continuous-Choice.csv',
    'Past-Simple-Choice': 'time-tense/Past-Simple/Past-Simple-Choice.csv',
    'Future-Simple-Choice': 'time-tense/Future-Simple/Future-Simple-Choice.csv',
    'WHQA-How-Units9-10-MC': 'Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Units9-10-MC.csv',
    'WHQA-How-Units11-12-MC': 'Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Units11-12-MC.csv',
    'WHQA-How-Unit14-Quantity-MC': 'Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Unit14-Quantity-MC.csv',
    'WHQA-Traveler-Level1-MC': 'Grammar-Basic/WHQA+Dummy Subject/WHQA-Traveler-Level1-MC.csv',
    'WHQA-Traveler-Level3-MC': 'Grammar-Basic/WHQA+Dummy Subject/WHQA-Traveler-Level3-MC.csv',
  };

  function findCsvUrlForUnit(unit: string): string | null {
    const rel = CSV_BANK[unit];
    if (!rel) return null;
    return `${base}/content/grammar/${encodeURI(rel)}`;
  }

  const HOLE_COUNT = 6;
  const MAX_ACTIVE_MOLES = 3;
  const MOLE_VISIBLE_MS = 2600;
  const SPAWN_TICK_MS = 750;

  const QUEST_PASS_CORRECT = 3;
  const PRACTICE_DURATION_SEC = 900;
  const QUEST_DURATION_SEC = 600;
  const MAX_MISTAKES_PER_Q = 3;

  const MOLE_FACE_DEFAULT = '🐹';
  const MOLE_FACE_CORRECT = '🤩';
  const MOLE_FACE_WRONG = '😵';

  const tracker = new GrammarDataTracker('MultipleChoice');

  // URL params
  let unitParam = $derived($page.url.searchParams.get('unit'));
  let returnToParam = $derived($page.url.searchParams.get('returnTo'));
  let questLevelParam = $derived($page.url.searchParams.get('questLevel'));
  let returnUrl = $derived(
    returnToParam
      ? returnToParam
      : questLevelParam
        ? `${base}/grammar-hub?tab=wh`
        : `${base}/grammar-hub`
  );

  function isQuestMode(): boolean {
    return !!questLevelParam;
  }

  // Reactive game state
  let questions = $state<Question[]>([]);
  let currentQuestionIndex = $state(0);
  let correctCount = $state(0);
  let lives = $state(5);
  let timeLeft = $state(PRACTICE_DURATION_SEC);
  let gameActive = $state(false);
  let userName = $state('');
  let unitName = $state('');
  let gameTitle = $state('🎯 打地鼠文法選擇挑戰');
  let subtitle = $state('Loading...');
  let bgClass = $state('bg-amber-50');
  let accentClass = $state('border-amber-500');
  let shake = $state(false);
  let explanationVisible = $state(false);
  let explanationText = $state('');
  let sessionData = $state<GameSessionData | null>(null);
  let titleClickCount = $state(0);

  let holes = $state<Hole[]>(
    Array.from({ length: HOLE_COUNT }, () => ({
      optionKey: '',
      optionText: '',
      face: MOLE_FACE_DEFAULT,
      up: false,
      result: '' as const,
      whack: false,
      active: false,
      disabled: true,
    }))
  );

  // Non-reactive control state
  let isTransitioning = false;
  let currentQuestionMistakes = 0;
  let currentQuestionClicks = 0;
  let currentQuestionWrongClicks = 0;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let spawnTickTimer: ReturnType<typeof setInterval> | null = null;
  const hideTimers = new Map<number, ReturnType<typeof setTimeout>>();

  // Derived display
  let livesDisplay = $derived('❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(5 - Math.max(0, lives)));
  let progressDisplay = $derived(`${currentQuestionIndex + 1}/${questions.length}`);
  let timerDisplay = $derived(
    `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
  );
  let currentQ = $derived(questions[currentQuestionIndex]);
  let questionHtml = $derived(currentQ ? formatQuestionHtml(currentQ.questionText || '') : '');

  function currentQuestion(): Question | undefined {
    return questions[currentQuestionIndex];
  }

  function activeCount(): number {
    return holes.filter((h) => h.active).length;
  }

  function formatQuestionHtml(text: string): string {
    return text.replace(/___/g, '<span class="blank-highlight">___</span>');
  }

  function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function parseCSV(csv: string) {
    const list: Question[] = [];
    for (const parts of parseCSVRows(csv)) {
      if (parts.length < 9) continue;
      const correct = parts[6].trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(correct)) continue;
      list.push({
        grammarPoint: parts[0],
        questionText: parts[1],
        options: [
          { key: 'A', text: parts[2] },
          { key: 'B', text: parts[3] },
          { key: 'C', text: parts[4] },
          { key: 'D', text: parts[5] },
        ],
        correctAnswer: correct,
        explanation: parts[8],
      });
    }
    shuffleArray(list);
    questions = list;
  }

  function applyTheme(unit: string) {
    const preset = THEME_PRESETS[unit];
    if (preset) {
      gameTitle = `${preset.emoji} ${preset.title}`;
      bgClass = preset.bodyClass;
      accentClass = preset.accent;
    } else {
      gameTitle = '🎯 打地鼠文法選擇挑戰';
      bgClass = 'bg-amber-50';
      accentClass = 'border-amber-500';
    }
  }

  // ─── Mole board ───

  function resetHole(i: number) {
    const h = holes[i];
    const t = hideTimers.get(i);
    if (t) {
      clearTimeout(t);
      hideTimers.delete(i);
    }
    h.active = false;
    h.up = false;
    h.result = '';
    h.whack = false;
    h.disabled = true;
    h.optionKey = '';
    h.optionText = '';
    h.face = MOLE_FACE_DEFAULT;
  }

  function hideMole(i: number) {
    resetHole(i);
  }

  function pauseSpawnLoop() {
    if (spawnTickTimer !== null) {
      clearInterval(spawnTickTimer);
      spawnTickTimer = null;
    }
    for (const t of hideTimers.values()) clearTimeout(t);
    hideTimers.clear();
  }

  function stopSpawnLoop() {
    pauseSpawnLoop();
    for (let i = 0; i < HOLE_COUNT; i++) resetHole(i);
  }

  function trySpawnMole() {
    if (!gameActive || isTransitioning) return;
    const q = currentQuestion();
    if (!q) return;
    if (activeCount() >= MAX_ACTIVE_MOLES) return;

    const free: number[] = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
      if (!holes[i].active) free.push(i);
    }
    if (free.length === 0) return;

    const holeIndex = free[Math.floor(Math.random() * free.length)];
    const opt = q.options[Math.floor(Math.random() * q.options.length)];
    const h = holes[holeIndex];

    h.optionKey = opt.key;
    h.optionText = opt.text;
    h.face = MOLE_FACE_DEFAULT;
    h.result = '';
    h.whack = false;
    h.active = true;
    h.disabled = false;
    h.up = false;

    setTimeout(() => {
      if (holes[holeIndex].active) holes[holeIndex].up = true;
    }, 40);

    const hideTimer = setTimeout(() => {
      if (holes[holeIndex].active && hideTimers.get(holeIndex) === hideTimer) hideMole(holeIndex);
    }, MOLE_VISIBLE_MS);
    hideTimers.set(holeIndex, hideTimer);
  }

  function startSpawnLoop() {
    stopSpawnLoop();
    trySpawnMole();
    spawnTickTimer = setInterval(() => {
      if (activeCount() < MAX_ACTIVE_MOLES) trySpawnMole();
    }, SPAWN_TICK_MS);
  }

  function handleMoleWhack(holeIndex: number, selectedKey: string) {
    const h = holes[holeIndex];
    if (!gameActive || isTransitioning || h.disabled || !h.active) return;

    const q = currentQuestion();
    if (!q) return;

    const t = hideTimers.get(holeIndex);
    if (t) {
      clearTimeout(t);
      hideTimers.delete(holeIndex);
    }
    pauseSpawnLoop();
    for (let i = 0; i < HOLE_COUNT; i++) {
      if (i !== holeIndex && holes[i].active) resetHole(i);
    }
    h.disabled = true;

    currentQuestionClicks++;
    tracker.updateCurrentQuestionStat({
      clicks: currentQuestionClicks,
      wrongClicks: currentQuestionWrongClicks,
      text: selectedKey,
    });

    if (selectedKey === q.correctAnswer) {
      isTransitioning = true;
      h.face = MOLE_FACE_CORRECT;
      h.result = 'correct';
      h.whack = true;
      playTone(520, 0.08);
      correctCount++;
      tracker.endQuestion(true);

      setTimeout(() => {
        currentQuestionIndex++;
        if (isQuestMode() && correctCount >= QUEST_PASS_CORRECT) endGame();
        else loadQuestion();
      }, 550);
    } else {
      currentQuestionWrongClicks++;
      currentQuestionMistakes++;
      h.face = MOLE_FACE_WRONG;
      h.result = 'wrong';
      h.whack = true;
      playTone(180, 0.12, 'square');
      shake = true;

      if (currentQuestionMistakes >= MAX_MISTAKES_PER_Q) {
        lives--;
        isTransitioning = true;
        tracker.endQuestion(false);
        explanationText = q.explanation;
        setTimeout(() => {
          shake = false;
          explanationVisible = true;
        }, 400);
      } else {
        setTimeout(() => {
          shake = false;
          resetHole(holeIndex);
          if (!isTransitioning) startSpawnLoop();
        }, 650);
      }
    }
  }

  function onNext() {
    explanationVisible = false;
    currentQuestionIndex++;
    if (isQuestMode() && correctCount >= QUEST_PASS_CORRECT) endGame();
    else loadQuestion();
  }

  function playTone(freq: number, duration: number, type: OscillatorType = 'sine') {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* audio optional */
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (timeLeft > 0) timeLeft--;
      else endGame();
    }, 1000);
  }

  function loadQuestion() {
    if (lives <= 0 || timeLeft <= 0) {
      endGame();
      return;
    }

    if (currentQuestionIndex >= questions.length) {
      if (isQuestMode()) {
        endGame();
        return;
      }
      currentQuestionIndex = 0;
      shuffleArray(questions);
    }

    if (isQuestMode() && correctCount >= QUEST_PASS_CORRECT) {
      endGame();
      return;
    }

    stopSpawnLoop();
    isTransitioning = false;
    currentQuestionMistakes = 0;
    currentQuestionClicks = 0;
    currentQuestionWrongClicks = 0;
    explanationVisible = false;

    const q = questions[currentQuestionIndex];
    if (!q) return;

    tracker.startQuestion(q.grammarPoint, q.questionText, false);
    shake = false;
    startSpawnLoop();
  }

  function startGame() {
    playEnterGameSfx();
    sessionData = null;
    correctCount = 0;
    lives = 5;
    currentQuestionIndex = 0;
    timeLeft = isQuestMode() ? QUEST_DURATION_SEC : PRACTICE_DURATION_SEC;
    gameActive = true;
    isTransitioning = false;
    tracker.startGame();
    loadQuestion();
    startTimer();
  }

  function endGame() {
    gameActive = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    stopSpawnLoop();

    if (questLevelParam && correctCount >= QUEST_PASS_CORRECT) {
      localStorage.setItem(`traveler_quest_level${questLevelParam}_complete`, 'true');
    }

    const data = tracker.endGame('completed', correctCount, lives, questions.length);
    if (data) sessionData = data;
  }

  async function initGame(): Promise<boolean> {
    if (!unitParam) {
      subtitle = 'Missing unit parameter in URL';
      return false;
    }
    subtitle = '載入題庫中…';

    const csvUrl = findCsvUrlForUnit(unitParam);
    if (!csvUrl) {
      subtitle = `Question bank not found: ${unitParam}.csv`;
      return false;
    }

    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csvText = await res.text();
      if (!csvText.includes('GrammarPoint') && !csvText.includes('Grammar_Point')) throw new Error('Invalid CSV content');

      unitName = unitParam;
      tracker.setUnitName(unitName);
      parseCSV(csvText);
      applyTheme(unitName);
      subtitle = `${questions.length} 題 · ${unitName.replace(/-/g, ' ')}`;
      return questions.length > 0;
    } catch (err) {
      console.error('Failed to load question bank:', unitParam, err);
      subtitle = `題庫載入失敗（${unitParam}）`;
      return false;
    }
  }

  function addTime() {
    timeLeft += 30;
  }
  function minusTime() {
    timeLeft = Math.max(0, timeLeft - 30);
  }

  // Action: shrink sign text to fit the mole sign
  function fitText(node: HTMLElement, _value: string) {
    function fit() {
      node.style.fontSize = '';
      let size = 13;
      node.style.fontSize = `${size}px`;
      const maxWidth = node.parentElement?.clientWidth ?? 120;
      while (node.scrollWidth > maxWidth - 4 && size > 8) {
        size -= 1;
        node.style.fontSize = `${size}px`;
      }
    }
    fit();
    return { update: fit };
  }

  onMount(() => {
    user.init();
    if (!user.current) {
      alert('請先從文法大廳登入！');
      void goto(returnUrl);
      return;
    }
    userName = user.current;
    tracker.setUserName(userName);

    void (async () => {
      const ready = await initGame();
      if (!ready) return;
      tracker.logEvent('click_start');
      startGame();
    })();

    const beforeUnload = () => {
      if (gameActive) tracker.endGame('abandoned', correctCount, lives, questions.length);
    };
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      if (gameActive) tracker.endGame('abandoned', correctCount, lives, questions.length);
      if (timerInterval) clearInterval(timerInterval);
      stopSpawnLoop();
    };
  });
</script>

<svelte:head>
  <title>Whack-a-Mole Grammar Choice</title>
</svelte:head>

<div class="game-root {bgClass}">
  <header
    class="bg-white shadow-sm p-3 md:p-4 flex justify-between items-center z-10 relative flex-wrap gap-2 shrink-0"
  >
    <div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <h1
        class="text-xl md:text-2xl font-bold text-amber-700 cursor-pointer select-none"
        onclick={() => titleClickCount++}
      >
        {gameTitle}
      </h1>
      <div class="text-gray-500 text-sm">{subtitle}</div>
    </div>
    <div class="flex gap-2 md:gap-3 items-center flex-wrap text-sm md:text-base">
      <div class="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
        ⏳ <span>{timerDisplay}</span>
        <div class="flex gap-1">
          <button
            type="button"
            class="bg-indigo-200 hover:bg-indigo-300 rounded px-2 leading-none"
            title="加 30 秒"
            onclick={addTime}
          >
            +
          </button>
          <button
            type="button"
            class="bg-indigo-200 hover:bg-indigo-300 rounded px-2 leading-none"
            title="減 30 秒"
            onclick={minusTime}
          >
            −
          </button>
        </div>
      </div>
      <div class="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-bold">
        <span>{livesDisplay}</span>
      </div>
      <a
        href={returnUrl}
        class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold"
      >
        🏠 Back
      </a>
    </div>
  </header>

  <main class="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto min-h-0 overflow-y-auto p-2 md:p-3 gap-2 pb-4">
    <div
      class="qcard w-full shrink-0 bg-white rounded-xl shadow-md px-3 py-2 md:px-4 md:py-3 border-b-4 max-h-[28vh] overflow-y-auto {accentClass}"
      class:shake
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <p class="qtext text-sm md:text-lg font-bold text-gray-800 text-center leading-snug">
        {@html questionHtml || '（無題目文字）'}
      </p>
    </div>

    <div class="mole-board" aria-label="Whack-a-mole answer holes (3 by 2)">
      {#each holes as hole, i (i)}
        <div class="hole-cell">
          <div class="hole-bg"></div>
          <button
            type="button"
            class="mole"
            class:mole-up={hole.up}
            class:mole-correct={hole.result === 'correct'}
            class:mole-wrong={hole.result === 'wrong'}
            class:mole-whack={hole.whack}
            disabled={!hole.active || hole.disabled}
            onclick={() => handleMoleWhack(i, hole.optionKey)}
          >
            <span class="mole-face" aria-hidden="true">{hole.face}</span>
            <span class="mole-sign">
              <span class="mole-sign-text" use:fitText={hole.active ? `${hole.optionKey}. ${hole.optionText}` : ''}>
                {hole.active ? `${hole.optionKey}. ${hole.optionText}` : ''}
              </span>
            </span>
          </button>
        </div>
      {/each}
    </div>
  </main>

  {#if explanationVisible}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full mx-4 shadow-2xl text-center">
        <div class="text-5xl mb-3">❌</div>
        <h3 class="text-xl font-bold mb-3 text-red-600">再想想看</h3>
        <p class="text-gray-700 leading-relaxed text-left bg-gray-50 p-4 rounded-xl mb-5 text-sm md:text-base">
          {explanationText}
        </p>
        <button
          class="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700"
          onclick={onNext}
        >
          下一題
        </button>
      </div>
    </div>
  {/if}
</div>

<Scoreboard {sessionData} {userName} onRestart={startGame} onHome={() => goto(returnUrl)} />
<TeacherDashboard bind:triggerCount={titleClickCount} />

<style>
  .game-root {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global(.blank-highlight) {
    color: #d97706;
    background: #fef3c7;
    padding: 0 0.2em;
    border-radius: 0.25rem;
  }

  .qcard {
    min-height: 3.25rem;
    z-index: 20;
    position: relative;
  }
  .qtext {
    color: #1f2937 !important;
    min-height: 1.25em;
  }

  .mole-board {
    display: grid;
    grid-template-columns: repeat(3, 6.25rem);
    grid-template-rows: repeat(2, 6rem);
    flex: 0 0 auto;
    width: auto;
    max-width: 100%;
    margin: 0.25rem auto 0.5rem;
    gap: 0.65rem 1.1rem;
    justify-content: center;
    align-content: start;
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='24'%3E🔨%3C/text%3E%3C/svg%3E")
        12 24,
      pointer;
  }
  .hole-cell {
    position: relative;
    width: 6.25rem;
    height: 6rem;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: visible;
  }
  .hole-bg {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 5.1rem;
    height: 2.85rem;
    transform: translateX(-50%);
    border-radius: 50% 50% 42% 42%;
    background: radial-gradient(ellipse at 50% 88%, #5c4f42 0%, #2a231c 55%, #12100d 100%);
    box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.75);
    z-index: 2;
    pointer-events: none;
  }
  .mole {
    position: relative;
    z-index: 8;
    width: 5.75rem;
    max-width: 5.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    transform: translateY(110%);
    opacity: 0;
    transition:
      transform 0.3s cubic-bezier(0.22, 1.35, 0.36, 1),
      opacity 0.18s ease;
    border: none;
    background: transparent;
    padding: 0;
    margin-bottom: 0.55rem;
    cursor: inherit;
    touch-action: manipulation;
  }
  .mole.mole-up {
    transform: translateY(0);
    opacity: 1;
  }
  .mole-face {
    display: block;
    font-size: clamp(2.85rem, 7vw, 3.6rem);
    line-height: 1;
    margin-bottom: -0.25rem;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22));
    pointer-events: none;
    transform-origin: bottom center;
  }
  .mole-sign {
    display: block;
    width: 100%;
    background: linear-gradient(180deg, #fffbeb 0%, #fde68a 55%, #f59e0b 100%);
    border: 2px solid #b45309;
    border-radius: 0.45rem;
    box-shadow:
      0 3px 0 #92400e,
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
    padding: 0.28rem 0.3rem;
    min-height: 2.15rem;
    pointer-events: none;
  }
  .mole-sign-text {
    display: block;
    font-weight: 800;
    color: #1f2937;
    text-align: center;
    line-height: 1.1;
    word-break: break-word;
    font-size: 0.82rem;
  }
  .mole:disabled {
    cursor: inherit;
    pointer-events: none;
  }
  .mole-correct .mole-sign {
    background: linear-gradient(180deg, #d1fae5 0%, #6ee7b7 100%) !important;
    border-color: #059669 !important;
    box-shadow: 0 4px 0 #047857 !important;
  }
  .mole-wrong .mole-sign {
    background: linear-gradient(180deg, #fee2e2 0%, #fecaca 100%) !important;
    border-color: #dc2626 !important;
    box-shadow: 0 4px 0 #b91c1c !important;
  }
  .mole-whack .mole-face {
    animation: mole-whack-face 0.14s ease-out;
  }
  @keyframes mole-whack-face {
    50% {
      transform: scale(0.92) translateY(4px);
    }
  }
  .shake {
    animation: shake 0.45s ease-in-out;
  }
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-6px);
    }
    75% {
      transform: translateX(6px);
    }
  }
</style>
