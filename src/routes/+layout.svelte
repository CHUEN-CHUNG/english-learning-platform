<script lang="ts">
  import '../tailwind.css';
  import '../app.scss';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { user } from '$lib/stores/user.svelte';
  import { gameProgress } from '$lib/stores/gameProgress.svelte';
  import { verifyToken } from '$lib/utils/token';

  let { children } = $props();
  
  let isAuthorized = $state(false);
  let authMessage = $state('驗證中...');

  onMount(async () => {
    user.init();
    gameProgress.init();

    const token = $page.url.searchParams.get('token');
    
    if (!token) {
      // 在本機開發環境 (Dev Mode)，如果沒有帶 token，允許直接進入方便開發
      if (import.meta.env.VITE_DISABLE_AUTHORIZATION === 'true') {
        isAuthorized = true;
        return;
      }
      authMessage = '缺少存取權杖 (Missing Token)';
      return;
    }

    const secret = import.meta.env.VITE_TOKEN_SECRET as string;
    if (!secret) {
      console.error('環境變數缺少 VITE_TOKEN_SECRET');
      authMessage = '系統設定錯誤 (System Configuration Error)';
      return;
    }

    const isValid = await verifyToken(token, secret);

    if (isValid) {
      isAuthorized = true;
    } else {
      authMessage = '無效或已過期的存取權杖 (Invalid or Expired Token)';
    }
  });
</script>

{#if isAuthorized}
  {@render children()}
{:else}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
      <h1 class="text-2xl font-bold text-red-600 mb-4">存取被拒</h1>
      <p class="text-gray-700">{authMessage}</p>
    </div>
  </div>
{/if}
