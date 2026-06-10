/**
 * Time Cop NYC — audio module (iframe side)
 *
 * BGM is controlled by the PARENT page (user-gesture context).
 * This module posts postMessage commands to the parent so the
 * parent can play/stop/switch BGM reliably.
 *
 * Correct / Wrong SFX live here because they are triggered by
 * in-game user clicks (no autoplay restriction applies).
 */

import correctSrc from "../../music/correct.mp3";
import wrongSrc   from "../../music/wrong.mp3";

export type TimeCopBgmTrack = "mission1" | "mission2" | "mission3" | "victory";

/** Tell the parent page which BGM track to play. */
export function setTimeCopBgm(track: TimeCopBgmTrack) {
  window.parent.postMessage({ type: "timecop-bgm", track }, "*");
}

/** Tell the parent page to stop BGM (and, optionally, close the shell). */
export function stopTimeCopBgm() {
  window.parent.postMessage({ type: "timecop-bgm-stop" }, "*");
}

export function ensureTimeCopBgm() {
  /* no-op: parent decides when to start */
}

export function playCorrectSfx() {
  const sfx = new Audio(correctSrc);
  sfx.volume = 0.85;
  void sfx.play().catch(() => {});
}

export function playWrongSfx() {
  const sfx = new Audio(wrongSrc);
  sfx.volume = 0.85;
  void sfx.play().catch(() => {});
}
