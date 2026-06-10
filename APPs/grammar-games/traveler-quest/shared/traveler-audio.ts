/** Shared SFX/BGM for Super Traveler Quest levels */

import { stopNpcSpeech } from "./traveler-npc-speech";
import { playEnterGameSfx } from "../../shared/enter-game-sfx";

export { playEnterGameSfx };

const INTRO_URL = new URL("./assets/intro.mp3", import.meta.url).href;
const SUBMIT_URL = new URL("./assets/submit.mp3", import.meta.url).href;

export const TRAVELER_BGM = {
  trip: new URL("./assets/trip.mp3", import.meta.url).href,
  happyBackground: new URL("./assets/happy-background.mp3", import.meta.url).href,
  shopBackground: new URL("./assets/happy-background-2.mp3", import.meta.url).href,
} as const;

let bgm: HTMLAudioElement | null = null;
let introSfx: HTMLAudioElement | null = null;

function safePlay(audio: HTMLAudioElement): Promise<void> {
  return audio.play().catch(() => {});
}

function isIntroPlaying() {
  return introSfx !== null && !introSfx.paused && !introSfx.ended;
}

/** Story intro narration (Intro.mp3) */
export function playIntroSfx() {
  if (isIntroPlaying()) return;
  if (introSfx) {
    introSfx.pause();
    introSfx = null;
  }
  introSfx = new Audio(INTRO_URL);
  introSfx.volume = 0.85;
  introSfx.addEventListener(
    "ended",
    () => {
      introSfx = null;
    },
    { once: true },
  );
  void safePlay(introSfx);
}

/**
 * Play intro when the story briefing screen appears.
 * Retries on first tap if the browser blocked autoplay.
 */
export function playIntroOnStoryScreen() {
  playIntroSfx();

  const retryOnTap = () => {
    if (!isIntroPlaying()) playIntroSfx();
  };
  document.querySelector(".story-intro-panel")?.addEventListener("pointerdown", retryOnTap, {
    once: true,
  });
}

/** Submit answer / question */
export function playSubmitSfx() {
  const sfx = new Audio(SUBMIT_URL);
  sfx.volume = 0.85;
  void safePlay(sfx);
}

export function startTravelerBgm(url: string, volume = 0.28) {
  if (bgm?.src === url && !bgm.paused) return;
  stopTravelerBgm();
  bgm = new Audio(url);
  bgm.loop = true;
  bgm.volume = volume;
  void safePlay(bgm);
}

export function stopTravelerBgm() {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
  bgm = null;
}

export function stopIntroSfx() {
  if (!introSfx) return;
  introSfx.pause();
  introSfx.currentTime = 0;
  introSfx = null;
}

/** Stop intro + BGM (leave game / scoreboard) */
export function stopAllTravelerAudio() {
  stopIntroSfx();
  stopTravelerBgm();
  stopNpcSpeech();
}
