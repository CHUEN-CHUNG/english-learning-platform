/** NPC voice — Web Speech API (same approach as dialogue-roleplay detective game) */

import { speakEnglish, normalizeTextForEnglishTts } from '$lib/utils/english-tts';

export { normalizeTextForEnglishTts };

export type TravelerNpcId = 'guide' | 'planner' | 'classmate' | 'shopkeeper' | 'customer';

export function stopNpcSpeech() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

export function speakNpcLine(text: string) {
  const line = text.trim();
  if (!line) return;
  if (!('speechSynthesis' in window)) return;

  stopNpcSpeech();
  // Queue multiple utterances for audibility
  for (let i = 0; i < 10; i++) {
    speakEnglish(line, { rate: 0.95, cancelPrevious: false });
  }
}

/**
 * Wire TTS buttons inside a freshly rendered NPC block container.
 * Replaces the old shared/traveler initNpcSpeech() that used event listeners.
 */
export function initNpcSpeech(container: HTMLElement) {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.npc-tts-btn');
  buttons.forEach((btn) => {
    if (btn.dataset.npcWired) return;
    btn.dataset.npcWired = '1';
    btn.addEventListener('click', () => {
      const bubble = btn.closest('.speech-bubble');
      const line = bubble?.querySelector('.npc-line')?.textContent ?? '';
      const sub = bubble?.querySelector('.npc-subline')?.textContent ?? '';
      speakNpcLine(sub ? `${line} ${sub}` : line);
    });
  });
}
