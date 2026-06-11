<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { GrammarDataTracker } from '$lib/game-core/GrammarDataTracker';
  import type { GameSessionData } from '$lib/game-core/GrammarDataTracker';
  import {
    loadSouvenirNpcErrors,
    loadSouvenirShopItems,
    type NpcErrorRow,
    type ShopItemRow,
  } from '$lib/game-core/traveler-quest-bank';
  import { renderNpcBlock } from '$lib/utils/traveler-npc-ui';
  import { initNpcSpeech } from '$lib/utils/traveler-npc-speech';
  import {
    playEnterGameSfx,
    playIntroOnStoryScreen,
    playSubmitSfx,
    startTravelerBgm,
    stopAllTravelerAudio,
    TRAVELER_BGM,
  } from '$lib/utils/audio';
  import { user } from '$lib/stores/user.svelte';
  import { gameProgress } from '$lib/stores/gameProgress.svelte';
  import Scoreboard from '$lib/components/game/Scoreboard.svelte';
  import TeacherDashboard from '$lib/components/game/TeacherDashboard.svelte';
  import '$lib/styles/traveler-quest.scss';

  const WH_HUB_RETURN = `${base}/grammar-hub?tab=wh&series=how`;
  const START_BUDGET = 200;
  const ITEMS_TO_BUY = 3;
  const ERRORS_TO_CATCH = 2;

  type ShopItem = ShopItemRow;
  type NpcErrorScene = NpcErrorRow;

  let SHOP_ITEMS: ShopItem[] = [];
  let NPC_ERRORS: NpcErrorScene[] = [];

  const tracker = new GrammarDataTracker('TravelerLevel3');

  let userName = $state('');
  let budget = START_BUDGET;
  let cart: { item: ShopItem; qtyLabel: string; cost: number }[] = [];
  let shopQueue: ShopItem[] = [];
  let currentShopIdx = 0;
  let errorScenes: NpcErrorScene[] = [];
  let currentErrorIdx = 0;
  let errorsCaught = 0;
  let bellRung = false;

  let phaseLabel = $state('Souvenir Shop');
  let budgetDisplay = $state('💰 Budget: $200');
  let sessionData = $state<GameSessionData | null>(null);
  let titleClickCount = $state(0);

  let gameMain: HTMLElement;

  function render(html: string) {
    gameMain.innerHTML = html;
    initNpcSpeech(gameMain);
  }

  function isPluralShopItem(item: ShopItem): boolean {
    return /\bthese\b/i.test(item.display);
  }

  function pluralShopIconCount(item: ShopItem): number {
    return isPluralShopItem(item) ? 3 : 1;
  }

  function renderShopShelfIcons(item: ShopItem): string {
    const count = pluralShopIconCount(item);
    if (count === 1) {
      return `<p class="text-5xl mb-2 leading-none">${item.emoji}</p>`;
    }
    const icons = Array.from({ length: count }, () => `<span>${item.emoji}</span>`).join('');
    return `<div class="shop-shelf-icons flex justify-center items-center gap-2 sm:gap-3 mb-2 text-4xl sm:text-5xl leading-none" aria-hidden="true">${icons}</div>`;
  }

  function shopItemEmojisForBag(item: ShopItem): string {
    return item.emoji.repeat(pluralShopIconCount(item));
  }

  function updateBudgetUI() {
    const spent = cart.reduce((s, c) => s + c.cost, 0);
    budgetDisplay = `💰 Budget: $${budget} (spent $${spent})`;
  }

  function pickShopItems(): ShopItem[] {
    const pool = [...SHOP_ITEMS].sort(() => Math.random() - 0.5);
    const picked: ShopItem[] = [];
    let hasCountable = false;
    let hasUncountable = false;
    for (const item of pool) {
      if (picked.length >= ITEMS_TO_BUY) break;
      if (item.countable && hasCountable && picked.filter((p) => p.countable).length >= 2) continue;
      if (!item.countable && hasUncountable && picked.filter((p) => !p.countable).length >= 1) continue;
      picked.push(item);
      if (item.countable) hasCountable = true;
      else hasUncountable = true;
    }
    while (picked.length < ITEMS_TO_BUY) {
      const rest = pool.find((p) => !picked.includes(p));
      if (rest) picked.push(rest);
      else break;
    }
    if (!picked.some((p) => !p.countable)) {
      const water = SHOP_ITEMS.find((p) => p.id === 'water')!;
      if (!picked.includes(water)) picked[picked.length - 1] = water;
    }
    if (!picked.some((p) => p.countable)) {
      const shirt = SHOP_ITEMS.find((p) => p.id === 'shirt')!;
      if (!picked.includes(shirt)) picked[0] = shirt;
    }
    return picked.slice(0, ITEMS_TO_BUY);
  }

  function validatePriceQuestion(text: string, item: ShopItem): boolean {
    const t = text.trim();
    if (!/\bhow\s+much\b/i.test(t)) return false;
    if (item.countable && /\bthese\b/i.test(item.display)) {
      return /\bhow\s+much\s+are\b/i.test(t) && t.toLowerCase().includes(item.label.toLowerCase());
    }
    return (
      /\bhow\s+much\s+is\b/i.test(t) &&
      (t.toLowerCase().includes(item.label.toLowerCase()) || t.toLowerCase().includes('this'))
    );
  }

  function validateCountableQtyAnswer(text: string): { ok: boolean; qty: number; textLabel?: string } {
    const t = text.trim().toLowerCase();
    const numWords: Record<string, number> = {
      a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    };
    let qty = 0;
    let textLabel = '';
    const digit = t.match(/\b(\d+)\b/);
    if (digit) qty = parseInt(digit[1], 10);
    else if (/\ba\s+few\b/.test(t)) {
      qty = 3;
      textLabel = 'a few';
    } else if (/\bsome\b/.test(t)) {
      qty = 3;
      textLabel = 'some';
    } else if (/\ba\s+lot\b/.test(t) || /\bmany\b/.test(t)) {
      qty = 5;
      textLabel = 'a lot of';
    } else {
      for (const [w, n] of Object.entries(numWords)) {
        if (new RegExp(`\\b${w}\\b`, 'i').test(t)) {
          qty = n;
          break;
        }
      }
    }
    const hasPlease = /\bplease\b/i.test(t) || /,?\s*thanks?/i.test(t);
    return { ok: qty >= 1 && qty <= 10 && (hasPlease || qty > 0), qty, textLabel };
  }

  function validateUncountableQtyAnswer(text: string): boolean {
    const t = text.trim().toLowerCase();
    return (
      /\b(a\s+little|a\s+lot|some|not\s+much|much)\b/.test(t) ||
      /\b(a|one|two|three|four|five|six|seven|eight|nine|ten)\s+(bottle|bottles|cup|cups|bag|bags)\b/.test(t) ||
      /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(t) ||
      /\b\d+\b/.test(t) ||
      /\ba\s+(coffee|water|tea)\b/.test(t)
    );
  }

  function validateCorrection(text: string, scene: NpcErrorScene): boolean {
    const t = text.trim();
    if (scene.correctPatterns.some((p) => p.test(t))) return true;
    const norm = (s: string) => s.replace(/[?.!]/g, '').trim().toLowerCase();
    return norm(t) === norm(scene.correctLine);
  }

  function showIntro() {
    phaseLabel = 'Souvenir Shop';
    budget = START_BUDGET;
    cart = [];
    shopQueue = pickShopItems();
    currentShopIdx = 0;
    updateBudgetUI();

    render(`
      <div class="tech-panel mb-4 w-full">
        <h2 class="text-2xl md:text-3xl font-bold text-amber-300 mb-6 md:mb-8">🛍️ Souvenir Shopping Spree</h2>
        <div class="story-intro-body text-amber-100">
          <p>
            You are on a <strong>shopping mission</strong> in a busy souvenir shop.<br />
            The shopkeeper trusts you with <strong>$${START_BUDGET}</strong> — buy <strong>${ITEMS_TO_BUY} gifts</strong> before the tour bus leaves.
          </p>
          <p>
            Stop at each shelf and ask the price:<br />
            <strong>How much is …? / How much are …?</strong>
          </p>
          <p>
            When you hear the answer, tell the shopkeeper how much you want:<br />
            countable → numbers like <em>Two, please.</em><br />
            uncountable → <em>A little.</em> or <em>A lot.</em>
          </p>
          <p>Do not go over your budget!</p>
          <p class="text-amber-300 font-medium text-lg md:text-xl leading-relaxed">
            Shop wisely, and the owner may hand you the keys to the store…
          </p>
        </div>
        <button id="btn-start" type="button" class="mt-8 md:mt-10 w-full py-4 text-lg bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] action-btn-pulse">
          Enter the shop
        </button>
      </div>
    `);
    playIntroOnStoryScreen();
    document.getElementById('btn-start')!.addEventListener('click', () => {
      playEnterGameSfx();
      startTravelerBgm(TRAVELER_BGM.shopBackground);
      showShopAskPrice();
    });
  }

  function showShopAskPrice() {
    const item = shopQueue[currentShopIdx];
    phaseLabel = `Shopping ${currentShopIdx + 1}/${ITEMS_TO_BUY}`;

    render(`
      <div class="tech-panel mb-4 text-center">
        ${renderShopShelfIcons(item)}
        <p class="font-bold text-amber-300 text-lg mt-2">${item.label}</p>
      </div>
      <div class="tech-panel mb-4">
        ${renderNpcBlock({ id: 'shopkeeper', line: 'Welcome! Ask me about the price.', className: 'mb-4' })}
        <input id="price-q" type="text" class="w-full border-2 border-amber-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-amber-400 outline-none placeholder:text-amber-200/50" placeholder="How much is/are …?" />
        <p id="price-fb" class="text-sm mt-2 min-h-[1.25rem]"></p>
        <button id="btn-price" type="button" class="mt-4 w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] action-btn-pulse">Submit question</button>
      </div>
      <div class="mt-4 text-sm text-amber-200">
        Bag: ${cart.length ? cart.map((c) => `${shopItemEmojisForBag(c.item)} ${c.qtyLabel}`).join(' · ') : '(empty)'}
      </div>
    `);

    document.getElementById('btn-price')!.addEventListener('click', () => {
      const fb = document.getElementById('price-fb')!;
      const val = (document.getElementById('price-q') as HTMLInputElement).value;
      if (!val.trim()) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = 'Please enter a question.';
        return;
      }
      playSubmitSfx();
      if (!validatePriceQuestion(val, item)) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = `Use How much to ask the price and mention ${item.label}. e.g. ${item.priceDemo}`;
        return;
      }
      fb.className = 'text-green-600 text-sm mt-2';
      fb.textContent = '✓ Good question!';
      setTimeout(() => showShopNpcPrice(item), 600);
    });
  }

  function showShopNpcPrice(item: ShopItem) {
    const priceText =
      item.countable && /\bthese\b/i.test(item.display)
        ? `They're $${item.unitPrice} each.`
        : `It's $${item.unitPrice}.`;

    render(`
      <div class="tech-panel mb-4">
        ${renderNpcBlock({
          id: 'shopkeeper',
          line: priceText,
          subline: item.countable ? `How many ${item.label} do you want?` : `How much ${item.label} do you need?`,
          className: 'mb-4',
        })}
        <p class="text-sm text-sky-200 italic mb-2">
          ${item.countable ? 'e.g. Three, please.' : 'e.g. A little. / A lot.'}
        </p>
        <input id="qty-a" type="text" class="w-full border-2 border-sky-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 focus:border-sky-400 outline-none placeholder:text-sky-200/50" placeholder="Your answer..." />
        <p id="qty-fb" class="text-sm mt-2"></p>
        <button id="btn-qty" type="button" class="mt-4 w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] action-btn-pulse">Submit quantity</button>
      </div>
    `);

    document.getElementById('btn-qty')!.addEventListener('click', () => {
      const fb = document.getElementById('qty-fb')!;
      const val = (document.getElementById('qty-a') as HTMLInputElement).value;
      if (!val.trim()) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = 'Please enter your answer.';
        return;
      }
      playSubmitSfx();
      let cost = item.unitPrice;
      let qtyLabel = '';

      if (item.countable) {
        const { ok, qty, textLabel } = validateCountableQtyAnswer(val);
        if (!ok) {
          fb.className = 'text-red-600 text-sm mt-2';
          fb.textContent = 'Answer with a number or quantity, e.g. Two, please. / A few.';
          return;
        }
        cost = item.unitPrice * qty;
        qtyLabel = textLabel ? `${textLabel} ${item.label}` : `${qty} ${item.label}`;
      } else {
        if (!validateUncountableQtyAnswer(val)) {
          fb.className = 'text-red-600 text-sm mt-2';
          fb.textContent = 'For uncountable nouns, answer: A little. / A lot. / Some …';
          return;
        }
        qtyLabel = val.trim();
        if (/\ba\s+lot\b/i.test(val)) cost = item.unitPrice * 2;
        else if (/\b(two|2)\b/i.test(val)) cost = item.unitPrice * 2;
        else if (/\b(three|3)\b/i.test(val)) cost = item.unitPrice * 3;
        else if (/\b(four|4)\b/i.test(val)) cost = item.unitPrice * 4;
        else if (/\b(five|5)\b/i.test(val)) cost = item.unitPrice * 5;
        else if (/\b(six|6)\b/i.test(val)) cost = item.unitPrice * 6;
        else if (/\b(seven|7)\b/i.test(val)) cost = item.unitPrice * 7;
        else if (/\b(eight|8)\b/i.test(val)) cost = item.unitPrice * 8;
        else if (/\b(nine|9)\b/i.test(val)) cost = item.unitPrice * 9;
        else if (/\b(ten|10)\b/i.test(val)) cost = item.unitPrice * 10;
        else if (/\b(a|one|1)\b/i.test(val)) cost = item.unitPrice * 1;
      }

      const spent = cart.reduce((s, c) => s + c.cost, 0);
      if (spent + cost > budget) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = `Over budget! You only have $${budget - spent} left — try a smaller amount.`;
        return;
      }

      cart.push({ item, qtyLabel, cost });
      updateBudgetUI();
      fb.className = 'text-green-600 text-sm mt-2';
      fb.textContent = `✓ Sold! Cost: $${cost}`;

      currentShopIdx++;
      setTimeout(() => {
        if (currentShopIdx >= ITEMS_TO_BUY) showPartBIntro();
        else showShopAskPrice();
      }, 1000);
    });
  }

  function showPartBIntro() {
    phaseLabel = 'Catch the Errors';
    errorScenes = [...NPC_ERRORS].sort(() => Math.random() - 0.5).slice(0, ERRORS_TO_CATCH);
    currentErrorIdx = 0;
    errorsCaught = 0;

    render(`
      <div class="tech-panel mb-4 w-full">
        <h2 class="text-2xl md:text-3xl font-bold text-red-700 mb-6 md:mb-8">🏪 The Shop Is Yours</h2>
        <div class="story-intro-body text-red-100">
          <p>
            Your bags are full and you stayed within budget.<br />
            The shopkeeper smiles:<br />
            <em>&ldquo;You did great — from now on, this shop is yours.&rdquo;</em>
          </p>
          <p>
            A rude tourist barges in, mixing up <strong>How much</strong> and <strong>How many</strong>.<br />
            Listen closely.
          </p>
          <p>
            When you hear a mistake, press <strong>🔔 STOP</strong><br />
            and answer with the correct English.
          </p>
          <p class="text-red-300 font-medium text-lg md:text-xl leading-relaxed">
            Help <strong>${ERRORS_TO_CATCH}</strong> customers and prove you are the shopkeeper the town needed.
          </p>
        </div>
        <p class="mt-6 md:mt-8 text-base text-amber-200/80 leading-relaxed">Purchased: ${cart.map((c) => shopItemEmojisForBag(c.item)).join(' ')} · Remaining budget $${budget - cart.reduce((s, c) => s + c.cost, 0)}</p>
        <button id="btn-part-b" type="button" class="mt-8 md:mt-10 w-full py-4 text-lg bg-red-600 text-white font-bold rounded-xl">
          Open the shop door
        </button>
      </div>
    `);
    document.getElementById('btn-part-b')!.addEventListener('click', showErrorRound);
  }

  function showErrorRound() {
    const scene = errorScenes[currentErrorIdx];
    bellRung = false;
    phaseLabel = `Catch errors ${currentErrorIdx + 1}/${ERRORS_TO_CATCH}`;

    render(`
      <div class="tech-panel mb-4">
        <p class="text-sm text-sky-200 mb-2">${scene.context}</p>
        ${renderNpcBlock({
          id: 'customer',
          line: scene.wrongLine,
          subline: 'Press the bell when you hear a mistake!',
          className: 'mb-4',
        })}
        <button id="btn-bell" type="button" class="bell-btn w-full py-4 mb-4 bg-red-500 text-white text-xl font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)] action-btn-pulse">
          🔔 STOP!
        </button>
        <div id="correct-area" class="opacity-50 pointer-events-none">
          <p class="font-bold text-sky-100 mb-2">Correct the customer (ring the bell first):</p>
          <p class="text-sm text-sky-200/70 mb-2">e.g. ${scene.hint}</p>
          <input id="correction" type="text" class="w-full border-2 border-red-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 focus:border-red-400 outline-none placeholder:text-red-200/50" placeholder="How much water do you need?" />
          <p id="corr-fb" class="text-sm mt-2"></p>
          <button id="btn-correct" type="button" class="mt-4 w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] action-btn-pulse">Submit correction</button>
        </div>
      </div>
    `);

    const bell = document.getElementById('btn-bell')!;
    const area = document.getElementById('correct-area')!;

    bell.addEventListener('click', () => {
      bellRung = true;
      bell.classList.add('rung');
      bell.textContent = '🔔 Bell rung!';
      area.classList.remove('opacity-50', 'pointer-events-none');
    });

    document.getElementById('btn-correct')!.addEventListener('click', () => {
      const fb = document.getElementById('corr-fb')!;
      if (!bellRung) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = 'Press 🔔 STOP first to catch the error!';
        return;
      }
      const val = (document.getElementById('correction') as HTMLInputElement).value;
      if (!val.trim()) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = 'Please enter your correction.';
        return;
      }
      playSubmitSfx();
      if (!validateCorrection(val, scene)) {
        fb.className = 'text-red-600 text-sm mt-2';
        fb.textContent = `Correct it to: ${scene.correctLine}`;
        return;
      }
      errorsCaught++;
      fb.className = 'text-green-600 text-sm mt-2';
      fb.textContent = `✓ Caught it! Correct: ${scene.correctLine}`;

      currentErrorIdx++;
      setTimeout(() => {
        if (currentErrorIdx >= ERRORS_TO_CATCH) finishLevel();
        else showErrorRound();
      }, 1200);
    });
  }

  function finishLevel() {
    gameProgress.complete('traveler_quest_level3_complete');
    const spent = cart.reduce((s, c) => s + c.cost, 0);
    render(`
      <div class="tech-panel mb-4 text-center">
        <p class="text-5xl mb-4 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🎉</p>
        <h2 class="text-2xl font-bold text-amber-300 mb-2">Level 3 complete!</h2>
        <p class="text-amber-200/80 mb-2">Bought all ${ITEMS_TO_BUY} souvenirs (spent $${spent})</p>
        <p class="text-amber-200/80 mb-4">Caught ${errorsCaught} grammar mistakes!</p>
        <p class="text-amber-400 font-bold">🏆 Super Traveler Challenge · All 3 levels cleared!</p>
        <button id="btn-finish" type="button" class="mt-6 px-8 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] action-btn-pulse">View score</button>
      </div>
    `);
    document.getElementById('btn-finish')!.addEventListener('click', () => {
      stopAllTravelerAudio();
      const data = tracker.endGame('completed', ITEMS_TO_BUY + ERRORS_TO_CATCH, ITEMS_TO_BUY + ERRORS_TO_CATCH, 3);
      if (data) sessionData = data;
    });
  }

  function restart() {
    sessionData = null;
    tracker.startGame();
    showIntro();
  }

  function goHome() {
    stopAllTravelerAudio();
    void goto(WH_HUB_RETURN);
  }

  onMount(() => {
    user.init();
    gameProgress.init();
    if (!user.current) {
      alert('Please log in at the Grammar Hub first!');
      void goto(WH_HUB_RETURN);
      return;
    }
    userName = user.current;
    tracker.setUserName(userName);
    tracker.setUnitName('WHQA-Traveler-Level3-Souvenir');
    tracker.startGame();

    const beforeUnload = () => stopAllTravelerAudio();
    window.addEventListener('beforeunload', beforeUnload);

    void (async () => {
      SHOP_ITEMS = await loadSouvenirShopItems();
      NPC_ERRORS = await loadSouvenirNpcErrors();
      showIntro();
    })();

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      stopAllTravelerAudio();
    };
  });
</script>

<svelte:head>
  <title>Level 3: Souvenir Shopping Spree</title>
</svelte:head>

<div class="tq-root font-sans">
  <header class="bg-slate-800 shadow-lg p-4 flex justify-between items-center flex-wrap gap-2 border-b border-amber-500/30 relative z-10">
    <div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <h1 class="text-xl md:text-2xl font-bold text-amber-400 cursor-pointer select-none" onclick={() => titleClickCount++}>
        🛍️ Level 3: Souvenir Shopping Spree
      </h1>
      <p class="text-amber-200/70 text-sm">{phaseLabel}</p>
    </div>
    <div class="flex items-center gap-3 flex-wrap">
      <div class="budget-bar px-3 py-1 bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-lg text-sm">
        {budgetDisplay}
      </div>
      <a href={WH_HUB_RETURN} onclick={() => stopAllTravelerAudio()} class="px-4 py-2 bg-slate-700 text-amber-100 rounded-xl hover:bg-slate-600 border border-amber-500/30 font-bold text-sm transition-colors">
        🏠 Home
      </a>
    </div>
  </header>

  <main bind:this={gameMain} class="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full relative z-10"></main>
</div>

<Scoreboard {sessionData} {userName} onRestart={restart} onHome={goHome} />
<TeacherDashboard bind:triggerCount={titleClickCount} />
