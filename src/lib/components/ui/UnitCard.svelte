<script lang="ts">
  let {
    title,
    level = '',
    desc = '',
    children,
  }: {
    title: string;
    level?: string;
    desc?: string;
    children: import('svelte').Snippet;
  } = $props();
</script>

<div class="unit-card">
  <h2 class="unit-title">
    {title}
    {#if level}<span class="level-badge">{level}</span>{/if}
  </h2>
  {#if desc}<p class="unit-desc">{desc}</p>{/if}
  {@render children()}
</div>

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
</style>
