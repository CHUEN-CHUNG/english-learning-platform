<script lang="ts">
  import { user } from '$lib/stores/user.svelte';

  let {
    hubName = '大廳',
    onLogin,
  }: {
    hubName?: string;
    onLogin: (name: string) => void;
  } = $props();

  let nameInput = $state('');

  let isSubmitting = $state(false);

  async function submit() {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      const success = await user.login(nameInput);
      if (success) {
        onLogin(nameInput);
      } else {
        alert('請輸入有效的名字！');
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if !user.current}
  <div class="modal-overlay">
    <div class="login-modal">
      <h2>歡迎來到{hubName}</h2>
      <p>請輸入你的名字開始學習</p>
      <input
        class="login-input"
        bind:value={nameInput}
        placeholder="輸入名字..."
        onkeydown={(e) => e.key === 'Enter' && submit()}
        disabled={isSubmitting}
      />
      <button class="login-btn" onclick={submit} disabled={isSubmitting}>
        {isSubmitting ? '載入中...' : '開始學習 🚀'}
      </button>
    </div>
  </div>
{/if}
