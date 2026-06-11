<script lang="ts">
  import { base } from '$app/paths';

  let {
    title,
    subtitle = '',
    returnHref = `${base}/grammar-hub`,
    onTitleClick = undefined,
    children,
  }: {
    title: string;
    subtitle?: string;
    returnHref?: string;
    onTitleClick?: () => void;
    children: import('svelte').Snippet;
  } = $props();
</script>

<div class="game-layout">
  <header class="game-layout__header">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <h1 class="game-layout__title" onclick={onTitleClick}>{title}</h1>
    {#if subtitle}<p class="game-layout__subtitle">{subtitle}</p>{/if}
    <a href={returnHref} class="game-layout__back">← Back to Hub</a>
  </header>
  <main class="game-layout__main">
    {@render children()}
  </main>
</div>

<style>
  .game-layout { display: flex; flex-direction: column; min-height: 100dvh; }
  .game-layout__header {
    padding: 16px 24px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .game-layout__title { margin: 0; font-size: 1.4em; flex: 1; }
  .game-layout__subtitle { margin: 0; color: #666; font-size: 0.95em; }
  .game-layout__back { text-decoration: none; color: #007bff; font-weight: bold; white-space: nowrap; }
  .game-layout__back:hover { text-decoration: underline; }
  .game-layout__main { flex: 1; padding: 24px; }
</style>
