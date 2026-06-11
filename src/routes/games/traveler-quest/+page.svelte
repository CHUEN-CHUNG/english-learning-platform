<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  // Original index.html only redirected to the Grammar Hub (Wh- tab).
  onMount(() => {
    void goto(`${base}/grammar-hub?tab=wh`, { replaceState: true });
  });
</script>

<svelte:head>
  <title>Super Traveler Quest</title>
</svelte:head>

<p class="redirect-note">
  Redirecting to Grammar Hub… If nothing happens,
  <a href="{base}/grammar-hub?tab=wh">click here</a>.
</p>

<style>
  .redirect-note {
    padding: 2rem;
    text-align: center;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
</style>
