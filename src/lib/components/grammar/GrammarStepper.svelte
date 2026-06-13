<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, defaultOpen = 0 } = $props<{ children: Snippet; defaultOpen?: number }>();

  let openStep = $state(defaultOpen);

  function toggleStep(step: number) {
    if (openStep === step) {
      openStep = 0;
    } else {
      openStep = step;
    }
  }
</script>

<div class="flex flex-col ml-2 mt-4">
  <!-- Step 1 -->
  <div class="flex">
    <div class="flex flex-col items-center mr-5">
      <div class="w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors border-2
                  {openStep === 2 ? 'border-purple-500 bg-purple-500 text-white' : 'border-purple-500 bg-slate-100 text-slate-800'}">
        {#if openStep === 2}
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        {:else}
          <span class="font-bold text-lg">1</span>
        {/if}
      </div>
      <div class="w-0.5 h-full my-1 {openStep === 2 ? 'bg-purple-500' : 'bg-slate-200'}"></div>
    </div>
    <div class="pb-8 w-full">
      <button class="text-left focus:outline-none w-full group flex items-center h-10" onclick={() => toggleStep(1)}>
        <h3 class="font-bold text-lg text-slate-800 group-hover:text-purple-600 transition-colors">When to use 📖</h3>
      </button>
      {#if openStep === 1}
        <div class="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 animate-fade-in">
          <div class="text-3xl mb-2">🚧</div>
          <p class="font-medium">施工中 (Under Construction)</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Step 2 -->
  <div class="flex">
    <div class="flex flex-col items-center mr-5">
      <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors
                  {openStep === 2 ? 'border-purple-500 bg-slate-100 text-slate-800' : 'border-transparent bg-slate-100 text-slate-500'}">
        <span class="font-bold text-lg">2</span>
      </div>
    </div>
    <div class="pb-2 w-full">
      <button class="text-left focus:outline-none w-full group flex items-center h-10" onclick={() => toggleStep(2)}>
        <h3 class="font-bold text-lg text-slate-800 group-hover:text-purple-600 transition-colors">Grammar Practice 🎮</h3>
      </button>
      {#if openStep === 2}
        <div class="mt-4 animate-fade-in w-full">
          {@render children()}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
