import { GrammarDataTracker } from "../../../../../shared/game-core/GrammarDataTracker";
import { initScoreboard, showResult } from "../../../../../shared/game-core/GrammarScoreboard";
import { renderNpcBlock } from "../../shared/npc-ui";
import { initNpcSpeech } from "../../shared/traveler-npc-speech";
import {
  playEnterGameSfx,
  playIntroOnStoryScreen,
  playSubmitSfx,
  startTravelerBgm,
  stopAllTravelerAudio,
  TRAVELER_BGM,
} from "../../shared/traveler-audio";
import {
  loadTransportDestinations,
  loadTransportStatusCards,
} from "../../shared/traveler-quest-bank";
// @ts-ignore
import { ProgressTracker } from "../../../../../shared/utils/ProgressTracker";

const WH_HUB_RETURN = "/apps/grammar-hub/index.html?tab=wh&series=how";
const PASS_LOCATIONS = 3;

type TransportMode = "in_on" | "by";

interface Destination {
  label: string;
  question: string;
}

interface StatusCard {
  id: string;
  emoji: string;
  label: string;
  npcQuestion: string;
  expectedPatterns: RegExp[];
  hint: string;
}

const DESTINATIONS: Destination[] = loadTransportDestinations();
const STATUS_CARDS: StatusCard[] = loadTransportStatusCards();

const tracker = new GrammarDataTracker("TravelerLevel1");

let locationsDone = 0;
let usedDestinations: string[] = [];
let currentDestination: Destination | null = null;
/** 0 = by（How do you go…?）, 1 = in/on（Where are you?） */
let transportStepAtStop = 0;
let currentTransportMode: TransportMode = "in_on";
/** 上一題 by 交通方式的完整回答（供 Where are you? 提示） */
let lastByTransportAnswer = "";
let currentStatusCard: StatusCard | null = null;
let wheelSpinning = false;
let userName = "";

const gameMain = document.getElementById("game-main")!;
const progressLabel = document.getElementById("progress-label")!;

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function updateHUD() {
  progressLabel.textContent = `Destination ${locationsDone} / ${PASS_LOCATIONS}`;
}

function renderRoundHintBox(mode: TransportMode): string {
  return renderHintBox(transportRoundHint(mode));
}

function renderHintBox(text: string): string {
  return `
    <div class="tech-panel text-center mb-4">
      <p class="text-sky-300 font-bold text-lg">${text}</p>
    </div>
  `;
}

function clearGameMain() {
  gameMain.innerHTML = "";
}

function render(html: string) {
  clearGameMain();
  if (html) gameMain.innerHTML = html;
  initNpcSpeech(gameMain);
}

/** 轉盤只顯示尚未完成的 destination（下一回合移除前一回合題目） */
function getWheelDestinations(): Destination[] {
  const remaining = DESTINATIONS.filter(
    (d) => !usedDestinations.includes(d.label),
  );
  return remaining.length > 0 ? remaining : [...DESTINATIONS];
}

function resetStopState() {
  transportStepAtStop = 0;
  currentTransportMode = "by";
  lastByTransportAnswer = "";
  currentStatusCard = null;
}

function beginNextDestinationRound(banner?: string) {
  resetStopState();
  currentDestination = null;
  wheelSpinning = false;
  showSpinPhase(banner);
}

function getTransportModeForStop(): TransportMode {
  return transportStepAtStop === 0 ? "by" : "in_on";
}

function transportRoundHint(mode: TransportMode): string {
  return mode === "in_on"
    ? "This round: use in or on"
    : "This round: use by";
}

function whereAreYouTransportHint(): string {
  if (!lastByTransportAnswer) return "";
  return `You just said: ${lastByTransportAnswer}`;
}

function validateTransport(answer: string, mode: TransportMode): {
  ok: boolean;
  feedback: string;
} {
  const a = normalize(answer).toLowerCase();

  if (mode === "by") {
    if (/\bby\s+(a|an|the)\b/.test(a)) {
      return {
        ok: false,
        feedback: "Don't use a/the after by. Use e.g. by bus, by taxi.",
      };
    }
    if (/\b(in the|in a|on the|on an)\b/.test(a) && !/\bby\b/.test(a)) {
      return {
        ok: false,
        feedback: "This round use by + transport, e.g. by bus.",
      };
    }
    if (/\bby\s+(bus|taxi|train|plane|air|car|subway|metro|bike)\b/.test(a)) {
      return { ok: true, feedback: "" };
    }
    return {
      ok: false,
      feedback: "Use by + transport, e.g. by bus / by taxi / by train.",
    };
  }

  if (/\bby\s+(bus|taxi|train|plane|car)\b/.test(a)) {
    return {
      ok: false,
      feedback:
        "This round use in or on, not by bus. Say e.g. on the bus, in a taxi.",
    };
  }
  if (
    /\bi\s*['']?m\s+(on|in)\s+(the|a|an|my)?\s*/.test(a) ||
    /\bi\s*am\s+(on|in)\s+(the|a|an|my)?\s*/.test(a) ||
    /\b(in the|in a|in my|on the|on an|on foot)\b/.test(a) ||
    /\b(in|on)\s+(bus|train|plane|taxi|car)\b/.test(a)
  ) {
    return { ok: true, feedback: "" };
  }
  return {
    ok: false,
    feedback: "Use in or on, e.g. I'm on the bus, in a taxi, on foot.",
  };
}

function statusNpcLine(card: StatusCard, destLabel: string): string {
  if (/how was the trip/i.test(card.npcQuestion)) {
    return `How was the trip to ${destLabel}?`;
  }
  return `How are you after going to ${destLabel}?`;
}

function answerMatchesStatusLabel(answer: string, card: StatusCard): boolean {
  const a = normalize(answer).toLowerCase();
  const key = card.label.toLowerCase();
  const labelWords: Record<string, RegExp> = {
    happy: /\bhappy\b/,
    sick: /\b(sick|ill|not\s+well)\b/,
    tired: /\b(tired|exhausted|sleepy)\b/,
    terrible: /\b(terrible|awful|horrible|bad)\b/,
  };
  return labelWords[key]?.test(a) ?? false;
}

function validateStatus(answer: string, card: StatusCard): {
  ok: boolean;
  feedback: string;
} {
  const a = normalize(answer);
  if (
    card.expectedPatterns.some((p) => p.test(a)) ||
    answerMatchesStatusLabel(a, card)
  ) {
    return { ok: true, feedback: "" };
  }
  return {
    ok: false,
    feedback: `Your card is ${card.label}. ${card.hint}`,
  };
}

function wheelDisplayLabel(label: string): string {
  return label.replace(/^the\s+/i, "");
}

function buildWheelSVG(wheelDests: Destination[]): string {
  const n = wheelDests.length;
  const seg = 360 / n;
  const colors = [
    "#81d4fa",
    "#4fc3f7",
    "#29b6f6",
    "#03a9f4",
    "#039be5",
    "#0288d1",
    "#0277bd",
    "#01579b",
  ];
  let paths = "";
  wheelDests.forEach((d, i) => {
    const start = (i * seg - 90) * (Math.PI / 180);
    const end = ((i + 1) * seg - 90) * (Math.PI / 180);
    const x1 = 50 + 48 * Math.cos(start);
    const y1 = 50 + 48 * Math.sin(start);
    const x2 = 50 + 48 * Math.cos(end);
    const y2 = 50 + 48 * Math.sin(end);
    const large = seg > 180 ? 1 : 0;
    const mid = ((i + 0.5) * seg - 90) * (Math.PI / 180);
    const tx = 50 + 34 * Math.cos(mid);
    const ty = 50 + 34 * Math.sin(mid);
    const rot = (i + 0.5) * seg;
    paths += `<path d="M50,50 L${x1},${y1} A48,48 0 ${large},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="0.5"/>`;
    const display = wheelDisplayLabel(d.label);
    const short =
      display.length > 14 ? display.slice(0, 13) + "…" : display;
    paths += `<text x="${tx}" y="${ty}" fill="#fff" font-size="5.2" font-weight="bold" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot}, ${tx}, ${ty})">${short}</text>`;
  });
  return `<svg viewBox="0 0 100 100" class="w-full h-full">${paths}</svg>`;
}

function showIntro() {
  progressLabel.textContent = "Departure briefing";
  render(`
    <div class="tech-panel w-full">
      <h2 class="text-2xl md:text-3xl font-bold text-sky-300 mb-6 md:mb-8">✈️ Departure &amp; Surprises</h2>
      <div class="story-intro-body text-sky-100">
        <p>
          Your <strong>Tour Guide</strong> is leading a small group trip.<br />
          Before the bus leaves, you need to practice real travel English.
        </p>
        <p>
          <strong>Spin the wheel</strong> to pick where you go next —<br />
          school, the beach, Taipei, the museum, and more.
        </p>
        <p>
          At each stop you will:<br />
          say how you get there (<strong>by</strong> bus, train, taxi…),<br />
          say where you are right now (<strong>in</strong> a taxi, <strong>on</strong> the bus),<br />
          then answer <strong>How are you?</strong> or <strong>How was the trip?</strong>
        </p>
        <p class="text-sky-300 font-medium text-lg md:text-xl leading-relaxed">
          Complete <strong>${PASS_LOCATIONS} destinations</strong> —<br />
          then you are ready for departure!
        </p>
      </div>
      <button id="btn-start" type="button" class="story-intro-btn mt-8 md:mt-10 w-full bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.4)] action-btn-pulse">
        Start —<br />
        spin the wheel!
      </button>
    </div>
  `);
  playIntroOnStoryScreen();
  document.getElementById("btn-start")!.addEventListener("click", () => {
    playEnterGameSfx();
    startTravelerBgm(TRAVELER_BGM.trip);
    updateHUD();
    showSpinPhase();
  });
}

function showSpinPhase(banner?: string) {
  const wheelDests = getWheelDestinations();
  render(`
    ${banner ? `<p class="text-center text-green-700 font-bold mb-3">${banner}</p>` : ""}
    <div class="tech-panel mb-4">
      ${renderNpcBlock({
        id: "guide",
        line: "Spin the wheel — where shall we travel next?",
      })}
    </div>
    <div class="tech-panel text-center">
      <div class="wheel-wrap">
        <div class="wheel-pointer"></div>
        <div id="wheel" class="wheel" style="transform: rotate(0deg)">${buildWheelSVG(wheelDests)}</div>
      </div>
      <p id="spin-result" class="text-lg font-bold text-sky-300 mt-4 min-h-[1.5rem]"></p>
      <button id="btn-spin" type="button" class="mt-4 px-8 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.4)] disabled:opacity-50 action-btn-pulse">
        🎡 Spin the wheel
      </button>
      <button id="btn-to-transport" type="button" class="mt-3 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 hidden">
        Go! Answer transport →
      </button>
    </div>
  `);

  const wheel = document.getElementById("wheel")!;
  const btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
  const btnNext = document.getElementById("btn-to-transport") as HTMLButtonElement;
  const spinResult = document.getElementById("spin-result")!;

  btnSpin.addEventListener("click", () => {
    if (wheelSpinning) return;
    wheelSpinning = true;
    btnSpin.disabled = true;
    playEnterGameSfx();

    const pool = getWheelDestinations();
    const picked = pool[Math.floor(Math.random() * pool.length)];
    currentDestination = picked;
    resetStopState();

    const n = pool.length;
    const seg = 360 / n;
    const idx = pool.findIndex((d) => d.label === picked.label);
    const extra = 5 * 360 + (360 - idx * seg - seg / 2);
    wheel.style.transform = `rotate(${extra}deg)`;

    setTimeout(() => {
      wheelSpinning = false;
      spinResult.textContent = `📍 Destination: ${picked.label}`;
      btnNext.classList.remove("hidden");
    }, 4200);
  });

  btnNext.addEventListener("click", () => {
    if (!currentDestination) return;
    showTransportPhase();
  });
}

function showTransportPhase() {
  if (!currentDestination) return;
  const dest = currentDestination;
  currentTransportMode = getTransportModeForStop();
  const mode = currentTransportMode;

  render(`
    <div class="tech-panel mb-4">
      ${renderNpcBlock({
        id: "guide",
        line: dest.question,
        subline: `Destination: ${dest.label}`,
      })}
    </div>
    ${renderRoundHintBox(mode)}
    <div class="tech-panel mb-4">
      <label class="block text-sm font-bold text-sky-200/70 mb-2">Your answer (English):</label>
      <input id="transport-input" type="text" class="w-full border-2 border-sky-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-sky-400 outline-none placeholder:text-sky-200/50" placeholder="Type your answer..." autocomplete="off" />
      <p id="transport-feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn-submit-transport" type="button" class="mt-4 w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.4)] action-btn-pulse">Submit</button>
    </div>
  `);

  const input = document.getElementById("transport-input") as HTMLInputElement;
  const feedback = document.getElementById("transport-feedback")!;
  document
    .getElementById("btn-submit-transport")!
    .addEventListener("click", () => submitTransport(input, feedback));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTransport(input, feedback);
  });
  input.focus();
}

function showWhereAreYouPhase() {
  if (!currentDestination) return;
  currentTransportMode = "in_on";

  render(`
    <div class="tech-panel mb-4">
      ${renderNpcBlock({
        id: "guide",
        line: "Where are you?",
        subline: whereAreYouTransportHint(),
      })}
    </div>
    ${renderRoundHintBox("in_on")}
    <div class="tech-panel mb-4">
      <label class="block text-sm font-bold text-sky-200/70 mb-2">Your answer (English):</label>
      <input id="transport-input" type="text" class="w-full border-2 border-sky-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-sky-400 outline-none placeholder:text-sky-200/50" placeholder="e.g. I'm on the bus..." autocomplete="off" />
      <p id="transport-feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn-submit-transport" type="button" class="mt-4 w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.4)] action-btn-pulse">Submit</button>
    </div>
  `);

  const input = document.getElementById("transport-input") as HTMLInputElement;
  const feedback = document.getElementById("transport-feedback")!;
  document
    .getElementById("btn-submit-transport")!
    .addEventListener("click", () => submitTransport(input, feedback));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTransport(input, feedback);
  });
  input.focus();
}

function submitTransport(input: HTMLInputElement, feedbackEl: HTMLElement) {
  const val = input.value;
  if (!val.trim()) {
    feedbackEl.textContent = "Please enter an answer.";
    return;
  }
  playSubmitSfx();
  const result = validateTransport(val, currentTransportMode);
  if (result.ok) {
    feedbackEl.className = "text-green-600 text-sm mt-2";
    if (currentTransportMode === "by") {
      lastByTransportAnswer = normalize(val);
      transportStepAtStop = 1;
      showWhereAreYouPhase();
    } else {
      showStatusPhase();
    }
  } else {
    feedbackEl.className = "text-red-600 text-sm mt-2";
    feedbackEl.textContent = result.feedback;
  }
}

function showStatusPhase() {
  const card = STATUS_CARDS[Math.floor(Math.random() * STATUS_CARDS.length)];
  currentStatusCard = card;
  const dest = currentDestination!;

  render(`
    <div class="tech-panel mb-4">
      <p class="text-center text-sky-200/80 mb-4">Draw a status card — use the word on your card in your answer:</p>
      <div class="status-card mb-4">
        <span class="text-6xl">${card.emoji}</span>
        <span class="mt-2 font-bold text-purple-300">${card.label}</span>
      </div>
      ${renderHintBox(card.hint)}
      <div class="tech-panel mb-4">
        ${renderNpcBlock({
          id: "guide",
          line: statusNpcLine(card, dest.label),
        })}
      </div>
      <label class="block text-sm font-bold text-sky-200/70 mb-2">Your answer (English):</label>
      <input id="status-input" type="text" class="w-full border-2 border-purple-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-purple-400 outline-none placeholder:text-purple-200/50" placeholder="e.g. I'm ${card.label.toLowerCase()}…" autocomplete="off" />
      <p id="status-feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn-submit-status" type="button" class="mt-4 w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] action-btn-pulse">Submit</button>
    </div>
  `);

  const input = document.getElementById("status-input") as HTMLInputElement;
  const feedback = document.getElementById("status-feedback")!;
  document
    .getElementById("btn-submit-status")!
    .addEventListener("click", () => submitStatus(input, feedback));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitStatus(input, feedback);
  });
  input.focus();
}

function submitStatus(input: HTMLInputElement, feedbackEl: HTMLElement) {
  if (!currentStatusCard || !currentDestination) return;
  const val = input.value;
  if (!val.trim()) {
    feedbackEl.textContent = "Please enter an answer.";
    return;
  }
  playSubmitSfx();
  const result = validateStatus(val, currentStatusCard);
  if (result.ok) {
    usedDestinations.push(currentDestination.label);
    locationsDone++;
    updateHUD();

    if (locationsDone >= PASS_LOCATIONS) {
      feedbackEl.className = "text-green-600 text-sm mt-2";
      feedbackEl.textContent = "🎉 All three destinations completed!";
      setTimeout(() => endGame(true), 1200);
    } else {
      beginNextDestinationRound(
        `✓ Cleared! ${locationsDone} destination(s) done. Ready for the next stop…`,
      );
    }
  } else {
    feedbackEl.className = "text-red-600 text-sm mt-2";
    feedbackEl.textContent = result.feedback;
  }
}

function endGame(won: boolean) {
  stopAllTravelerAudio();
  if (won) {
    localStorage.setItem("traveler_quest_level1_complete", "true");
  }
  const sessionData = tracker.endGame(
    won ? "completed" : "abandoned",
    locationsDone,
    PASS_LOCATIONS,
    PASS_LOCATIONS,
  );
  if (sessionData) {
    showResult(sessionData, userName);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = ProgressTracker.getCurrentUser();
  if (!user) {
    alert("Please log in at Grammar Hub first!");
    window.location.href = WH_HUB_RETURN;
    return;
  }
  userName = user;
  tracker.setUserName(userName);
  tracker.setUnitName("WHQA-Traveler-Level1-Journey");
  tracker.startGame();

  initScoreboard({
    onRestart: () => {
      locationsDone = 0;
      usedDestinations = [];
      currentDestination = null;
      wheelSpinning = false;
      resetStopState();
      tracker.startGame();
      showIntro();
    },
    onHome: () => {
      stopAllTravelerAudio();
      window.location.href = WH_HUB_RETURN;
    },
  });

  document.getElementById("hub-link")?.addEventListener("click", () => stopAllTravelerAudio());
  window.addEventListener("beforeunload", () => stopAllTravelerAudio());

  showIntro();
});
