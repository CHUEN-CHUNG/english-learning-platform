<script lang="ts">
  import { base } from '$app/paths';

  let {
    title,
    theme = 'reading',
    backHref = `${base}/`,
    backLabel = '← 返回首頁',
    children,
  }: {
    title: string;
    theme?: 'reading' | 'grammar' | 'teacher';
    backHref?: string;
    backLabel?: string;
    children: import('svelte').Snippet;
  } = $props();
</script>

<div class="theme-{theme}">
  <div class="header">
    <h1>{title}</h1>
    <a class="back-btn" href={backHref}>{backLabel}</a>
  </div>
  <div class="container">
    {@render children()}
  </div>
</div>
