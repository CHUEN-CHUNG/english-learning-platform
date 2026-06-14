<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.svelte';
  import { gameProgress } from '$lib/stores/gameProgress.svelte';
  import LoginModal from '$lib/components/game/LoginModal.svelte';
  import GrammarStepper from '$lib/components/grammar/GrammarStepper.svelte';

  type Tab = 'tenses' | 'wh' | 'adj-np' | 'adv-conj';
  type WhSeries = 'picker' | 'how' | 'when';

  let activeTab = $derived<Tab>(($page.url.searchParams.get('tab') as Tab) ?? 'tenses');
  let whSeries = $derived<WhSeries>(
    activeTab === 'wh'
      ? (($page.url.searchParams.get('series') as WhSeries) ?? 'picker')
      : 'picker'
  );

  // Quest completion
  let flags = $derived(gameProgress.flags);

  let l1Done = $derived(flags['traveler_quest_level1_complete']);
  let l2Done = $derived(
    flags['traveler_quest_level2_complete'] ||
    flags['traveler_quest_how_often_complete'] ||
    flags['traveler_quest_how_long_complete']
  );
  let l3Done = $derived(flags['traveler_quest_level3_complete']);
  let allTravelerDone = $derived(l1Done && l2Done && l3Done);
  let tcL1Done = $derived(flags['time_cop_level1_complete']);

  // Time Cop iframe
  let tcShellVisible = $state(false);
  let tcFrameSrc = $state('');
  let bgm: HTMLAudioElement | null = null;
  let bgmUrl = '';

  const TC_BGM: Record<string, string> = {
    mission1: `${base}/audio/time-cop/game1.mp3`,
    mission2: `${base}/audio/time-cop/game2.mp3`,
    mission3: `${base}/audio/time-cop/game3.mp3`,
    victory:  `${base}/audio/time-cop/final.mp3`,
  };

  const tensesReturnUrl = encodeURIComponent(`${base}/grammar-hub?tab=tenses`);
  const howReturnUrl = encodeURIComponent(`${base}/grammar-hub?tab=wh&series=how`);

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

  function openTimeCop() {
    tcFrameSrc = `${base}/games/time-cop/game`;
    tcShellVisible = true;
    document.body.style.overflow = 'hidden';
    setBgm('mission1');
  }

  function closeTimeCop() {
    stopBgm();
    tcFrameSrc = '';
    tcShellVisible = false;
    document.body.style.overflow = '';
    gameProgress.init();
  }

  function switchTab(tab: Tab) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    url.searchParams.delete('series');
    goto(url.pathname + url.search, { replaceState: true });
  }

  function showWhSeries(series: 'how' | 'when') {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'wh');
    url.searchParams.set('series', series);
    goto(url.pathname + url.search, { replaceState: true });
  }

  function showWhSeriesPicker() {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'wh');
    url.searchParams.delete('series');
    goto(url.pathname + url.search, { replaceState: true });
  }

  onMount(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'grammar:time-cop-close') { closeTimeCop(); return; }
      if (e.data?.type === 'timecop-bgm') { setBgm(e.data.track); return; }
      if (e.data?.type === 'timecop-bgm-stop') { stopBgm(); return; }
    };
    window.addEventListener('message', handleMessage);
    window.addEventListener('focus', () => gameProgress.init());
    return () => {
      window.removeEventListener('message', handleMessage);
      stopBgm();
    };
  });
</script>

<svelte:head>
  <title>文法大廳 - 英語學習平台</title>
</svelte:head>

<LoginModal hubName="文法大廳" onLogin={() => {}} />

<div class="theme-grammar">
  <div class="header">
    <h1>🏰 文法大廳 (Grammar Hub)</h1>
    <div style="display: flex; align-items: center; gap: 20px;">
      {#if user.current}
        <div class="user-profile">
          <span class="user-name-display">👤 {user.current}</span>
          <button class="logout-btn" onclick={() => { if(confirm('確定要登出嗎？')) user.logout(); }}>登出</button>
        </div>
      {/if}
      <a href="{base}/" class="back-btn">← 回首頁</a>
    </div>
  </div>

  <div class="container">
    <!-- Tabs -->
    <div class="level-tabs">
      <button type="button" class="level-tab" class:active={activeTab === 'tenses'} onclick={() => switchTab('tenses')}>Time Tenses</button>
      <button type="button" class="level-tab" class:active={activeTab === 'wh'} onclick={() => switchTab('wh')}>Wh- Questions</button>
      <button type="button" class="level-tab" class:active={activeTab === 'adj-np'} onclick={() => switchTab('adj-np')}>Adjectives &amp; Noun Phrases</button>
      <button type="button" class="level-tab" class:active={activeTab === 'adv-conj'} onclick={() => switchTab('adv-conj')}>Adverbs &amp; Conjunctions</button>
    </div>

    <!-- Time Tenses -->
    {#if activeTab === 'tenses'}
    <div class="level-content active">
      <GrammarStepper>
        {#snippet whenToUse()}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="{base}/games/dialogue-roleplay" class="block p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all">
            <div class="text-3xl mb-2">🕵️‍♂️</div>
            <h4 class="font-bold text-lg text-slate-800 mb-1">Detective &amp; Reporter</h4>
            <p class="text-sm text-slate-500">Dialogue Roleplay</p>
          </a>
        </div>
        {/snippet}

        <!-- Present Simple -->
        <div class="unit-card">
          <h2 class="unit-title">Present Simple <span class="level-badge">Level 1</span></h2>
          <p class="unit-desc">Talk about daily habits, facts, and things that stay the same.</p>
          <div class="action-grid">
            <a href="{base}/games/multiple-choice?unit=Present-Simple-Choice&returnTo={tensesReturnUrl}" class="action-btn">
              <div class="action-title">🎯 Whack-a-Mole Choice</div>
              <div class="action-desc">6 洞打地鼠 · 約 15 分鐘</div>
            </a>
            <a href="{base}/games/unscramble?unit=Present-Simple-Unscramble" class="action-btn">
              <div class="action-title">🚂 Train Unscramble</div>
              <div class="action-desc">Sentence Unscramble</div>
            </a>
          </div>
        </div>

        <!-- Present Continuous -->
        <div class="unit-card">
          <h2 class="unit-title">Present Continuous <span class="level-badge">Level 1</span></h2>
          <p class="unit-desc">Talk about actions happening now or temporary situations.</p>
          <div class="action-grid">
            <a href="{base}/games/multiple-choice?unit=Present-Continuous-Choice&returnTo={tensesReturnUrl}" class="action-btn">
              <div class="action-title">🎯 Whack-a-Mole Choice</div>
              <div class="action-desc">6 洞打地鼠 · 約 15 分鐘</div>
            </a>
            <a href="{base}/games/unscramble?unit=Present-Continuous-Unscramble" class="action-btn">
              <div class="action-title">🚂 Train Unscramble</div>
              <div class="action-desc">Sentence Unscramble</div>
            </a>
          </div>
        </div>

        <!-- Past Simple -->
        <div class="unit-card">
          <h2 class="unit-title">Past Simple <span class="level-badge">Level 2</span></h2>
          <p class="unit-desc">Talk about past events and states, including irregular verb forms.</p>
          <div class="action-grid">
            <a href="{base}/games/multiple-choice?unit=Past-Simple-Choice&returnTo={tensesReturnUrl}" class="action-btn">
              <div class="action-title">🎯 Whack-a-Mole Choice</div>
              <div class="action-desc">6 洞打地鼠 · 約 15 分鐘</div>
            </a>
            <a href="{base}/games/unscramble?unit=Past-Simple-Unscramble" class="action-btn">
              <div class="action-title">🚂 Train Unscramble</div>
              <div class="action-desc">Sentence Unscramble</div>
            </a>
          </div>
        </div>

        <!-- Future Simple -->
        <div class="unit-card">
          <h2 class="unit-title">Future Simple <span class="level-badge">Level 2</span></h2>
          <p class="unit-desc">Talk about future plans, predictions, and decisions (will / be going to).</p>
          <div class="action-grid">
            <a href="{base}/games/multiple-choice?unit=Future-Simple-Choice&returnTo={tensesReturnUrl}" class="action-btn">
              <div class="action-title">🎯 Whack-a-Mole Choice</div>
              <div class="action-desc">6 洞打地鼠 · 約 15 分鐘</div>
            </a>
            <a href="{base}/games/unscramble?unit=Future-Simple-Unscramble" class="action-btn">
              <div class="action-title">🚂 Train Unscramble</div>
              <div class="action-desc">Sentence Unscramble</div>
            </a>
          </div>
        </div>
      </GrammarStepper>
    </div>
    {/if}

    <!-- Wh- Questions -->
    {#if activeTab === 'wh'}
    <div class="level-content active">
      <GrammarStepper>
        {#snippet whenToUse()}
        {#if whSeries === 'picker'}
        <div class="unit-card" style="margin-top: 0; margin-bottom: 0;">
          <h2 class="unit-title">How Series</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <a href="{base}/games/traveler-quest/level1" class="block p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all" class:border-green-500={l1Done}>
              <div class="text-3xl mb-2">✈️</div>
              <h4 class="font-bold text-lg text-slate-800 mb-1">Transport &amp; Status</h4>
              {#if l1Done}<span class="wh-badge-done mt-2 inline-block">✓ Complete</span>{/if}
            </a>
            <a href="{base}/games/traveler-quest/level2-itinerary" class="block p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all" class:border-green-500={l2Done}>
              <div class="text-3xl mb-2">🎒</div>
              <h4 class="font-bold text-lg text-slate-800 mb-1">New Class Icebreakers</h4>
              {#if l2Done}<span class="wh-badge-done mt-2 inline-block">✓ Complete</span>{/if}
            </a>
            <a href="{base}/games/traveler-quest/level3" class="block p-5 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all" class:border-green-500={l3Done}>
              <div class="text-3xl mb-2">🛍️</div>
              <h4 class="font-bold text-lg text-slate-800 mb-1">Souvenir Shop</h4>
              {#if l3Done}<span class="wh-badge-done mt-2 inline-block">✓ Complete</span>{/if}
            </a>
          </div>
        </div>
        {/if}
        {/snippet}

        {#if whSeries === 'picker'}
          <div class="unit-card">
            <h2 class="unit-title" style="margin-top: 0; margin-bottom: 24px;">How Series</h2>
            <div style="display: flex; flex-direction: column; gap: 24px;">
              <div>
                <h3 class="unit-title" style="margin-bottom: 12px; font-size: 1.15rem; display: flex; align-items: center; margin-top: 0;">Transport &amp; Status <span class="level-badge">Level 1</span></h3>
                <div class="action-grid">
                  <a href="{base}/games/multiple-choice?unit=WHQA-How-Units9-10-MC&returnTo={howReturnUrl}" class="action-btn">
                    <div class="action-title">🎯 Transport &amp; Status</div>
                  </a>
                </div>
              </div>

              <div style="height: 1px; background: #e2e8f0; width: 100%;"></div>

              <div>
                <h3 class="unit-title" style="margin-bottom: 12px; font-size: 1.15rem; display: flex; align-items: center; margin-top: 0;">How often &amp; How long <span class="level-badge">Level 2</span></h3>
                <div class="action-grid">
                  <a href="{base}/games/multiple-choice?unit=WHQA-How-Units11-12-MC&returnTo={howReturnUrl}" class="action-btn">
                    <div class="action-title">🎯 How often &amp; How long</div>
                  </a>
                </div>
              </div>

              <div style="height: 1px; background: #e2e8f0; width: 100%;"></div>

              <div>
                <h3 class="unit-title" style="margin-bottom: 12px; font-size: 1.15rem; display: flex; align-items: center; margin-top: 0;">How much &amp; How many <span class="level-badge">Level 3</span></h3>
                <div class="action-grid">
                  <a href="{base}/games/multiple-choice?unit=WHQA-How-Unit14-Quantity-MC&returnTo={howReturnUrl}" class="action-btn">
                    <div class="action-title">🎯 How much &amp; How many</div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="unit-card" style="margin-top: 20px;">
            <h2 class="unit-title">When Series</h2>
            <div class="action-grid">
              <button type="button" class="action-btn" onclick={() => showWhSeries('when')}>
                <div class="action-title">▶️ When / What time &amp; in / on / at</div>
              </button>
            </div>
          </div>
        {/if}

        {#if whSeries === 'how'}
          <div class="wh-series-nav">
            <button type="button" class="back-btn" style="background:none;border:none;cursor:pointer;font:inherit;padding:0;" onclick={showWhSeriesPicker}>← Wh- Questions</button>
          </div>
          <div class="unit-card" style="border: none; padding: 0; background: transparent; box-shadow: none; margin-bottom: 0;">
            <div class="action-grid" style="display: flex; flex-direction: column; gap: 15px;">
              <!-- ... How Series is primarily in picker now, but keep this wrapper if ever needed, though user will just use picker ... -->
            </div>
          </div>
        {/if}

        {#if whSeries === 'when'}
          <div class="wh-series-nav">
            <button type="button" class="back-btn" style="background:none;border:none;cursor:pointer;font:inherit;padding:0;" onclick={showWhSeriesPicker}>← Wh- Questions</button>
          </div>
          <div class="unit-card">
            <h2 class="unit-title">When Series</h2>
            <div class="action-grid wh-quest-grid" style="margin-top: 16px;">
              <button type="button" class="action-btn wh-quest-btn" class:done={tcL1Done} onclick={openTimeCop} style="grid-column:span 3;">
                <div class="action-title">🚔 Time Cop NYC {#if tcL1Done}<span class="wh-badge-done">✓ Complete</span>{/if}</div>
                <div class="action-desc">Dr. Chronos stole NYC's Time Fragments! Use <strong>When / What time</strong> and the right time prepositions <strong>(in / on / at)</strong> to restore the city.</div>
              </button>
            </div>
          </div>
        {/if}
      </GrammarStepper>
    </div>
    {/if}

    <!-- Adjectives & Noun Phrases -->
    {#if activeTab === 'adj-np'}
    <div class="level-content active">
      <GrammarStepper>
        <p style="color:#555; margin-bottom: 20px; max-width: 720px;">
          Learn how to describe people, places, and things with adjectives, and build richer noun phrases.
        </p>
        <div class="unit-card">
          <h2 class="unit-title">1. Adjective Basics <span class="level-badge">Level 1</span></h2>
          <ol class="unit-subtopics">
            <li><strong>Position of Adjectives in a Sentence</strong></li>
            <li><strong>Adjective Order</strong> <span class="topic-note">Size → Shape → Age → Color → Noun</span></li>
            <li><strong>Fixed Collocations (Adjective + Preposition)</strong><ul><li><em>pleased with</em>, <em>afraid of</em>, <em>good at</em>, <em>interested in</em></li></ul></li>
          </ol>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">2. Other Parts of Speech &amp; Adjective Forms <span class="level-badge">Level 1</span></h2>
          <ol class="unit-subtopics">
            <li><strong>Nouns Used as Adjectives</strong><ul><li><em>fast food</em>, <em>rain coat</em> → <em>raincoat</em></li></ul></li>
            <li><strong>Easily Confused: -ed / -ing Adjectives</strong><ul><li><em>bored</em> (how you feel) vs <em>boring</em> (how something seems)</li></ul></li>
          </ol>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">3. Articles &amp; Quantifiers <span class="level-badge">Level 1</span></h2>
          <ol class="unit-subtopics">
            <li><strong>Article + Adjective + Noun</strong></li>
            <li><strong>Quantifiers &amp; Countable / Uncountable Nouns</strong></li>
          </ol>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">4. Possessives &amp; Possessive Pronouns <span class="level-badge">Level 1</span></h2>
          <ol class="unit-subtopics">
            <li><strong>Possessive adjectives + noun</strong><span class="topic-note"><em>my, your, his, her, its, our, their</em></span></li>
            <li><strong>Possessive pronouns</strong><span class="topic-note"><em>mine, yours, his, hers, ours, theirs</em></span></li>
            <li><strong>Adjective vs pronoun — when to use which</strong></li>
            <li><strong><em>'s</em> for people &amp; things</strong></li>
          </ol>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">5. Comparatives &amp; Superlatives <span class="level-badge">Level 2</span></h2>
          <ol class="unit-subtopics">
            <li><strong><em>tall</em> → <em>taller</em> → <em>the tallest</em></strong></li>
            <li>Regular changes and irregular forms (<em>good</em> → <em>better</em> → <em>best</em>)</li>
          </ol>
        </div>
      </GrammarStepper>
    </div>
    {/if}

    <!-- Adverbs & Conjunctions -->
    {#if activeTab === 'adv-conj'}
    <div class="level-content active">
      <GrammarStepper>
        <p style="color:#555; margin-bottom: 20px; max-width: 720px;">
          Learn how adverbs modify verbs, adjectives, or other adverbs, and how conjunctions connect words, phrases, and clauses.
        </p>
        <div class="unit-card">
          <h2 class="unit-title">1. Adjectives vs Adverbs <span class="level-badge">Level 1</span></h2>
          <p style="color: #666; margin-top: -10px; margin-bottom: 12px;">Essential side-by-side contrast — teach how adjectives and adverbs differ in form and function.</p>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">2. Adverb Position &amp; Negation <span class="level-badge">Level 1</span></h2>
          <ol class="unit-subtopics">
            <li><strong>Position of Adverbs in a Sentence</strong></li>
            <li><strong>Negation and Adverb Position</strong></li>
          </ol>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">3. Types of Adverbs <span class="level-badge">Level 1</span></h2>
          <ol class="unit-subtopics">
            <li><strong>Degree Adverbs</strong><span class="topic-note"><em>very</em>, <em>too</em>, <em>quite</em>, <em>really</em></span></li>
            <li><strong>Time, Place &amp; Manner Adverbs</strong></li>
            <li><strong>Adverbs in Comparatives &amp; Superlatives</strong></li>
          </ol>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">4. Sentence Connectors <span class="level-badge">Level 1</span></h2>
          <p style="color: #666; margin-top: -10px; margin-bottom: 0;">Link two sentences with logical connectors (<em>however</em>, <em>therefore</em>, <em>because</em>, <em>although</em>).</p>
        </div>
        <div class="unit-card">
          <h2 class="unit-title">5. Fixed Phrases Used as Adverbs <span class="level-badge">Level 1</span></h2>
          <p style="color: #666; margin-top: -10px; margin-bottom: 12px;">Learn whole chunks — not single <em>-ly</em> words.</p>
          <ul class="unit-subtopics" style="list-style-type: disc;">
            <li><em>stay up late</em></li>
            <li><em>come up with</em>, <em>all of a sudden</em></li>
          </ul>
        </div>
      </GrammarStepper>
    </div>
    {/if}
  </div>
</div>

<!-- Time Cop Game Shell (iframe overlay) -->
{#if tcShellVisible}
<div style="position:fixed;inset:0;z-index:9999;background:#060c1a">
  <iframe
    title="Time Cop NYC"
    src={tcFrameSrc}
    allow="autoplay"
    style="width:100%;height:100%;border:none"
  ></iframe>
</div>
{/if}

<style>
  .level-badge {
    font-size: 0.6em;
    background: #f3e5f5;
    color: #6a1b9a;
    padding: 4px 8px;
    border-radius: 12px;
    vertical-align: middle;
    margin-left: 10px;
  }
  .unit-desc { color: #666; margin-top: -10px; margin-bottom: 20px; }
  .wh-quest-grid { grid-template-columns: 1fr; }
  .wh-series-nav { margin-bottom: 20px; }
  .wh-quest-btn.done { border-left: 4px solid #43a047; }
  .wh-badge-done {
    display: inline-block;
    background: #e8f5e9;
    color: #2e7d32;
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: bold;
    margin-left: 8px;
    vertical-align: middle;
  }
  .unit-subtopics {
    margin: 0 0 16px 0;
    padding-left: 1.25rem;
    color: #555;
    line-height: 1.65;
  }
  .unit-subtopics li { margin-bottom: 6px; }
  .unit-subtopics ul {
    margin: 6px 0 0 0;
    padding-left: 1.25rem;
    list-style-type: circle;
  }
  :global(.topic-note) {
    display: block;
    margin-top: 4px;
    font-size: 0.9em;
    color: #777;
    font-style: italic;
  }
</style>
