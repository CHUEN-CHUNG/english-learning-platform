<script lang="ts">
  import '../tailwind.css';
  import '../app.scss';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.svelte';
  import { gameProgress } from '$lib/stores/gameProgress.svelte';

  let { children } = $props();

  onMount(() => {
    user.init();
    gameProgress.init();
  });
</script>

{@render children()}
