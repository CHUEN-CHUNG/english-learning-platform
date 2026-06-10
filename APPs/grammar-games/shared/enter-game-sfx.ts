/** Shared "enter game" SFX — canonical source: traveler-quest/music/enter game.mp3 */

const ENTER_GAME_URL = new URL(
  "../traveler-quest/music/enter game.mp3",
  import.meta.url,
).href;

export function playEnterGameSfx() {
  const sfx = new Audio(ENTER_GAME_URL);
  sfx.volume = 0.9;
  void sfx.play().catch(() => {});
}
