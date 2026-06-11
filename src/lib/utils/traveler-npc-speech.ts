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
