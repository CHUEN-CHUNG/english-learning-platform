<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  // Original index.html redirected to the combined level2-itinerary game.
  onMount(() => {
    void goto(`${base}/games/traveler-quest/level2-itinerary`, { replaceState: true });
  });
</script>

<svelte:head>
  <title>Redirecting…</title>
</svelte:head>

<p class="redirect-note">
  <a href="{base}/games/traveler-quest/level2-itinerary">Go to New Class Icebreakers</a>
</p>

<style>
  .redirect-note {
    padding: 2rem;
    text-align: center;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
</style>
