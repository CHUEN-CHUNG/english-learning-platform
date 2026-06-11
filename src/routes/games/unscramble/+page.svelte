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
    targetSentence: string;
    scrambledParts: string[];
    distractorParts: string[];
    capitalizationHint: boolean;
    punctuationHint: boolean;
    explanation: string;
  }

  interface CarData {
    id: string;
    text: string;
    isDistractor: boolean;
  }

  // unit -> path relative to static/content/grammar/
  const CSV_BANK: Record<string, string> = {
    'Present-Simple-Unscramble': 'time-tense/Present-Simple/Present-Simple-Unscramble.csv',
    'Present-Continuous-Unscramble': 'time-tense/Present-Continuous/Present-Continuous-Unscramble.csv',
    'Past-Simple-Unscramble': 'time-tense/Past-Simple/Past-Simple-Unscramble.csv',
    'Future-Simple-Unscramble': 'time-tense/Future-Simple/Future-Simple-Unscramble.csv',
    'WHQA-Traveler-Level2-Unscramble': 'Grammar-Basic/WHQA+Dummy Subject/WHQA-Traveler-Level2-Unscramble.csv',
  };

  function findCsvUrlForUnit(unit: string): string | null {
    const rel = CSV_BANK[unit];
    if (!rel) return null;
    return `${base}/content/grammar/${encodeURI(rel)}`;
  }

  const PRACTICE_DURATION_SEC = 600;

  const tracker = new GrammarDataTracker('Unscramble');

  // URL params
  let returnToParam = $derived($page.url.searchParams.get('returnTo'));
  let questLevelParam = $derived($page.url.searchParams.get('questLevel'));
  let unitParam = $derived($page.url.searchParams.get('unit'));
  let returnUrl = $derived(
    returnToParam
      ? returnToParam
      : questLevelParam
        ? `${base}/grammar-hub?tab=wh`
        : `${base}/grammar-hub`
  );

  // Reactive game state
  let questions = $state<Question[]>([]);
  let currentQuestionIndex = $state(0);
  let correctCount = $state(0);
  let lives = $state(3);
  let timeLeft = $state(PRACTICE_DURATION_SEC);
  let gameActive = $state(false);
  let userName = $state('');
  let unitName = $state('');
  let subtitle = $state('Loading...');
  let allCars = $state<CarData[]>([]);
  let selectedCarIds = $state<string[]>([]);
  let shake = $state(false);
  let successBg = $state(false);
  let explanationVisible = $state(false);
  let modalIcon = $state('❌');
  let modalTitle = $state('Not quite!');
  let modalTitleWrong = $state(true);
  let modalTarget = $state('');
  let modalExplanation = $state('');
  let sessionData = $state<GameSessionData | null>(null);
  let titleClickCount = $state(0);

  // Non-reactive control state
  let isTransitioning = false;
  let currentQuestionMistakes = 0;
  let currentQuestionAttaches = 0;
  let currentQuestionDetaches = 0;
  let currentQuestionWrongSubmits = 0;
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  // Derived display
  let livesDisplay = $derived('❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives)));
  let progressDisplay = $derived(`${currentQuestionIndex + 1}/${questions.length}`);
  let timerDisplay = $derived(
    `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
  );
  let currentQ = $derived(questions[currentQuestionIndex]);
  let grammarPointText = $derived(currentQ ? currentQ.grammarPoint.replace(/_/g, ' ') : 'Grammar Point');
  let selectedCars = $derived(
    selectedCarIds.map((id) => allCars.find((c) => c.id === id)).filter((c): c is CarData => !!c)
  );
  let scrambledCars = $derived(allCars.filter((c) => !selectedCarIds.includes(c.id)));
  let submitDisabled = $derived(!currentQ || selectedCarIds.length !== currentQ.scrambledParts.length);

  function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function parseCSV(csv: string) {
    const list: Question[] = [];
    for (const parts of parseCSVRows(csv)) {
      if (parts.length < 7) continue;
      list.push({
        grammarPoint: parts[0],
        targetSentence: parts[1],
        scrambledParts: parts[2].split('|').filter((p) => p.trim() !== ''),
        distractorParts: parts[3] ? parts[3].split('|').filter((p) => p.trim() !== '') : [],
        capitalizationHint: parts[4].trim().toUpperCase() === 'TRUE',
        punctuationHint: parts[5].trim().toUpperCase() === 'TRUE',
        explanation: parts[6],
      });
    }
    shuffleArray(list);
    questions = list;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (timeLeft > 0) timeLeft--;
      else endGame();
    }, 1000);
  }

  function addTime() {
    timeLeft += 30;
  }
  function minusTime() {
    timeLeft = Math.max(0, timeLeft - 30);
  }

  function loadQuestion() {
    isTransitioning = false;
    currentQuestionMistakes = 0;
    currentQuestionAttaches = 0;
    currentQuestionDetaches = 0;
    currentQuestionWrongSubmits = 0;
    successBg = false;
    explanationVisible = false;

    if (currentQuestionIndex >= questions.length || lives <= 0 || timeLeft <= 0) {
      endGame();
      return;
    }

    const q = questions[currentQuestionIndex];
    tracker.startQuestion(q.grammarPoint, q.targetSentence, true);

    const cars: CarData[] = [];
    q.scrambledParts.forEach((part, idx) => {
      cars.push({ id: `correct-${idx}`, text: part.trim(), isDistractor: false });
    });
    q.distractorParts.forEach((part, idx) => {
      cars.push({ id: `distract-${idx}`, text: part.trim(), isDistractor: true });
    });
    shuffleArray(cars);

    selectedCarIds = [];
    allCars = cars;
  }

  function toggleCar(car: CarData) {
    if (!gameActive || isTransitioning) return;
    if (selectedCarIds.includes(car.id)) {
      selectedCarIds = selectedCarIds.filter((id) => id !== car.id);
      currentQuestionDetaches++;
      tracker.updateCurrentQuestionStat({ detaches: currentQuestionDetaches });
      playSound('detach');
    } else {
      selectedCarIds = [...selectedCarIds, car.id];
      currentQuestionAttaches++;
      tracker.updateCurrentQuestionStat({ attaches: currentQuestionAttaches });
      playSound('attach');
    }
  }

  function resetCars() {
    if (!gameActive) return;
    selectedCarIds = [];
  }

  function submit() {
    if (!gameActive || isTransitioning) return;
    const q = questions[currentQuestionIndex];
    if (!q) return;

    const userSentence = selectedCars
      .map((c) => c.text)
      .join(' ')
      .replace(/\s+([.,!?])/g, '$1');

    const normalizedUser = userSentence
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();
    const normalizedTarget = q.targetSentence
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();

    if (normalizedUser === normalizedTarget) {
      isTransitioning = true;
      correctCount++;
      tracker.endQuestion(true);
      successBg = true;
      playSound('success');

      setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
      }, 1500);
    } else {
      currentQuestionWrongSubmits++;
      tracker.updateCurrentQuestionStat({ wrongSubmits: currentQuestionWrongSubmits });
      currentQuestionMistakes++;
      shake = true;
      playSound('wrong');

      if (currentQuestionMistakes >= 3) {
        lives--;
        isTransitioning = true;
        setTimeout(() => {
          shake = false;
          showExplanation(false);
        }, 500);
      } else {
        setTimeout(() => {
          shake = false;
        }, 500);
      }
    }
  }

  function showExplanation(isCorrect: boolean) {
    const q = questions[currentQuestionIndex];
    if (isCorrect) {
      modalIcon = '✅';
      modalTitle = 'Correct! The train is leaving!';
      modalTitleWrong = false;
    } else {
      modalIcon = '❌';
      modalTitle = 'Not quite!';
      modalTitleWrong = true;
    }
    modalTarget = `Answer: ${q.targetSentence}`;
    modalExplanation = q.explanation;
    explanationVisible = true;
    tracker.endQuestion(isCorrect);
  }

  function onNext() {
    if (!explanationVisible) return;
    explanationVisible = false;
    currentQuestionIndex++;
    loadQuestion();
  }

  function startGame() {
    playEnterGameSfx();
    sessionData = null;
    correctCount = 0;
    lives = 3;
    currentQuestionIndex = 0;
    currentQuestionMistakes = 0;
    timeLeft = PRACTICE_DURATION_SEC;
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

    if (questLevelParam === '2' && correctCount >= 3) {
      localStorage.setItem('traveler_quest_level2_complete', 'true');
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

      unitName = unitParam;
      tracker.setUnitName(unitName);
      parseCSV(csvText);
      subtitle = unitName.replace(/-/g, ' ');
      return questions.length > 0;
    } catch (err) {
      console.error('Failed to load question bank:', unitParam, err);
      subtitle = `題庫載入失敗（${unitParam}）`;
      return false;
    }
  }

  function playSound(type: 'attach' | 'detach' | 'success' | 'wrong') {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'attach') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'detach') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.25);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.45);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      /* audio optional */
    }
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
    };
  });
</script>

<svelte:head>
  <title>Train Grammar Unscramble</title>
</svelte:head>

<div class="game-root bg-green-50">
  <header
    class="bg-white shadow-sm p-4 flex justify-between items-center z-10 relative flex-wrap gap-2 shrink-0"
  >
    <div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <h1
        class="text-2xl font-bold text-green-700 cursor-pointer select-none"
        onclick={() => titleClickCount++}
      >
        🚂 Train Grammar Unscramble
      </h1>
      <div class="text-gray-500 text-sm">{subtitle}</div>
    </div>
    <div class="flex gap-2 md:gap-4 items-center flex-wrap text-sm md:text-base">
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
      <div class="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg font-bold">
        Progress: <span>{progressDisplay}</span>
      </div>
      <div class="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-bold">
        Lives: <span>{livesDisplay}</span>
      </div>
      <div class="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg font-bold">
        Correct: <span>{correctCount}</span>
      </div>
      <a
        href={returnUrl}
        class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold"
      >
        🏠 Back to Hub
      </a>
    </div>
  </header>

  <main
    class="flex-1 flex flex-col items-center p-2 sm:p-4 w-full max-w-5xl mx-auto relative min-h-0 overflow-y-auto overflow-x-hidden"
  >
    <div class="w-full text-center mb-2 sm:mb-4 shrink-0">
      <p class="text-xs sm:text-sm text-green-600 font-bold mb-1 uppercase tracking-wider">
        {grammarPointText}
      </p>
      <p class="text-gray-600 text-sm sm:text-base md:text-lg">
        Tap the cars below and connect them in the right order behind the engine!<br />
        <span class="text-red-500 font-bold mt-1 sm:mt-2 inline-block"
          >⚠️ Note: Some cars are distractors — you will not use every word!</span
        ><br />
        <span class="text-blue-500 font-bold mt-1 inline-block"
          >💡 Tip: Tap a car on the train to remove it and try again.</span
        >
      </p>
    </div>

    <div class="w-full mb-4 sm:mb-8 shrink-0">
      <div class="train-container" class:shake class:success-bg={successBg}>
        <div class="train-engine text-xl sm:text-2xl">🚂</div>
        {#each selectedCars as car (car.id)}
          <button type="button" class="train-car" onclick={() => toggleCar(car)}>{car.text}</button>
        {/each}
      </div>
    </div>

    <div
      class="w-full bg-white rounded-2xl shadow-md p-4 sm:p-6 border-b-4 border-green-500 flex flex-col shrink-0 mb-4"
    >
      <h3 class="text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-4 text-center">
        Word Car Yard
      </h3>
      <div class="scrambled-area flex-1 overflow-y-auto">
        {#each scrambledCars as car (car.id)}
          <button type="button" class="train-car" class:fade-out={successBg} onclick={() => toggleCar(car)}
            >{car.text}</button
          >
        {/each}
      </div>

      <div class="mt-4 sm:mt-8 text-center flex justify-center gap-2 sm:gap-4 flex-wrap">
        <button
          type="button"
          class="px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition shadow-sm text-sm sm:text-base"
          onclick={resetCars}
        >
          Reset Cars
        </button>
        <button
          type="button"
          class="px-4 py-2 sm:px-8 sm:py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md text-sm sm:text-base"
          class:opacity-50={submitDisabled}
          class:cursor-not-allowed={submitDisabled}
          disabled={submitDisabled}
          onclick={submit}
        >
          Send the Train
        </button>
      </div>
    </div>
  </main>

  {#if explanationVisible}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl text-center">
        <div class="text-6xl mb-4">{modalIcon}</div>
        <h3 class="text-2xl font-bold mb-2" class:text-red-600={modalTitleWrong} class:text-green-600={!modalTitleWrong}>
          {modalTitle}
        </h3>
        <div class="bg-gray-50 p-4 rounded-xl mb-6 text-left">
          <p class="font-bold text-lg text-gray-800 mb-2 border-b pb-2">{modalTarget}</p>
          <p class="text-gray-700 leading-relaxed">{modalExplanation}</p>
        </div>
        <button
          type="button"
          class="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-md"
          onclick={onNext}
        >
          Next Question
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

  .train-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: flex-start;
    min-height: 100px;
    padding: 1rem;
    background-color: #f3f4f6;
    border-radius: 1rem;
    border: 4px dashed #9ca3af;
  }

  .train-engine {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ef4444;
    color: white;
    font-weight: bold;
    padding: 1rem 1.5rem;
    border-radius: 1rem 0.5rem 0.5rem 1rem;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
    position: relative;
  }
  .train-engine::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background-color: #374151;
    border-radius: 50%;
  }

  .train-car {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #3b82f6;
    color: white;
    font-weight: bold;
    font-size: 1.25rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition:
      transform 0.1s,
      box-shadow 0.1s,
      opacity 0.3s;
    position: relative;
    user-select: none;
    border: none;
  }
  .train-car:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
  }
  .train-car::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 4px;
    background-color: #374151;
  }

  .scrambled-area {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    min-height: 100px;
    padding: 1rem;
  }

  .shake {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-2px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(4px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-8px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(8px, 0, 0);
    }
  }

  .fade-out {
    opacity: 0.3;
    filter: grayscale(100%);
    pointer-events: none;
  }

  .success-bg {
    background-color: #d1fae5 !important;
    border-color: #10b981 !important;
  }
</style>
