<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>英語學習平台</title>
</svelte:head>

<div class="scroll-wrapper">
  <div class="container" style="max-width: 800px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h1 style="text-align: center; color: #333;">英語學習平台入口</h1>

    <h2 class="section-title">📖 閱讀 (Reading)</h2>
    <div class="app-list">
      <a href="{base}/reading-hub" class="app-card" style="background: #e3f2fd; border: 1px solid #b6effb;">
        <div class="app-title" style="color: #0056b3;">🚀 開始閱讀 (Start Reading)</div>
        <div class="app-desc">選擇程度與單元，進行閱讀練習、單字測驗與下載講義。</div>
      </a>
    </div>

    <h2 class="section-title">🏰 文法 (Grammar)</h2>
    <div class="app-list">
      <a href="{base}/grammar-hub" class="app-card" style="background: #f3e5f5; border: 1px solid #e1bee7;">
        <div class="app-title" style="color: #6a1b9a;">🏰 進入文法大廳</div>
        <div class="app-desc">選擇文法主題，進行填空、重組、挑錯挑戰與時態漫畫閱讀！</div>
      </a>
    </div>

    <h2 class="section-title">👨‍🏫 教師專用 (Teacher Zone)</h2>
    <div class="app-list">
      <a href="{base}/teacher-hub" class="app-card" style="background: #e0f2f1; border: 1px solid #b2dfdb;">
        <div class="app-title" style="color: #00695c;">📊 進入教師大廳</div>
        <div class="app-desc">查看各單元測驗數據、講義下載成效與問卷回饋。</div>
      </a>
    </div>
  </div>
</div>

<style>
  .scroll-wrapper { flex: 1; overflow-y: auto; padding: 40px; }
  h1 { text-align: center; color: #333; }
  .app-list { display: flex; flex-direction: column; gap: 15px; margin-top: 30px; }
  .app-card { display: block; padding: 20px; background: #e9ecef; border-radius: 12px; text-decoration: none; color: #333; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .app-card:hover { background: #d3d9df; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transform: translateY(-2px); }
  .app-title { font-size: 1.2em; font-weight: bold; margin-bottom: 5px; }
  .app-desc { color: #666; font-size: 0.9em; }
  .section-title { margin-top: 30px; margin-bottom: 10px; color: #444; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
</style>
