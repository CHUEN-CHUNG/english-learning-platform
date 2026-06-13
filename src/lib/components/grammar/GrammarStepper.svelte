<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children } = $props<{ children: Snippet }>();
</script>

<div class="flex flex-col ml-2 mt-4">
  <!-- Step 1 -->
  <div class="flex">
    <div class="flex flex-col items-center mr-5 shrink-0">
      <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center z-10 border-2 border-purple-500 bg-slate-100 text-slate-800">
        <span class="font-bold text-lg text-purple-700">1</span>
      </div>
      <div class="w-0.5 h-full my-1 bg-slate-200"></div>
    </div>
    <div class="pb-8 w-full">
      <div class="w-full group flex items-center h-10">
        <h3 class="font-bold text-lg text-slate-800">When to use 📖</h3>
      </div>
      <div class="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
        <div class="text-3xl mb-2">🚧</div>
        <p class="font-medium">施工中 (Under Construction)</p>
      </div>
    </div>
  </div>

  <!-- Step 2 -->
  <div class="flex">
    <div class="flex flex-col items-center mr-5 shrink-0">
      <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2 z-10 border-purple-500 bg-slate-100 text-slate-800">
        <span class="font-bold text-lg text-purple-700">2</span>
      </div>
    </div>
    <div class="pb-2 w-full">
      <div class="w-full group flex items-center h-10">
        <h3 class="font-bold text-lg text-slate-800">Grammar Practice 🎮</h3>
      </div>
      <div class="mt-4 w-full">
        {@render children()}
      </div>
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
