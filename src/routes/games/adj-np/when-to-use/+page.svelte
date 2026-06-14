<script lang="ts">
  import GameLayout from '$lib/components/game/GameLayout.svelte';
  import ActionBtn from '$lib/components/ui/ActionBtn.svelte';
  import { base } from '$app/paths';
  import { parseCSVRows } from '$lib/utils/csv-parser';

  interface ComboRow {
    id: string;
    scenario_type: string;
    combo_id: string;
    combo_name: string;
    step1_emoji: string;
    step1_expected_input: string;
    step2_condition: string;
    step2_expected_output: string;
  }

  interface Combo {
    combo_id: string;
    scenario_type: string;
    combo_name: string;
    step1_emoji: string;
    step1_expected_input: string;
    step2_options: {
      condition: string;
      expected_output: string;
    }[];
  }

  let combos = $state<Combo[]>([]);
  let currentComboIndex = $state(0);
  let status = $state<'LOADING' | 'IDLE' | 'STEP1_PLAYING' | 'STEP2_DRAWING' | 'STEP2_PLAYING' | 'COMBO_SUCCESS' | 'COMBO_FAIL' | 'GAME_OVER'>('LOADING');

  let currentCombo = $derived(combos[currentComboIndex]);

  let timeLeft = $state(0);
  let timer: ReturnType<typeof setInterval>;
  let score = $state(0);
  let hp = $state(5);
  let feedbackMessage = $state('');
  
  let selectedStep2Option = $state<{ condition: string; expected_output: string } | null>(null);
  let displayOptions = $state<{ condition: string; expected_output: string }[]>([]);

  let scrambledWords = $state<{id: number, word: string}[]>([]);
  let userInput = $state('');

  function initScrambledWords(sentence: string) {
    const words = sentence.split(' ').filter(w => w.trim() !== '');
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    scrambledWords = shuffled.map((word, i) => ({ id: i, word }));
  }

  function normalizeString(str: string): string {
    let res = str.toLowerCase().trim();
    // 移除所有非英數字與空白
    res = res.replace(/[^\w\s]/gi, '');
    res = res.replace(/\s+/g, ' ');
    // 簡單替換數字
    res = res.replace(/\b1\b/g, 'one');
    res = res.replace(/\b2\b/g, 'two');
    res = res.replace(/\b3\b/g, 'three');
    res = res.replace(/\b4\b/g, 'four');
    return res;
  }

  $effect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${base}/content/grammar/ordering_conversation_adj_n/Game_Ordering_Beginner.csv`);
        const text = await res.text();
        const rows = parseCSVRows(text);
        
        const comboMap = new Map<string, Combo>();
        rows.forEach(row => {
          if (row.length < 8) return;
          const [id, scenario_type, combo_id, combo_name, step1_emoji, step1_expected_input, step2_condition, step2_expected_output] = row;
          if (!comboMap.has(combo_id)) {
            comboMap.set(combo_id, {
              combo_id,
              scenario_type,
              combo_name,
              step1_emoji,
              step1_expected_input,
              step2_options: []
            });
          }
          comboMap.get(combo_id)!.step2_options.push({
            condition: step2_condition,
            expected_output: step2_expected_output
          });
        });
        
        let loadedCombos = Array.from(comboMap.values());
        // 隨機打亂題庫
        loadedCombos = loadedCombos.sort(() => Math.random() - 0.5);
        combos = loadedCombos;
        status = 'IDLE';
      } catch (e) {
        console.error('Failed to load CSV', e);
        feedbackMessage = 'Failed to load questions!';
      }
    }
    loadData();
  });

  let globalTimeLeft = $state(600); // 10 minutes
  let globalTimer: ReturnType<typeof setInterval>;

  function startTimer(seconds: number, onTimeout: () => void) {
    clearInterval(timer);
    timeLeft = seconds;
    timer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timer);
        onTimeout();
      }
    }, 1000);
  }

  function startGame() {
    hp = 5;
    score = 0;
    currentComboIndex = 0;
    globalTimeLeft = 600;
    clearInterval(globalTimer);
    globalTimer = setInterval(() => {
      globalTimeLeft--;
      if (globalTimeLeft <= 0) {
        clearInterval(globalTimer);
        clearInterval(timer);
        status = 'GAME_OVER';
      }
    }, 1000);
    startStep1();
  }

  function handleTimeout() {
    if (hp > 0) {
      hp--;
      const ans = status === 'STEP1_PLAYING' ? currentCombo.step1_expected_input : selectedStep2Option?.expected_output || '';
      feedbackMessage = `Time's up! Answer: ${ans} ❤️ -1. Try again!`;
      userInput = '';
      startTimer(60, handleTimeout);
    } else {
      handleFail("Time's up and Out of HP! Showing the correct answer.");
    }
  }

  function startStep1() {
    status = 'STEP1_PLAYING';
    initScrambledWords(currentCombo.step1_expected_input);
    feedbackMessage = '';
    // 每題時間預設為 60 秒
    startTimer(60, handleTimeout);
  }

  function submitStep1() {
    const expected = normalizeString(currentCombo.step1_expected_input);
    const actual = normalizeString(userInput);
    if (actual === expected) {
      clearInterval(timer);
      startStep2Drawing();
    } else {
      if (hp > 0) {
        hp--;
        feedbackMessage = `Incorrect! Answer: ${currentCombo.step1_expected_input} ❤️ -1. Try again!`;
        userInput = '';
      } else {
        handleFail("Incorrect! Out of HP! Showing the correct answer.");
      }
    }
  }

  function handleKeyDownStep1(e: KeyboardEvent) {
    if (e.key === 'Enter') submitStep1();
  }

  function startStep2Drawing() {
    status = 'STEP2_DRAWING';
    userInput = '';
    scrambledWords = [];
    feedbackMessage = 'Great! Now pick a card...';
    // 隨機抽 3 張
    displayOptions = [...currentCombo.step2_options]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }

  function selectCard(option: { condition: string; expected_output: string }) {
    if (status !== 'STEP2_DRAWING') return;
    selectedStep2Option = option;
    status = 'STEP2_PLAYING';
    initScrambledWords(option.expected_output);
    feedbackMessage = `You selected '${option.condition}'. Type the complete sentence!`;
    // 每題時間預設為 60 秒
    startTimer(60, handleTimeout);
  }

  function submitStep2() {
    if (!selectedStep2Option) return;
    const expected = normalizeString(selectedStep2Option.expected_output);
    const actual = normalizeString(userInput);
    if (actual === expected) {
      clearInterval(timer);
      handleSuccess();
    } else {
      if (hp > 0) {
        hp--;
        feedbackMessage = `Incorrect! Answer: ${selectedStep2Option.expected_output} ❤️ -1. Try again!`;
        userInput = '';
      } else {
        handleFail("Incorrect! Out of HP! Showing the correct answer.");
      }
    }
  }

  function handleKeyDownStep2(e: KeyboardEvent) {
    if (e.key === 'Enter') submitStep2();
  }

  function handleFail(msg: string) {
    clearInterval(timer);
    feedbackMessage = msg;
    status = 'COMBO_FAIL';
  }

  function handleSuccess() {
    clearInterval(timer);
    score += 100;
    feedbackMessage = 'Combo Success! +100 Points 🎉';
    status = 'COMBO_SUCCESS';
  }

  function nextCombo() {
    currentComboIndex++;
    if (currentComboIndex >= combos.length) {
      clearInterval(globalTimer);
      status = 'GAME_OVER';
      return;
    }
    startStep1();
  }

  $effect(() => {
    return () => {
      clearInterval(timer);
      clearInterval(globalTimer);
    };
  });
</script>

<GameLayout title="The Silent Flashcard Challenge" subtitle="Adjectives & Noun Phrases / When to use">
  <div class="game-container">
    <header class="status-bar">
      <div class="score">⭐ Score: {score}</div>
      {#if status !== 'IDLE' && status !== 'LOADING' && status !== 'GAME_OVER'}
        <div class="global-timer" class:danger={globalTimeLeft <= 60}>
          ⏳ Total Time: {Math.floor(globalTimeLeft / 60)}:{(globalTimeLeft % 60).toString().padStart(2, '0')}
        </div>
      {/if}
      <div class="hp">❤️ HP: {hp} / 5</div>
    </header>

    {#if status === 'LOADING'}
      <div class="center-content">
        <p>Loading questions...</p>
      </div>
    {:else if status === 'IDLE'}
      <div class="center-content">
        <p>Test your reaction and sentence building skills!</p>
        <p>Are you ready for the challenge?</p>
        <div class="action-wrap">
          <button class="btn-lively" onclick={startGame}>🚀 Start Game</button>
        </div>
      </div>
    {:else if status === 'GAME_OVER'}
      <div class="center-content">
        <h2>Game Over</h2>
        <p>Final Score: {score}</p>
        {#if globalTimeLeft <= 0}
          <p>Time's up for the whole game! ⏳</p>
        {:else}
          <p>Congratulations! You completed all questions! 🎉</p>
        {/if}
        <div class="action-wrap">
          <button class="btn-lively" onclick={startGame}>🔄 Play Again</button>
        </div>
      </div>
    {:else}
      <!-- 遊戲進行中 -->
      <div class="game-board">
        <div class="timer" class:danger={timeLeft <= 5}>
          ⏱️ Time left: {timeLeft}s
        </div>

        {#if status === 'STEP1_PLAYING'}
          <div class="step-card">
            <p class="instruction">Based on the emojis, type the corresponding question from the staff!</p>
            <div class="emoji-display">{currentCombo.step1_emoji}</div>
            <div class="unscramble-area">
              <div class="scrambled-words">
                {#each scrambledWords as sw}
                  <div class="word-block">
                    {sw.word}
                  </div>
                {/each}
              </div>
              <div class="input-area mt-4">
                <!-- svelte-ignore a11y_autofocus -->
                <input 
                  type="text" 
                  bind:value={userInput} 
                  onkeydown={handleKeyDownStep1}
                  placeholder="Type your sentence here..." 
                  autofocus
                />
                <ActionBtn title="Submit" onclick={submitStep1} />
              </div>
            </div>
            {#if feedbackMessage}
              <p class="feedback-msg error">{feedbackMessage}</p>
            {/if}
          </div>
        {/if}

        {#if status === 'STEP2_DRAWING' || status === 'STEP2_PLAYING'}
          <div class="step-card">
            <h3>Step 2: The Draw</h3>
            <p class="instruction">{feedbackMessage}</p>
            
            <div class="cards-container">
              {#each displayOptions as option}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  class="condition-card" 
                  class:selected={selectedStep2Option === option}
                  class:disabled={status === 'STEP2_PLAYING' && selectedStep2Option !== option}
                  onclick={() => selectCard(option)}
                >
                  {option.condition}
                </div>
              {/each}
            </div>

            {#if status === 'STEP2_PLAYING'}
              <div class="unscramble-area mt-4">
                <div class="scrambled-words">
                  {#each scrambledWords as sw}
                    <div class="word-block">
                      {sw.word}
                    </div>
                  {/each}
                </div>
                <div class="input-area mt-4">
                  <!-- svelte-ignore a11y_autofocus -->
                  <input 
                    type="text" 
                    bind:value={userInput} 
                    onkeydown={handleKeyDownStep2}
                    placeholder="Type the complete sentence here..." 
                    autofocus
                  />
                  <ActionBtn title="Submit" onclick={submitStep2} />
                </div>
              </div>
            {/if}
          </div>
        {/if}

        {#if status === 'COMBO_SUCCESS' || status === 'COMBO_FAIL'}
          <div class="result-card" class:success={status === 'COMBO_SUCCESS'} class:fail={status === 'COMBO_FAIL'}>
            <h3>{status === 'COMBO_SUCCESS' ? '✅ Correct!' : '❌ Failed!'}</h3>
            <p>{feedbackMessage}</p>
            {#if status === 'COMBO_FAIL'}
              <div class="correct-answers">
                <p><strong>Step 1 Answer:</strong> {currentCombo.step1_expected_input}</p>
                {#if selectedStep2Option}
                  <p><strong>Step 2 Answer:</strong> {selectedStep2Option.expected_output}</p>
                {/if}
              </div>
            {/if}
            <div class="action-wrap mt-4">
              <ActionBtn title={currentComboIndex < combos.length - 1 ? "Next Question" : "View Results"} onclick={nextCombo} />
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</GameLayout>

<style>
  .game-container {
    max-width: 800px;
    margin: 0 auto;
    font-family: sans-serif;
  }
  .status-bar {
    display: flex;
    justify-content: space-between;
    background: #f1f5f9;
    padding: 12px 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 1.2rem;
    font-weight: bold;
  }
  .center-content {
    text-align: center;
    background: #fff;
    padding: 48px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .action-wrap {
    margin-top: 24px;
    display: flex;
    justify-content: center;
  }
  .mt-4 { margin-top: 24px; }
  
  .game-board {
    background: #fff;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .timer {
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 24px;
    color: #333;
  }
  .timer.danger { color: #dc3545; }
  .global-timer.danger { color: #dc3545; }
  
  .step-card {
    text-align: center;
  }
  .emoji-display {
    font-size: 5rem;
    margin: 24px 0;
    letter-spacing: 10px;
  }
  .instruction {
    font-size: 1.2rem;
    color: #555;
    margin-bottom: 24px;
  }
  
  .input-area {
    display: flex;
    gap: 12px;
    justify-content: center;
    max-width: 600px;
    margin: 0 auto;
  }
  .input-area input {
    flex: 1;
    padding: 12px 16px;
    font-size: 1.2rem;
    border: 2px solid #ccc;
    border-radius: 8px;
    outline: none;
  }
  .input-area input:focus {
    border-color: #007bff;
  }
  
  .feedback-msg {
    margin-top: 16px;
    font-weight: bold;
    font-size: 1.1rem;
  }
  .feedback-msg.error { color: #dc3545; }
  
  .cards-container {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 24px;
  }
  .condition-card {
    flex: 1;
    max-width: 200px;
    padding: 24px 16px;
    background: #e2e8f0;
    border: 3px solid transparent;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }
  .condition-card:hover:not(.disabled) {
    background: #cbd5e1;
    transform: translateY(-2px);
  }
  .condition-card.selected {
    background: #cfe2ff;
    border-color: #007bff;
    color: #004085;
  }
  .condition-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .result-card {
    text-align: center;
    padding: 32px;
    border-radius: 12px;
  }
  .result-card.success { background: #d1e7dd; color: #0f5132; }
  .result-card.fail { background: #f8d7da; color: #842029; }
  
  .correct-answers {
    margin-top: 24px;
    background: rgba(255,255,255,0.5);
    padding: 16px;
    border-radius: 8px;
    text-align: left;
  }

  .unscramble-area {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 600px;
    margin: 0 auto;
  }
  .scrambled-words {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }
  .word-block {
    padding: 10px 16px;
    font-size: 1.2rem;
    background: #fff;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    color: #334155;
    box-shadow: 0 2px 0 #cbd5e1;
  }
  
  .btn-lively {
    background: linear-gradient(135deg, #a855f7, #ec4899);
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    padding: 16px 48px;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-lively:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.6);
  }
  .btn-lively:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2px 10px rgba(236, 72, 153, 0.4);
  }
</style>
