import { base } from '$app/paths';

// ─── Enter Game SFX ───

export function playEnterGameSfx() {
  const sfx = new Audio(`${base}/audio/enter-game.mp3`);
  sfx.volume = 0.9;
  void sfx.play().catch(() => {});
}

// ─── Traveler Quest Audio ───

export const TRAVELER_BGM = {
  trip: `${base}/audio/traveler-quest/trip.mp3`,
  happyBackground: `${base}/audio/traveler-quest/happy-background.mp3`,
  shopBackground: `${base}/audio/traveler-quest/happy-background-2.mp3`,
} as const;

let _bgm: HTMLAudioElement | null = null;
let _introSfx: HTMLAudioElement | null = null;

function safePlay(audio: HTMLAudioElement): Promise<void> {
  return audio.play().catch(() => {});
}

function isIntroPlaying() {
  return _introSfx !== null && !_introSfx.paused && !_introSfx.ended;
}

export function playIntroSfx() {
  if (isIntroPlaying()) return;
  if (_introSfx) {
    _introSfx.pause();
    _introSfx = null;
  }
  _introSfx = new Audio(`${base}/audio/traveler-quest/intro.mp3`);
  _introSfx.volume = 0.85;
  _introSfx.addEventListener('ended', () => { _introSfx = null; }, { once: true });
  void safePlay(_introSfx);
}

export function playIntroOnStoryScreen() {
  playIntroSfx();
  const retryOnTap = () => {
    if (!isIntroPlaying()) playIntroSfx();
  };
  document.querySelector('.story-intro-panel')?.addEventListener('pointerdown', retryOnTap, { once: true });
}

export function playSubmitSfx() {
  const sfx = new Audio(`${base}/audio/traveler-quest/submit.mp3`);
  sfx.volume = 0.85;
  void safePlay(sfx);
}

export function startTravelerBgm(url: string, volume = 0.28) {
  stopIntroSfx();
  if (_bgm?.src === url && !_bgm.paused) return;
  stopTravelerBgm();
  _bgm = new Audio(url);
  _bgm.loop = true;
  _bgm.volume = volume;
  void safePlay(_bgm);
}

export function stopTravelerBgm() {
  if (!_bgm) return;
  _bgm.pause();
  _bgm.currentTime = 0;
  _bgm = null;
}

export function stopIntroSfx() {
  if (!_introSfx) return;
  _introSfx.pause();
  _introSfx.currentTime = 0;
  _introSfx = null;
}

export function stopAllTravelerAudio() {
  stopIntroSfx();
  stopTravelerBgm();
}

// ─── Time Cop Audio ───

export type TimeCopBgmTrack = 'mission1' | 'mission2' | 'mission3' | 'victory';

export function setTimeCopBgm(track: TimeCopBgmTrack) {
  window.parent.postMessage({ type: 'timecop-bgm', track }, '*');
}

export function stopTimeCopBgm() {
  window.parent.postMessage({ type: 'timecop-bgm-stop' }, '*');
}

export function playCorrectSfx() {
  const sfx = new Audio(`${base}/audio/time-cop/correct.mp3`);
  sfx.volume = 0.85;
  void sfx.play().catch(() => {});
}

export function playWrongSfx() {
  const sfx = new Audio(`${base}/audio/time-cop/wrong.mp3`);
  sfx.volume = 0.85;
  void sfx.play().catch(() => {});
}
