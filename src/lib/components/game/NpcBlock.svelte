<script lang="ts">
  import type { TravelerNpcId } from '$lib/utils/traveler-npc-speech';
  import { speakNpcLine } from '$lib/utils/traveler-npc-speech';

  const NPC_META: Record<TravelerNpcId, { emoji: string; label: string }> = {
    guide:      { emoji: '🧳', label: 'Tour Guide' },
    planner:    { emoji: '⏱️', label: 'Time Planner' },
    classmate:  { emoji: '🎒', label: 'Classmate' },
    shopkeeper: { emoji: '👨‍💼', label: 'Shop Owner' },
    customer:   { emoji: '😤', label: 'Difficult Customer' },
  };

  let {
    id,
    line,
    subline = '',
  }: {
    id: TravelerNpcId;
    line: string;
    subline?: string;
  } = $props();

  let meta = $derived(NPC_META[id]);
</script>

<div class="npc-area">
  <div class="npc-avatar" role="img" aria-label={meta.label}>
    <span class="npc-avatar__emoji">{meta.emoji}</span>
  </div>
  <div class="speech-bubble">
    <p class="npc-line">{line}</p>
    {#if subline}<p class="npc-subline">{subline}</p>{/if}
    <button class="npc-tts-btn" onclick={() => speakNpcLine(subline ? `${line} ${subline}` : line)}>
      🔊
    </button>
  </div>
</div>

<style>
  .npc-area {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 16px 0;
  }
  .npc-avatar {
    font-size: 2.5rem;
    flex-shrink: 0;
  }
  .speech-bubble {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 12px 16px;
    position: relative;
    flex: 1;
  }
  .npc-line { margin: 0 0 4px 0; font-size: 1.1em; }
  .npc-subline { margin: 0; font-size: 0.9em; color: #555; }
  .npc-tts-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2em;
    margin-top: 6px;
    padding: 2px 6px;
    border-radius: 6px;
    transition: background 0.2s;
  }
  .npc-tts-btn:hover { background: #f0f0f0; }
</style>
