<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>Tense Comic Reader</title>
</svelte:head>

<div class="bg-purple-50 min-h-screen flex flex-col items-center justify-center p-8">
  <div class="text-center max-w-lg">
    <h1 class="text-4xl font-bold text-purple-700 mb-4">Tense Comic Reader</h1>
    <p class="text-xl text-gray-600 mb-8">This feature is under development. Stay tuned!</p>
    <a
      href="{base}/grammar-hub"
      class="inline-block px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition"
    >
      🏠 Back to Hub
    </a>
  </div>
</div>
