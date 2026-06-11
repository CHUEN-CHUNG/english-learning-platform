<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  let returnToParam = $derived($page.url.searchParams.get('returnTo'));
  let returnUrl = $derived(returnToParam ? returnToParam : `${base}/grammar-hub`);
</script>

<svelte:head>
  <title>文法填空挑戰</title>
</svelte:head>

<div class="bg-blue-50 h-[100dvh] flex flex-col overflow-hidden">
  <div class="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6">
    <div class="max-w-2xl text-center bg-white p-12 rounded-3xl shadow-lg border-2 border-blue-100">
      <span class="text-6xl mb-6 block">🎮</span>
      <h1 class="text-4xl font-bold text-blue-700 mb-4">文法填空挑戰</h1>
      <p class="text-xl text-gray-600 mb-8">這個功能正在由工程師努力開發中！敬請期待！</p>

      <div class="flex justify-center gap-4">
        <a
          href={returnUrl}
          class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
        >
          🏠 返回大廳
        </a>
      </div>
    </div>
  </div>
</div>
