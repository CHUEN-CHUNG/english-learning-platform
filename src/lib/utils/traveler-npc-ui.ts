/**
 * HTML-string NPC block renderer for the imperative Traveler Quest pages.
 * Output matches the original shared/npc-ui.ts so the .scss styles apply.
 */

import type { TravelerNpcId } from '$lib/utils/traveler-npc-speech';

const NPC_META: Record<TravelerNpcId, { emoji: string; label: string }> = {
  guide: { emoji: '🧳', label: 'Tour Guide' },
  planner: { emoji: '⏱️', label: 'Time Planner' },
  classmate: { emoji: '🎒', label: 'Classmate' },
  shopkeeper: { emoji: '👨‍💼', label: 'Shop Owner' },
  customer: { emoji: '😤', label: 'Difficult Customer' },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface NpcBlockOptions {
  id: TravelerNpcId;
  line: string;
  subline?: string;
  className?: string;
}

export function renderNpcBlock(opts: NpcBlockOptions): string {
  const meta = NPC_META[opts.id];
  const extra = opts.className ? ` ${opts.className}` : '';
  const sub = opts.subline
    ? `<p class="npc-subline">${escapeHtml(opts.subline)}</p>`
    : '';

  return `
    <div class="npc-area${extra}">
      <div class="npc-avatar" role="img" aria-label="${escapeHtml(meta.label)}">
        <span class="npc-avatar__emoji">${meta.emoji}</span>
      </div>
      <div class="speech-bubble">
        <div class="speech-bubble__head">
          <p class="npc-label">${escapeHtml(meta.label)}</p>
          <button type="button" class="npc-tts-btn" aria-label="Play NPC voice">🔊</button>
        </div>
        <p class="npc-line">${escapeHtml(opts.line)}</p>
        ${sub}
      </div>
    </div>
  `.trim();
}
