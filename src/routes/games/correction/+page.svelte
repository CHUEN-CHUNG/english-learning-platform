<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  interface BugData {
    target_index: number;
    wrong_word: string;
    correct_word: string;
    options: string[];
    explanation: string;
  }

  interface BugQuestion {
    question_id: string;
    category: string;
    difficulty: number;
    original_sentence: string;
    tokens: string[];
    bugs: BugData[];
  }

  const INITIAL_HP = 3;
  const TIME_LIMIT_MS = 25000;
  const COMBO_MULTIPLIER = 10;
  const BASE_SCORE = 100;

  // path relative to static/content/grammar/ (runtime cannot glob)
  const CORRECTION_BANKS = ['Grammar-Basic/WHQA+Dummy Subject/WHQA-How-Correction.json'];

  // URL params
  let topicParam = $derived($page.url.searchParams.get('topic') ?? '');
  let returnToParam = $derived($page.url.searchParams.get('returnTo'));
  let returnUrl = $derived(returnToParam ? returnToParam : `${base}/grammar-hub`);

  // State
  let questions = $state<BugQuestion[]>([]);
  let currentIndex = $state(0);
  let hp = $state(INITIAL_HP);
  let score = $state(0);
  let combo = $state(0);
  let tokens = $state<string[]>([]);
  let loadError = $state('');

  let isQuestionActive = false;
  let currentBug: BugData | null = null;

  // Token visual state
  let selectedIndex = $state<number | null>(null);
  let missFlashIndex = $state<number | null>(null);
  let resultKind = $state<'' | 'correct' | 'wrong'>('');
  let correctedText = $state('');
  let correctedDeleted = $state(false);

  // Correction panel
  let panelVisible = $state(false);
  let panelOptions = $state<string[]>([]);

  // Modal
  let modalVisible = $state(false);
  let modalIcon = $state('💡');
  let modalTitle = $state('解析');
  let modalTitleClass = $state('text-2xl font-black text-center text-slate-800 mb-2');
  let modalDescHtml = $state('');
  let modalActionLabel = $state('繼續 / 下一題');
  let modalActionKind = $state<'next' | 'restart'>('next');

  // Feedback toast
  let feedbackText = $state('');
  let feedbackColor = $state('text-blue-500');
  let feedbackVisible = $state(false);

  // Timer
  let timeRemainingMs = $state(TIME_LIMIT_MS);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let lastTickTime = 0;
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  // Derived display
  let hpDisplay = $derived('❤️'.repeat(Math.max(0, hp)) + '🤍'.repeat(INITIAL_HP - Math.max(0, hp)));
  let comboVisible = $derived(combo >= 2);
  let timePercentage = $derived(Math.max(0, (timeRemainingMs / TIME_LIMIT_MS) * 100));
  let timeText = $derived(`${Math.ceil(timeRemainingMs / 1000)}s`);
  let timeBarColor = $derived(
    timePercentage < 25 ? 'bg-red-500' : timePercentage < 50 ? 'bg-orange-500' : 'bg-blue-500'
  );
  let currentQuestion = $derived(questions[currentIndex]);
  let questionInfo = $derived(`Lv.${currentQuestion?.difficulty ?? 1} | 尋找 1 隻蟲 🐛`);

  function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function tokenClass(i: number): string {
    let c = 'token shadow-sm bg-white border border-slate-200';
    if (i === missFlashIndex) c += ' miss';
    if (i === selectedIndex) {
      c += ' selected';
      if (resultKind === 'correct') c += ' correct-hit';
      else if (resultKind === 'wrong') c += ' miss';
      else c += ' ring-4 ring-blue-300';
    }
    if (i === selectedIndex && resultKind === 'correct' && correctedDeleted) {
      c += ' line-through text-slate-400';
    }
    return c;
  }

  function tokenText(i: number): string {
    if (i === selectedIndex && resultKind === 'correct') {
      return correctedDeleted ? '❌ (刪除)' : correctedText;
    }
    return tokens[i];
  }

  async function loadCorrectionQuestions(topicPattern: string): Promise<BugQuestion[]> {
    let all: BugQuestion[] = [];
    for (const rel of CORRECTION_BANKS) {
      if (topicPattern && !rel.toLowerCase().includes(topicPattern.toLowerCase())) continue;
      try {
        const url = `${base}/content/grammar/${encodeURI(rel)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as BugQuestion[];
        all = all.concat(data);
      } catch (e) {
        console.error(`Failed to load ${rel}:`, e);
      }
    }
    return shuffle(all);
  }

  async function loadGame() {
    questions = await loadCorrectionQuestions(topicParam);
    if (questions.length === 0) {
      loadError = '找不到題庫，請確認 JSON 檔案是否存在。';
      return;
    }
    resetAndStart();
  }

  function resetAndStart() {
    hp = INITIAL_HP;
    score = 0;
    combo = 0;
    currentIndex = 0;
    questions = shuffle(questions);
    loadQuestion();
  }

  function clearTokenState() {
    selectedIndex = null;
    missFlashIndex = null;
    resultKind = '';
    correctedText = '';
    correctedDeleted = false;
  }

  function loadQuestion() {
    const q = questions[currentIndex];
    if (!q) {
      endGame();
      return;
    }
    isQuestionActive = true;
    currentBug = q.bugs[0];
    panelVisible = false;
    clearTokenState();
    tokens = [...q.tokens];
    startTimer();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeRemainingMs = TIME_LIMIT_MS;
    lastTickTime = performance.now();
    timerInterval = setInterval(() => {
      if (!isQuestionActive) {
        if (timerInterval) clearInterval(timerInterval);
        return;
      }
      const now = performance.now();
      const delta = now - lastTickTime;
      lastTickTime = now;
      timeRemainingMs -= delta;
      if (timeRemainingMs <= 0) {
        timeRemainingMs = 0;
        handleTimeout();
      }
    }, 50);
  }

  function handleTokenClick(index: number) {
    if (!isQuestionActive || !currentBug) return;
    if (index === currentBug.target_index) {
      selectedIndex = index;
      resultKind = '';
      showFeedback('Caught a Bug! 🐛', 'text-blue-500');
      showCorrectionPanel();
    } else {
      missFlashIndex = index;
      combo = 0;
      takeDamage();
      showFeedback('Miss! ❌', 'text-red-500');
      setTimeout(() => {
        if (missFlashIndex === index) missFlashIndex = null;
      }, 500);
    }
  }

  function showCorrectionPanel() {
    if (!currentBug) return;
    panelOptions = shuffle(currentBug.options);
    panelVisible = true;
  }

  function handleOptionSelect(option: string) {
    if (!currentBug || !isQuestionActive) return;
    isQuestionActive = false;
    if (timerInterval) clearInterval(timerInterval);
    panelVisible = false;

    if (option === currentBug.correct_word) {
      score += BASE_SCORE + combo * COMBO_MULTIPLIER;
      combo++;
      resultKind = 'correct';
      if (currentBug.correct_word === '') {
        correctedDeleted = true;
      } else {
        correctedText = currentBug.correct_word;
        correctedDeleted = false;
      }
      showFeedback('Perfect! ✨', 'text-green-500');
      setTimeout(() => nextQuestion(), 1200);
    } else {
      combo = 0;
      resultKind = 'wrong';
      takeDamage();
      if (hp > 0) showExplanationModal(false);
    }
  }

  let shake = $state(false);
  function takeDamage() {
    hp--;
    shake = true;
    setTimeout(() => (shake = false), 400);
    if (hp <= 0) {
      isQuestionActive = false;
      if (timerInterval) clearInterval(timerInterval);
      setTimeout(showGameOver, 500);
    }
  }

  function handleTimeout() {
    isQuestionActive = false;
    if (timerInterval) clearInterval(timerInterval);
    combo = 0;
    takeDamage();
    panelVisible = false;
    if (hp > 0) showExplanationModal(true);
  }

  function showFeedback(text: string, colorClass: string) {
    feedbackText = text;
    feedbackColor = colorClass;
    feedbackVisible = true;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => (feedbackVisible = false), 1000);
  }

  function showExplanationModal(isTimeout: boolean) {
    if (isTimeout) {
      modalIcon = '⏰';
      modalTitle = '時間到！';
      modalTitleClass = 'text-2xl font-black text-center text-orange-500 mb-2';
    } else {
      modalIcon = '💥';
      modalTitle = '改錯了！';
      modalTitleClass = 'text-2xl font-black text-center text-red-500 mb-2';
    }
    modalDescHtml = currentBug
      ? `<span class="block mb-4 text-slate-700 font-bold bg-slate-100 p-3 rounded-xl border border-slate-200">${currentBug.explanation}</span>`
      : '';
    modalActionLabel = '繼續挑戰';
    modalActionKind = 'next';
    modalVisible = true;
  }

  function showGameOver() {
    modalIcon = '💀';
    modalTitle = 'Game Over';
    modalTitleClass = 'text-3xl font-black text-center text-red-600 mb-2';
    modalDescHtml = `
      <span class="block text-2xl font-black text-slate-700 mb-2">最終分數: <span class="text-blue-600">${score}</span></span>
      快回去複習文法再來挑戰吧！
    `;
    modalActionLabel = '重新開始';
    modalActionKind = 'restart';
    modalVisible = true;
  }

  function endGame() {
    modalIcon = '🏆';
    modalTitle = '恭喜通關！';
    modalTitleClass = 'text-3xl font-black text-center text-green-600 mb-2';
    modalDescHtml = `
      <span class="block text-2xl font-black text-slate-700 mb-2">最終分數: <span class="text-blue-600">${score}</span></span>
      你抓到了所有的文法蟲！
    `;
    modalActionLabel = '再玩一次';
    modalActionKind = 'restart';
    modalVisible = true;
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) {
      endGame();
      return;
    }
    loadQuestion();
  }

  function onModalAction() {
    modalVisible = false;
    if (modalActionKind === 'next') nextQuestion();
    else resetAndStart();
  }

  onMount(() => {
    void loadGame();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (feedbackTimer) clearTimeout(feedbackTimer);
    };
  });
</script>

<svelte:head>
  <title>抓蟲遊戲 - 文法挑錯</title>
</svelte:head>

<div class="game-root bg-slate-50 text-slate-800" class:shake>
  <header class="bg-white shadow-sm px-4 py-3 flex justify-between items-center z-10 shrink-0">
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition"
        title="返回大廳"
        onclick={() => goto(returnUrl)}
      >
        <span class="text-xl">🏠</span>
      </button>
      <div class="text-xl font-bold text-slate-700 font-mono">
        SCORE: <span class="text-blue-600">{score}</span>
      </div>
      {#if comboVisible}
        <div class="text-sm font-bold text-orange-500 animate-bounce">Combo x<span>{combo}</span></div>
      {/if}
    </div>

    <div class="flex-1 max-w-md mx-4 hidden sm:block">
      <div class="h-4 bg-slate-200 rounded-full overflow-hidden relative">
        <div
          class="h-full transition-all duration-100 ease-linear {timeBarColor}"
          style="width: {timePercentage}%"
        ></div>
        <div
          class="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold text-slate-700 mix-blend-color-burn"
        >
          <span>{timeText}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-1 text-2xl">{hpDisplay}</div>
  </header>

  <main class="flex-1 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
    <div class="text-sm font-bold text-slate-500 mb-6 bg-white px-4 py-1 rounded-full shadow-sm">
      {questionInfo}
    </div>

    <div
      class="text-3xl md:text-5xl lg:text-6xl font-bold leading-relaxed text-center max-w-5xl selection:bg-transparent flex flex-wrap justify-center gap-y-4"
    >
      {#if loadError}
        <span class="text-slate-500 text-2xl">{loadError}</span>
      {:else}
        {#each tokens as _token, i (i)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class={tokenClass(i)} onclick={() => handleTokenClick(i)}>{tokenText(i)}</span>
        {/each}
      {/if}
    </div>

    {#if feedbackVisible}
      <div
        class="feedback-toast absolute top-1/4 left-1/2 text-4xl md:text-5xl font-black drop-shadow-lg pointer-events-none z-20 {feedbackColor}"
      >
        {feedbackText}
      </div>
    {/if}
  </main>

  {#if panelVisible}
    <footer
      class="bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 sm:p-6 shrink-0"
    >
      <div class="max-w-3xl mx-auto flex flex-col items-center">
        <h3 class="text-lg font-bold text-slate-700 mb-4">請選擇正確的修改方式：</h3>
        <div class="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          {#each panelOptions as opt (opt)}
            <button
              type="button"
              class="bg-slate-100 hover:bg-slate-200 font-bold py-4 px-4 rounded-xl text-lg text-slate-700 transition transform hover:scale-[1.02] shadow-sm border border-slate-200"
              onclick={() => handleOptionSelect(opt)}
            >
              {opt === '' ? '❌ (刪除)' : opt}
            </button>
          {/each}
        </div>
      </div>
    </footer>
  {/if}

  {#if modalVisible}
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div class="text-6xl text-center mb-4">{modalIcon}</div>
        <h2 class={modalTitle ? modalTitleClass : ''}>{modalTitle}</h2>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <p class="text-slate-600 text-lg mb-8 text-center leading-relaxed">{@html modalDescHtml}</p>
        <div class="flex justify-center">
          <button
            type="button"
            class="bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-3 px-10 rounded-2xl shadow-md transition transform hover:scale-105"
            onclick={onModalAction}
          >
            {modalActionLabel}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-root {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global(.token) {
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-block;
    margin: 0 0.2rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
  }
  :global(.token:hover) {
    background-color: rgba(59, 130, 246, 0.1);
    transform: scale(1.05);
  }
  :global(.token.selected) {
    background-color: #3b82f6;
    color: white;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    transform: scale(1.1);
  }
  :global(.token.correct-hit) {
    background-color: #10b981 !important;
    color: white;
    animation: bounce 0.5s ease;
  }
  :global(.token.miss) {
    background-color: #ef4444 !important;
    color: white;
    animation: shake 0.4s ease;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    50% {
      transform: translateX(5px);
    }
    75% {
      transform: translateX(-5px);
    }
  }
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .shake {
    animation: shake 0.4s ease;
  }

  .feedback-toast {
    transform: translate(-50%, -20px) scale(1.1);
    animation: feedback-pop 1s ease forwards;
  }
  @keyframes feedback-pop {
    0% {
      opacity: 1;
      transform: translate(-50%, -20px) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, 0) scale(1);
    }
  }
</style>
