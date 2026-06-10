/** NPC voice — Web Speech API (same approach as dialogue-roleplay detective game) */

import { speakEnglish, normalizeTextForEnglishTts } from "@shared/utils/english-tts";

export { normalizeTextForEnglishTts };

export function stopNpcSpeech() {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function speakNpcLine(text: string) {
  const line = text.trim();
  if (!line) return;
  if (!("speechSynthesis" in window)) return;

  stopNpcSpeech();
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
  speakEnglish(line, { rate: 0.95 });
}

function npcSpeechText(area: Element): string {
  const line = area.querySelector(".npc-line")?.textContent?.trim() ?? "";
  const sub = area.querySelector(".npc-subline")?.textContent?.trim() ?? "";
  if (line && sub) return `${line} ${sub}`;
  return line || sub;
}

/** Bind 🔊 button on each NPC block to play voice on click (no auto-play). */
export function initNpcSpeech(root: ParentNode = document) {
  const areas = root.querySelectorAll(".npc-area");
  areas.forEach((area) => {
    const text = npcSpeechText(area);
    const btn = area.querySelector(".npc-tts-btn");
    if (btn instanceof HTMLButtonElement) {
      btn.onclick = () => speakNpcLine(text);
    }
  });
}
