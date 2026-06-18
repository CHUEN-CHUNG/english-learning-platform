<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import { readingUnits } from '$lib/data/reading-units';
  import ReadingDataHub from '$lib/components/teacher/ReadingDataHub.svelte';
  import GrammarDataHub from '$lib/components/teacher/GrammarDataHub.svelte';
  import TutorDashboard from '$lib/components/teacher/TutorDashboard.svelte';

  let activeCategory = $state<'reading' | 'grammar' | 'tutor'>('reading');
  let authorized = $state(false);

  function openGrammarData() {
    activeCategory = 'grammar';
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

    const params = new URLSearchParams(location.search);
    if (params.get('openData') === '1') {
      const tab = params.get('tab') === 'grammar' ? 'grammar' : 'reading';
      activeCategory = tab;
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
      <div style="margin-bottom: 20px;">
        <a href="{base}/generator.html" class="category-btn tool-category" style="display: block; width: 100%;">⚙️ 單字遊戲生成器</a>
      </div>
      <div class="category-selection">
        <button
          id="btn-tutor-zone"
          class="category-btn {activeCategory === 'tutor' ? 'active-tutor' : ''}"
          style="{activeCategory === 'tutor' ? 'background-color: #e0f2fe; color: #1e3a8a; border-left: 4px solid #1e3a8a;' : ''}"
          onclick={() => (activeCategory = 'tutor')}>🎓 家教數據 (Tutor)</button
        >
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

      <div id="tutor-zone" class="category-content {activeCategory === 'tutor' ? 'active' : ''}">
        {#if activeCategory === 'tutor'}
          <TutorDashboard />
        {/if}
      </div>

      <div id="reading-zone" class="category-content {activeCategory === 'reading' ? 'active' : ''}">
        <div class="level-tabs">
          <div class="level-tab active">YLE Flyers</div>
          <div class="level-tab disabled" title="目前無資料">TOEFL Junior</div>
          <div class="level-tab disabled" title="目前無資料">TOEFL</div>
        </div>

        <div id="yle-flyers" class="level-content active">
          <div id="units-container">
            <ReadingDataHub />
          </div>
        </div>
      </div>

      <div id="grammar-zone" class="category-content {activeCategory === 'grammar' ? 'active' : ''}">
        <GrammarDataHub />
      </div>
    </div>

  {/if}
</div>
