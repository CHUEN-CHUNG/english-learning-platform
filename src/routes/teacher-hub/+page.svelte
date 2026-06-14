<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import { readingUnits } from '$lib/data/reading-units';
  import { initTeacherDataPanel, openTeacherDataPanel } from '$lib/teacher-data';
  import TeacherUnitCard from '$lib/components/reading/TeacherUnitCard.svelte';

  let activeCategory = $state<'reading' | 'grammar'>('reading');
  let authorized = $state(false);

  function openGrammarData() {
    openTeacherDataPanel({ tab: 'grammar', gameType: 'All', unit: null, unitTitle: '文法大廳' });
  }

  onMount(async () => {
    const pwd = prompt('請輸入教師密碼 (預設: admin)：');
    if (pwd !== 'admin') {
      alert('密碼錯誤！將返回首頁。');
      window.location.href = `${base}/`;
      return;
    }
    authorized = true;
    await tick();

    readingProgress.init();
    initTeacherDataPanel();

    const params = new URLSearchParams(location.search);
    if (params.get('openData') === '1') {
      const tab = params.get('tab') === 'grammar' ? 'grammar' : 'reading';
      const game = params.get('game') || 'All';
      if (tab === 'grammar') {
        openTeacherDataPanel({ tab: 'grammar', gameType: 'All', unitTitle: '文法大廳' });
      } else {
        openTeacherDataPanel({ tab: 'reading', gameType: game, unit: null, unitTitle: '' });
      }
      history.replaceState({}, '', `${base}/teacher-hub`);
    }
  });
</script>

<svelte:head>
  <title>教師大廳 - 英語學習平台</title>
</svelte:head>

<div class="theme-teacher">
  <div class="header">
    <h1>👨‍🏫 教師大廳 (Teacher Hub)</h1>
    <a href="{base}/" class="back-btn">← 回首頁</a>
  </div>

  {#if authorized}
    <div class="container">
      <div class="category-selection">
        <a href="{base}/generator.html" class="category-btn tool-category">⚙️ 單字遊戲生成器</a>
        <button
          id="btn-reading-zone"
          class="category-btn {activeCategory === 'reading' ? 'active-reading' : ''}"
          onclick={() => (activeCategory = 'reading')}>📖 閱讀 (Reading)</button
        >
        <button
          id="btn-grammar-zone"
          class="category-btn {activeCategory === 'grammar' ? 'active-grammar' : ''}"
          onclick={() => (activeCategory = 'grammar')}>🏰 文法 (Grammar)</button
        >
      </div>

      <div id="reading-zone" class="category-content {activeCategory === 'reading' ? 'active' : ''}">
        <div class="level-tabs">
          <div class="level-tab active">YLE Flyers</div>
          <div class="level-tab disabled" title="目前無資料">TOEFL Junior</div>
          <div class="level-tab disabled" title="目前無資料">TOEFL</div>
        </div>

        <div id="yle-flyers" class="level-content active">
          <div id="units-container">
            {#each readingUnits as unit (unit.id)}
              <TeacherUnitCard {unit} />
            {/each}
          </div>
        </div>
      </div>

      <div id="grammar-zone" class="category-content {activeCategory === 'grammar' ? 'active' : ''}">
        <div class="unit-card">
          <h2 class="unit-title">文法測驗數據總覽</h2>
          <div class="action-grid">
            <button
              type="button"
              onclick={openGrammarData}
              class="action-btn data-btn w-100"
              style="border-left: 4px solid #6a1b9a;"
            >
              <div class="action-title">📊 文法大廳 (數據)</div>
              <div class="action-desc">Grammar Hub Data</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 教師大廳內嵌學習數據面板 -->
    <div id="teacher-data-overlay" class="teacher-data-overlay hidden">
      <div class="teacher-data-panel">
        <div class="teacher-data-panel-header">
          <div>
            <h2 class="text-2xl font-bold text-gray-800" style="margin:0 0 6px 0;">📊 學習數據與錯題檢視</h2>
            <p id="teacher-data-subtitle" class="text-sm text-gray-500" style="margin:0;">全站學習數據</p>
          </div>
          <button type="button" id="teacher-data-close" class="teacher-data-close-btn">← 返回教師大廳</button>
        </div>

        <div class="mb-6 border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              type="button"
              id="tab-reading"
              class="border-blue-500 text-blue-600 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg"
              style="background:none;border-top:none;border-left:none;border-right:none;cursor:pointer;"
              >📖 閱讀學習數據</button
            >
            <button
              type="button"
              id="tab-grammar"
              class="border-transparent text-gray-500 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg"
              style="background:none;border-top:none;border-left:none;border-right:none;cursor:pointer;"
              >🏰 文法學習數據</button
            >
          </nav>
        </div>

        <div id="content-reading">
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-blue-600 text-white shadow"
              data-filter="All">全部紀錄</button
            >
            <button
              type="button"
              class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700"
              data-filter="Matching">🎮 同反義詞連連看</button
            >
            <button
              type="button"
              class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700"
              data-filter="Reading">📖 閱讀練習</button
            >
            <button
              type="button"
              class="rd-filter-btn px-4 py-2 rounded-full font-bold text-sm bg-gray-200 text-gray-700"
              data-filter="Quiz">📝 單字總測驗</button
            >
          </div>
          <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-3 rounded-xl border border-blue-100">
              <p class="text-xs text-gray-500 font-bold">🎮 總遊玩人次</p>
              <p class="text-2xl font-black text-blue-700" id="rd-starts">0</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-blue-100">
              <p class="text-xs text-gray-500 font-bold">✅ 總完賽人次</p>
              <p class="text-2xl font-black text-green-600" id="rd-all-comp">0</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-blue-100">
              <p class="text-xs text-gray-500 font-bold">🏃 中途跳出</p>
              <p class="text-2xl font-black text-red-500" id="rd-abandon">0</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-blue-100">
              <p class="text-xs text-gray-500 font-bold">⏱️ 平均完賽時間</p>
              <p class="text-2xl font-black text-purple-600" id="rd-avg-total">0s</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-blue-100 col-span-2 md:col-span-4">
              <p class="text-xs text-gray-500 font-bold mb-2">🔥 全站最常錯單字 (Top 5)</p>
              <div id="rd-top-errors" class="flex flex-wrap gap-2 text-sm"></div>
            </div>
          </div>
          <h3 class="text-lg font-bold text-blue-800 mb-3">學生詳細學習數據</h3>
          <div id="reading-data-container" class="space-y-4"></div>
        </div>

        <div id="content-grammar" class="hidden">
          <div
            class="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div class="bg-white p-3 rounded-xl border border-indigo-100">
              <p class="text-xs text-gray-500 font-bold">🎮 總遊玩人次</p>
              <p class="text-2xl font-black text-indigo-700" id="td-starts">0</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-indigo-100">
              <p class="text-xs text-gray-500 font-bold">✅ 總完賽人次</p>
              <p class="text-2xl font-black text-green-600" id="td-all-comp">0</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-indigo-100">
              <p class="text-xs text-gray-500 font-bold">🏃 中途跳出</p>
              <p class="text-2xl font-black text-red-500" id="td-abandon">0</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-indigo-100">
              <p class="text-xs text-gray-500 font-bold">⏱️ 平均完賽時間</p>
              <p class="text-2xl font-black text-purple-600" id="td-avg-total">0s</p>
            </div>
            <div class="bg-white p-3 rounded-xl border border-indigo-100 col-span-2 md:col-span-4">
              <p class="text-xs text-gray-500 font-bold mb-2">🔥 全站最常錯的文法點 (Top 5)</p>
              <div id="td-top-errors" class="flex flex-wrap gap-2 text-sm"></div>
            </div>
          </div>
          <h3 class="text-lg font-bold text-indigo-800 mb-3">學生詳細學習數據</h3>
          <div id="td-content" class="space-y-4"></div>
        </div>
      </div>
    </div>
  {/if}
</div>
