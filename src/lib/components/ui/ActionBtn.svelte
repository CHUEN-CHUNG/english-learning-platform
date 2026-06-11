<script lang="ts">
  let {
    href = '',
    title,
    desc = '',
    disabled = false,
    onclick,
  }: {
    href?: string;
    title: string;
    desc?: string;
    disabled?: boolean;
    onclick?: () => void;
  } = $props();
</script>

{#if href && !disabled}
  <a {href} class="action-btn">
    <div class="action-title">{title}</div>
    {#if desc}<div class="action-desc">{desc}</div>{/if}
  </a>
{:else}
  <button
    type="button"
    class="action-btn"
    class:disabled
    {onclick}
    disabled={disabled || undefined}
  >
    <div class="action-title">{title}</div>
    {#if desc}<div class="action-desc">{desc}</div>{/if}
  </button>
{/if}
