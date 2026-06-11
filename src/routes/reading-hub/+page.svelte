<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import { readingUnits } from '$lib/data/reading-units';
  import ReadingUnitCard from '$lib/components/reading/ReadingUnitCard.svelte';

  let loginName = $state('');
  let ready = $state(false);

  const loggedIn = $derived(!!readingProgress.current);

  function submitLogin() {
    if (readingProgress.setCurrentUser(loginName)) {
      loginName = '';
    } else {
      alert('請輸入有效的名字！');
    }
  }

  function logout() {
    if (confirm('確定要登出嗎？')) {
      readingProgress.logout();
    }
  }

  onMount(() => {
    readingProgress.init();
    ready = true;
  });
</script>

<svelte:head>
  <title>閱讀大廳 - 英語學習平台</title>
  <script async src="https://tally.so/widgets/embed.js"></script>
</svelte:head>

<div class="theme-reading">
  <div class="header">
    <h1>📖 閱讀大廳 (Reading Hub)</h1>
    <div style="display: flex; align-items: center; gap: 20px;">
      {#if loggedIn}
        <div class="user-profile" style="display: flex;">
          <span class="user-name-display">👤 <span>{readingProgress.current}</span></span>
          <button type="button" class="logout-btn" style="border:none;background:none;font-family:inherit;" onclick={logout}>登出</button>
        </div>
      {/if}
      <a href="{base}/" class="back-btn">← 回首頁</a>
    </div>
  </div>

  {#if ready && !loggedIn}
    <div class="modal-overlay">
      <div class="login-modal">
        <h2>歡迎來到閱讀大廳</h2>
        <p>請輸入您的名字，我們將為您記錄學習進度！</p>
        <input
          type="text"
          class="login-input"
          placeholder="例如：小明"
          autocomplete="off"
          bind:value={loginName}
          onkeydown={(e) => e.key === 'Enter' && submitLogin()}
        />
        <button class="login-btn" onclick={submitLogin}>開始學習 🚀</button>
      </div>
    </div>
  {/if}

  <div class="container">
    <div class="level-tabs">
      <div class="level-tab active">YLE Flyers</div>
      <div class="level-tab disabled" title="目前無資料">TOEFL Junior</div>
      <div class="level-tab disabled" title="目前無資料">TOEFL</div>
    </div>

    <div class="level-content active">
      {#if !ready}
        <div class="loading-spinner">載入單元資料中...</div>
      {:else if loggedIn}
        {#each readingUnits as unit (unit.id)}
          <ReadingUnitCard {unit} />
        {/each}
      {:else}
        <div class="loading-spinner">請先登入以查看學習進度。</div>
      {/if}
    </div>
  </div>
</div>
