<script lang="ts">
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/game/GameLayout.svelte';
  import ActionBtn from '$lib/components/ui/ActionBtn.svelte';
  import { parseCSVRows } from '$lib/utils/csv-parser';
  import type { GameState, RestaurantScenario } from '$lib/game-core/restaurant-survival-types';

  let scenarios = $state<RestaurantScenario[]>([]);
  let gameState = $state<GameState>('idle');
  let currentScenario = $state<RestaurantScenario | null>(null);
  
  let userInput = $state('');
  let feedbackMessage = $state('');
  let hp = $state(3);
  let showTabooWarning = $state(false);

  // For seating and zoom
  let isMenuZoomed = $state(false);
  let partySize = $state(1);
  let reservationName = $state('');
  const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  // 1. 預留空間給未來 AI 語音對話 (Speech-to-Text + LLM)
  let isListening = $state(false);

  // 2. 預留老師端控制空間 (目前僅為學生端視角，可切換為 true 來觀看答案提示)
  let isTeacherView = $state(false);

  let currentOrderStep = $state(0);
  let currentCheckoutStep = $state(0);
  
  let currentRound = $state(1);
  let selectedMCQOption = $state<string | null>(null);

  // Helper for current expected answer string
  let currentExpectedAnswerStr = $derived.by(() => {
    if (!currentScenario) return '';
    if (gameState === 'seating') {
      if (['Chipotle', 'Shake Shack', 'Pret A Manger'].includes(currentScenario.restaurant)) {
        if (diningPreference === 'For here') {
          return "For here, please.|To go, thanks. [WRONG]|I have a reservation. [WRONG]";
        } else {
          return "To go, thanks.|For here, please. [WRONG]|I have a reservation. [WRONG]";
        }
      } else if (currentScenario.restaurant === 'In-N-Out Burger') {
        if (diningPreference === 'For here') {
          return "For here, thanks.|In the car, please. [WRONG]|I have a reservation. [WRONG]";
        } else {
          return "In the car, please.|For here, thanks. [WRONG]|I have a reservation. [WRONG]";
        }
      } else {
        return "I have a reservation..."; // Fallback for Olive Garden
      }
    } else if (gameState === 'ordering') {
      return currentScenario.order_a[currentOrderStep] || '';
    } else if (gameState === 'crisis_triggered' || gameState === 'resolving') {
      return currentScenario.crisis_a || '';
    } else if (gameState === 'calling_waiter') {
      return "Excuse me!"; // Generic
    } else if (gameState === 'checkout') {
      return currentScenario.checkout_a[currentCheckoutStep] || '';
    }
    return '';
  });

  let diningPreference = $state('');

  // Load scenarios from CSV
  $effect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${base}/content/grammar/ordering_conversation_adj_n/Game_Ordering_Advanced.csv`);
        const text = await res.text();
        const rows = parseCSVRows(text);
        
        const loaded: RestaurantScenario[] = [];
        // Skip header
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 27) continue;
          
          const order_q = [];
          const order_a = [];
          for (let j = 5; j <= 19; j += 2) {
            if (row[j] && row[j].trim() !== '') {
              order_q.push(row[j]);
              order_a.push(row[j+1]);
            }
          }
          const checkout_q = [];
          const checkout_a = [];
          if (row[23] && row[23].trim() !== '') { checkout_q.push(row[23]); checkout_a.push(row[24]); }
          if (row[25] && row[25].trim() !== '') { checkout_q.push(row[25]); checkout_a.push(row[26]); }

          loaded.push({
            id: row[0],
            restaurant: row[1],
            condition_en: row[2],
            crisis_en: row[3],
            menu_asset_url: row[4],
            order_q,
            order_a,
            crisis_q: row[21],
            crisis_a: row[22],
            checkout_q,
            checkout_a
          });
        }
        scenarios = loaded;
      } catch (e) {
        console.error('Failed to load scenarios', e);
      }
    }
    loadData();
  });

  function startSpin() {
    if (scenarios.length === 0) return;
    gameState = 'spinning';
    
    // Simulate spinning delay
    setTimeout(() => {
      let possibleRestaurants: string[] = [];
      if (currentRound === 1) {
        possibleRestaurants = ['In-N-Out Burger', 'Chipotle'];
      } else if (currentRound === 2) {
        possibleRestaurants = ['Pret A Manger', 'Shake Shack'];
      } else {
        possibleRestaurants = ['Olive Garden'];
      }
      
      const roundScenarios = scenarios.filter(s => possibleRestaurants.includes(s.restaurant));
      const randomIndex = Math.floor(Math.random() * roundScenarios.length);
      currentScenario = roundScenarios[randomIndex];
      
      partySize = Math.floor(Math.random() * 4) + 1;
      reservationName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      diningPreference = Math.random() > 0.5 ? 'For here' : (currentScenario.restaurant === 'In-N-Out Burger' ? 'In the car' : 'To go');
      gameState = 'scenario_assigned';
    }, 2000);
  }

  function beginOrdering() {
    gameState = 'seating';
    userInput = '';
    feedbackMessage = '';
    showTabooWarning = false;
    currentOrderStep = 0;
    currentCheckoutStep = 0;
    selectedMCQOption = null;
  }

  function handleMCQSelect(opt: string) {
    if (opt.includes('[WRONG]')) {
      feedbackMessage = '🚨 This option does not match your Persona/Condition! Try again.';
      hp = Math.max(0, hp - 1);
      return;
    }
    selectedMCQOption = opt.replace(' [WRONG]', '');
    feedbackMessage = ''; // clear error
  }

  function normalizeText(text: string) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  }
  
  function validateTyping() {
    if (currentExpectedAnswerStr.includes('|') && selectedMCQOption) {
      if (normalizeText(userInput) !== normalizeText(selectedMCQOption)) {
        feedbackMessage = '🚨 Please type the sentence exactly as shown in your selected option.';
        return false;
      }
    }
    return true;
  }

  function handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    userInput = val;
    // 7. 只要回答有 want 就會有警示 (不串接 Speech API)
    if (/\bwant\b/i.test(val)) {
      showTabooWarning = true;
    } else {
      showTabooWarning = false;
    }
  }

  function submitSeating() {
    if (showTabooWarning) {
      let hint = 'I have a reservation...';
      if (['Chipotle', 'Shake Shack', 'Pret A Manger'].includes(currentScenario?.restaurant || '')) {
        hint = 'For here, please...';
      } else if (currentScenario?.restaurant === 'In-N-Out Burger') {
        hint = 'In the car, please...';
      }
      feedbackMessage = `🚨 Taboo word triggered! Please rephrase (Hint: ${hint})`;
      hp = Math.max(0, hp - 1);
      return;
    }
    if (!userInput.trim() || !validateTyping()) return;
    
    feedbackMessage = '✅ Host is leading you to your table...';
    
    setTimeout(() => {
      gameState = 'ordering';
      userInput = '';
      feedbackMessage = '';
      selectedMCQOption = null;
    }, 2000);
  }

  function submitOrder() {
    if (showTabooWarning) {
      feedbackMessage = '🚨 Taboo word triggered! Please rephrase.';
      hp = Math.max(0, hp - 1);
      return;
    }
    if (!userInput.trim() || !validateTyping()) return;
    
    feedbackMessage = '✅ Response sent... (Waiting for the teacher to reply)';
    
    setTimeout(() => {
      if (!currentScenario) return;
      currentOrderStep++;
      userInput = '';
      feedbackMessage = '';
      selectedMCQOption = null;
      if (currentOrderStep >= currentScenario.order_q.length) {
        gameState = 'crisis_triggered';
      }
    }, 2500);
  }

  function submitComplaint() {
    if (showTabooWarning) {
      feedbackMessage = '🚨 Taboo word triggered! Please rephrase (Hint: Excuse me, I ordered...)';
      hp = Math.max(0, hp - 1);
      return;
    }
    if (!userInput.trim() || !validateTyping()) return;

    feedbackMessage = '✅ Crisis resolved... (Meal finished, time to pay)';
    setTimeout(() => {
      gameState = 'calling_waiter';
      userInput = '';
      feedbackMessage = '';
      selectedMCQOption = null;
    }, 2500);
  }

  function callWaiter() {
    if (showTabooWarning) {
      feedbackMessage = '🚨 Taboo word triggered! Please rephrase (Hint: Excuse me!)';
      hp = Math.max(0, hp - 1);
      return;
    }
    if (!userInput.trim() || !validateTyping()) return;

    feedbackMessage = '✅ Calling the waiter...';
    setTimeout(() => {
      gameState = 'checkout';
      userInput = '';
      feedbackMessage = '';
      selectedMCQOption = null;
    }, 1500);
  }

  function submitCheckout() {
    if (showTabooWarning) {
      feedbackMessage = '🚨 Taboo word triggered! Please rephrase.';
      hp = Math.max(0, hp - 1);
      return;
    }
    if (!userInput.trim() || !validateTyping()) return;

    feedbackMessage = '✅ Response sent...';
    setTimeout(() => {
      if (!currentScenario) return;
      currentCheckoutStep++;
      userInput = '';
      feedbackMessage = '';
      selectedMCQOption = null;
      if (currentCheckoutStep >= currentScenario.checkout_q.length) {
        gameState = 'success';
      }
    }, 2500);
  }

  function nextRound() {
    currentRound++;
    gameState = 'idle';
    currentScenario = null;
    hp = 3;
    userInput = '';
    feedbackMessage = '';
    showTabooWarning = false;
  }

  function restart() {
    currentRound = 1;
    gameState = 'idle';
    currentScenario = null;
    hp = 3;
    userInput = '';
    feedbackMessage = '';
    showTabooWarning = false;
  }

</script>

<GameLayout title="🍽️ Restaurant Survival" subtitle="Advanced Challenge">
  <div class="game-wrapper">
    <!-- 頂部資訊列：營造遊戲感 -->
    <header class="game-header">
      <div class="header-left">
        <div class="hp-container">
          {#each Array(3) as _, i}
            <span class="heart" class:lost={i >= hp}>❤️</span>
          {/each}
        </div>
        <div class="round-badge">Round {currentRound}/3</div>
      </div>
      <div class="header-right">
        <div class="taboo-badge" class:active={showTabooWarning}>
          🚫 Taboo: WANT
        </div>
      </div>
    </header>

    {#if isTeacherView}
      <!-- 2. 預留老師端空間 -->
      <div class="teacher-panel-placeholder">
        <p>👨‍🏫 Teacher Panel (In Development): View student conditions, trigger crisis, deduct HP.</p>
        {#if currentScenario}
          <div style="text-align:left; background:white; padding:16px; border-radius:8px; margin-top:8px; color:#334155;">
            <h4 style="font-weight:bold; border-bottom:1px solid #e2e8f0; margin-bottom:8px;">Expected Answers for Teacher Reference:</h4>
            {#if gameState === 'ordering'}
              <p><strong>NPC:</strong> {currentScenario.order_q[currentOrderStep]}</p>
              <p><strong>Expected Student:</strong> {currentScenario.order_a[currentOrderStep]}</p>
            {:else if gameState === 'crisis_triggered' || gameState === 'resolving'}
              <p><strong>NPC (Crisis):</strong> {currentScenario.crisis_q}</p>
              <p><strong>Expected Student:</strong> {currentScenario.crisis_a}</p>
            {:else if gameState === 'checkout'}
              <p><strong>NPC:</strong> {currentScenario.checkout_q[currentCheckoutStep]}</p>
              <p><strong>Expected Student:</strong> {currentScenario.checkout_a[currentCheckoutStep]}</p>
            {:else}
              <p>Waiting for relevant game phase...</p>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <div class="main-content">
      {#if gameState === 'idle'}
        <div class="immersion-box intro-box">
          <div class="icon-large">🍽️</div>
          <h2>Ultimate Restaurant Survival</h2>
          <p class="desc">
            Survive 3 rounds of restaurant orders with special personas!<br/>
            Please order from the teacher and be ready for unexpected situations.<br/>
            <strong>Remember: NEVER say the word "want".</strong>
          </p>
          <div class="action-wrap">
            <button class="lively-btn spin-btn" onclick={startSpin}>
              <span class="btn-icon">🎲</span>
              <span class="btn-text">Spin the Wheel of Destiny</span>
            </button>
          </div>
        </div>
      {/if}

      {#if gameState === 'spinning'}
        <div class="immersion-box spinning-box">
          <div class="spinner">🎡</div>
          <h2>Spinning the Wheel of Destiny...</h2>
          <p>Drawing your restaurant and special conditions...</p>
        </div>
      {/if}

      {#if gameState === 'scenario_assigned' && currentScenario}
        <div class="immersion-box mission-box">
          <div class="mission-header">
            <span class="badge">MISSION</span>
            <h2>Your Persona</h2>
          </div>
          <div class="mission-details">
            <div class="detail-card restaurant">
              <span class="label">📍 Location</span>
              <span class="value">{currentScenario.restaurant}</span>
            </div>
            {#if ['Chipotle', 'Shake Shack', 'Pret A Manger', 'In-N-Out Burger'].includes(currentScenario.restaurant)}
              <div class="detail-card">
                <span class="label">🛍️ Dining Preference</span>
                <span class="value text-blue-600">{diningPreference}</span>
              </div>
            {:else}
              <div class="detail-card">
                <span class="label">📅 Reservation</span>
                <span class="value text-blue-600">{reservationName}<br><span style="font-size: 1rem;">Party of {partySize}</span></span>
              </div>
            {/if}
            <div class="detail-card condition">
              <span class="label">⚠️ Condition/Constraint</span>
              <span class="value text-purple-600">{currentScenario.condition_en}</span>
            </div>
          </div>
          <div class="action-wrap mt-8">
            <button class="lively-btn enter-btn" onclick={beginOrdering}>
              <span class="btn-icon">🚪</span>
              <span class="btn-text">Enter Restaurant</span>
            </button>
          </div>
        </div>
      {/if}

      {#if ['seating', 'ordering', 'crisis_triggered', 'resolving', 'calling_waiter', 'checkout'].includes(gameState) && currentScenario}
        <!-- 4. 點餐情境化、沉浸感為主 -->
        <div class="restaurant-env">
          <!-- 左側：菜單區 -->
          <div class="menu-side">
            <div class="menu-header">
              <span class="restaurant-name">{currentScenario.restaurant}</span> Menu
            </div>
            <!-- 3. 菜單來源先給假圖片 -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="menu-image-container" onclick={() => isMenuZoomed = true} style="cursor: zoom-in;">
              <img src={currentScenario.menu_asset_url.startsWith('http') ? currentScenario.menu_asset_url : base + currentScenario.menu_asset_url} alt="Menu" class="menu-img" />
              <div class="menu-overlay"><span class="zoom-hint">🔍 Click to zoom</span></div>
            </div>
          </div>

          <!-- 右側：互動對話區 -->
          <div class="interaction-side">
            <div class="chat-container">
              <!-- 店員對話 -->
              <div class="chat-message npc">
                <div class="chat-avatar">👨‍🍳</div>
                <div class="chat-bubble">
                  {#if gameState === 'seating'}
                    {#if ['Chipotle', 'Shake Shack', 'Pret A Manger'].includes(currentScenario.restaurant)}
                      Welcome to {currentScenario.restaurant}! For here or to go?
                    {:else if currentScenario.restaurant === 'In-N-Out Burger'}
                      Welcome to {currentScenario.restaurant}! Will you be eating this here or in the car?
                    {:else}
                      Welcome to {currentScenario.restaurant}! Do you have a reservation? How many people in your party?
                    {/if}
                  {:else if gameState === 'ordering'}
                    {currentScenario.order_q[currentOrderStep]}
                  {:else if gameState === 'crisis_triggered' || gameState === 'resolving'}
                    <span class="crisis-text">{currentScenario.crisis_q}</span>
                  {:else if gameState === 'calling_waiter'}
                    <span style="color:#94a3b8; font-style:italic;">(You have finished your meal. Call the waiter/cashier to get the check.)</span>
                  {:else if gameState === 'checkout'}
                    {currentScenario.checkout_q[currentCheckoutStep]}
                  {/if}
                </div>
              </div>

              <!-- 學生輸入區 -->
              <div class="chat-message player">
                <div class="chat-bubble input-bubble" class:has-error={showTabooWarning}>
                  {#if currentExpectedAnswerStr.includes('|') && !selectedMCQOption}
                    <div class="mcq-options">
                      <p class="mcq-hint">Select the best response for your Persona:</p>
                      {#each currentExpectedAnswerStr.split('|') as opt}
                        <button class="mcq-btn" onclick={() => handleMCQSelect(opt)}>
                          {opt.replace(' [WRONG]', '')}
                        </button>
                      {/each}
                    </div>
                  {:else}
                    {#if selectedMCQOption}
                      <div class="typing-target">
                        <span class="typing-hint">Please type this exact sentence:</span><br/>
                        <strong class="target-text">{selectedMCQOption}</strong>
                      </div>
                    {/if}
                    <textarea 
                      value={userInput} 
                      oninput={handleInput}
                      placeholder="Type your English response here..." 
                      rows="3"
                    ></textarea>
                    
                  <div class="input-actions">
                    <!-- 1. 預留語音對話按鈕 -->
                    <button class="voice-btn" disabled title="AI Speech Recognition coming soon">
                      🎤
                    </button>
                    
                    {#if gameState === 'seating'}
                      <button class="send-btn" onclick={submitSeating}>Send</button>
                    {:else if gameState === 'ordering'}
                      <button class="send-btn" onclick={submitOrder}>Send</button>
                    {:else if gameState === 'crisis_triggered' || gameState === 'resolving'}
                      <button class="send-btn alert" onclick={submitComplaint}>Complain</button>
                    {:else if gameState === 'calling_waiter'}
                      <button class="send-btn" onclick={callWaiter}>Call Waiter</button>
                    {:else if gameState === 'checkout'}
                      <button class="send-btn" onclick={submitCheckout}>Send</button>
                    {/if}
                  </div>
                  {/if}
                </div>
                <div class="chat-avatar">👤</div>
              </div>
            </div>

            <!-- 狀態回饋提示 -->
            <div class="feedback-area">
              {#if showTabooWarning}
                <div class="warning-banner pulse">
                  ⚠️ WARNING: Taboo word "want" detected! Please rephrase.
                </div>
              {/if}
              {#if feedbackMessage}
                <div class="info-banner">{feedbackMessage}</div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      {#if gameState === 'success'}
        <div class="immersion-box result-box success">
          <div class="icon-large">🎉</div>
          {#if currentRound < 3}
            <h2>Round {currentRound} Complete!</h2>
            <p>Great job! Ready for the next challenge?</p>
            <div class="action-wrap">
              <button class="lively-btn spin-btn" onclick={nextRound}>
                <span class="btn-icon">➡️</span>
                <span class="btn-text">Next Round</span>
              </button>
            </div>
          {:else}
            <h2>Challenge Complete!</h2>
            <p>You handled all crises perfectly and survived the restaurants! You won the game!</p>
            <div class="action-wrap">
              <button class="lively-btn enter-btn" onclick={restart}>
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Play Again</span>
              </button>
            </div>
          {/if}
        </div>
      {/if}
      
      {#if hp <= 0 && gameState !== 'success'}
        <div class="immersion-box result-box fail">
          <div class="icon-large">💀</div>
          <h2>Challenge Failed</h2>
          <p>HP reached 0. Please try again!</p>
          <div class="action-wrap">
            <button class="lively-btn spin-btn" onclick={restart}>
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Restart Game</span>
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- 圖片放大 Modal -->
    {#if isMenuZoomed && currentScenario}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="zoom-modal" onclick={() => isMenuZoomed = false}>
        <div class="zoom-content" onclick={(e) => e.stopPropagation()}>
          <button class="close-btn" onclick={() => isMenuZoomed = false}>✕</button>
          <img src={currentScenario.menu_asset_url.startsWith('http') ? currentScenario.menu_asset_url : base + currentScenario.menu_asset_url} alt="Menu Zoomed" class="zoomed-img" />
        </div>
      </div>
    {/if}
  </div>
</GameLayout>

<style>
  /* 遊戲容器整體設定 */
  .game-wrapper {
    max-width: 1100px;
    margin: 0 auto;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #334155;
  }

  /* 頂部資訊列 */
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1e293b;
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .hp-container {
    display: flex;
    gap: 4px;
    font-size: 1.25rem;
  }
  .heart.lost {
    filter: grayscale(100%) opacity(0.3);
  }
  .round-badge {
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 99px;
    font-weight: bold;
    font-size: 1rem;
    color: white;
  }
  .taboo-badge {
    background: #7f1d1d;
    padding: 6px 16px;
    border-radius: 99px;
    font-weight: bold;
    font-size: 0.95rem;
    transition: all 0.3s;
  }
  .taboo-badge.active {
    background: #ef4444;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
    transform: scale(1.05);
  }

  /* 老師控制面板佔位 */
  .teacher-panel-placeholder {
    background: #fdf6e3;
    border: 1px dashed #d97706;
    color: #b45309;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 24px;
    text-align: center;
    font-size: 0.9rem;
  }

  /* 通用沉浸式 Box */
  .immersion-box {
    background: white;
    border-radius: 16px;
    padding: 48px 32px;
    text-align: center;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid #f1f5f9;
  }
  .icon-large {
    font-size: 4rem;
    margin-bottom: 16px;
  }
  .immersion-box h2 {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 16px;
    color: #0f172a;
  }
  .intro-box .desc {
    font-size: 1.15rem;
    line-height: 1.6;
    color: #475569;
    max-width: 600px;
    margin: 0 auto;
  }

  /* 輪盤動畫 */
  .spinning-box .spinner {
    font-size: 6rem;
    animation: spin 1s infinite cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 20px;
    display: inline-block;
  }
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  /* 任務指派卡片 */
  .mission-box {
    background: linear-gradient(to bottom, #ffffff, #f8fafc);
  }
  .mission-header .badge {
    background: #2563eb;
    color: white;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 0.85rem;
    font-weight: bold;
    letter-spacing: 1px;
  }
  .mission-details {
    display: flex;
    gap: 24px;
    justify-content: center;
    margin-top: 32px;
  }
  .detail-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    flex: 1;
    max-width: 320px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .detail-card .label {
    font-size: 0.95rem;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }
  .detail-card .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #0f172a;
  }

  /* 點餐情境區 */
  .restaurant-env {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 24px;
    align-items: stretch;
  }
  @media (max-width: 860px) {
    .restaurant-env { grid-template-columns: 1fr; }
  }

  /* 菜單區 */
  .menu-side {
    background: #0f172a;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  }
  .menu-header {
    background: #1e293b;
    color: #cbd5e1;
    padding: 16px;
    text-align: center;
    font-weight: bold;
    font-size: 1.1rem;
    border-bottom: 1px solid #334155;
  }
  .restaurant-name {
    color: #f8fafc;
    font-size: 1.2rem;
  }
  .menu-image-container {
    flex: 1;
    position: relative;
    background: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }
  .menu-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
  }
  .menu-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(15,23,42,0.1), rgba(15,23,42,0.5));
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .menu-image-container:hover .menu-overlay {
    opacity: 1;
  }
  .zoom-hint {
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 99px;
  }

  /* 圖片放大 Modal */
  .zoom-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 24px;
    cursor: zoom-out;
  }
  .zoom-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: white;
    padding: 8px;
    border-radius: 12px;
    cursor: default;
  }
  .zoomed-img {
    max-width: 100%;
    max-height: calc(90vh - 16px);
    object-fit: contain;
    display: block;
    border-radius: 8px;
  }
  .close-btn {
    position: absolute;
    top: -16px;
    right: -16px;
    width: 40px;
    height: 40px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .close-btn:hover {
    background: #dc2626;
  }

  /* 互動區 */
  .interaction-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .chat-container {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .chat-message {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .chat-message.player {
    justify-content: flex-end;
  }
  .chat-avatar {
    font-size: 2.2rem;
    background: #f1f5f9;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    flex-shrink: 0;
  }
  .chat-bubble {
    background: #f8fafc;
    padding: 16px 20px;
    border-radius: 20px;
    border-top-left-radius: 4px;
    font-size: 1.15rem;
    color: #334155;
    max-width: 85%;
    border: 1px solid #e2e8f0;
    line-height: 1.5;
  }
  .crisis-text {
    color: #b91c1c;
    font-weight: 600;
  }
  
  .chat-message.player .chat-bubble {
    border-radius: 20px;
    border-top-right-radius: 4px;
    background: #eff6ff;
    border-color: #bfdbfe;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .input-bubble textarea {
    width: 100%;
    border: none;
    background: transparent;
    padding: 16px 20px;
    font-size: 1.15rem;
    resize: none;
    outline: none;
    color: #1e3a8a;
  }
  .input-bubble textarea::placeholder {
    color: #94a3b8;
  }
  .input-bubble.has-error {
    background: #fef2f2;
    border-color: #fca5a5;
  }
  .input-bubble.has-error textarea {
    color: #991b1b;
  }

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: rgba(255,255,255,0.5);
    border-top: 1px solid #bfdbfe;
  }
  .input-bubble.has-error .input-actions {
    border-top-color: #fecaca;
  }
  
  /* MCQ Options */
  .mcq-options {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .mcq-hint {
    font-size: 0.95rem;
    color: #64748b;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .mcq-btn {
    background: white;
    border: 2px solid #e2e8f0;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 1.1rem;
    color: #334155;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    -webkit-user-select: none;
  }
  .mcq-btn:hover {
    border-color: #3b82f6;
    background: #f0fdf4; /* A light green hint */
    transform: translateY(-2px);
  }
  .typing-target {
    padding: 16px 20px;
    background: #e0f2fe;
    border-bottom: 1px solid #bfdbfe;
    color: #1e3a8a;
    user-select: none;
    -webkit-user-select: none;
  }
  .typing-hint {
    font-size: 0.9rem;
    color: #3b82f6;
    font-weight: 600;
  }
  .target-text {
    font-size: 1.15rem;
  }

  .voice-btn {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: not-allowed;
    opacity: 0.5;
    padding: 4px;
    border-radius: 50%;
  }
  .send-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 99px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .send-btn:hover {
    background: #2563eb;
  }
  .send-btn.alert {
    background: #ef4444;
  }
  .send-btn.alert:hover {
    background: #dc2626;
  }

  /* 回饋區 */
  .feedback-area {
    min-height: 50px;
  }
  .warning-banner {
    background: #fee2e2;
    color: #b91c1c;
    padding: 12px 20px;
    border-radius: 8px;
    border-left: 4px solid #ef4444;
    font-weight: bold;
  }
  .info-banner {
    background: #fef3c7;
    color: #b45309;
    padding: 12px 20px;
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
    font-weight: bold;
  }
  .pulse {
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  /* 結算畫面 */
  .result-box.success {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  .result-box.success h2 { color: #166534; }
  
  .result-box.fail {
    background: #fef2f2;
    border-color: #fecaca;
  }
  .result-box.fail h2 { color: #991b1b; }

  .action-wrap {
    margin-top: 32px;
    display: flex;
    justify-content: center;
  }
  .mt-8 { margin-top: 32px; }

  /* 活潑的按鈕樣式 */
  .lively-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    border: none;
    border-radius: 99px;
    font-size: 1.25rem;
    font-weight: 800;
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .lively-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: all 0.5s;
  }
  
  .lively-btn:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.3);
  }
  
  .lively-btn:hover::after {
    left: 100%;
  }
  
  .lively-btn:active {
    transform: translateY(2px) scale(0.98);
    box-shadow: 0 5px 10px -5px rgba(0, 0, 0, 0.2);
  }

  .btn-icon {
    font-size: 1.5rem;
  }

  .spin-btn {
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite, float-btn 3s ease-in-out infinite;
  }

  .enter-btn {
    background: linear-gradient(135deg, #10b981, #059669, #3b82f6);
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite, pulse-btn 2s infinite;
  }

  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes float-btn {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes pulse-btn {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
</style>
