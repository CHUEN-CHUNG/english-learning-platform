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
  loadNewClassClassmates,
  loadNewClassNpcFreqTemplates,
  loadNewClassWheelActivities,
  pickNpcFreqAnswerFromBank,
  type WheelActivityRow,
} from "../../shared/traveler-quest-bank";
// @ts-ignore
import { ProgressTracker } from "../../../../../shared/utils/ProgressTracker";

const WH_HUB_RETURN = "/apps/grammar-hub/index.html?tab=wh&series=how";
const PASS_ROUNDS = 3;

interface ClassmateFriend {
  emoji: string;
  label: string;
}

const NEW_CLASSMATES: ClassmateFriend[] = loadNewClassClassmates();
const NPC_FREQ_TEMPLATES = loadNewClassNpcFreqTemplates();

const FREQ_ADVERB_PATTERN =
  /\b(always|usually|often|sometimes|seldom|never)\b/i;
const FREQ_PHRASE_PATTERN =
  /\b(every\s+day|every\s+week|once\s+a\s+\w+|twice\s+a\s+\w+|three\s+times\s+a\s+\w+|\d+\s+times\s+a\s+\w+)\b/i;
const FREQ_PATTERN = new RegExp(
  `${FREQ_ADVERB_PATTERN.source}|${FREQ_PHRASE_PATTERN.source}`,
  "i",
);

type WheelActivity = WheelActivityRow;

const WHEEL_ACTIVITIES: WheelActivity[] = loadNewClassWheelActivities();

const tracker = new GrammarDataTracker("TravelerLevel2Schedule");

let userName = "";
let roundsDone = 0;
let usedIds: string[] = [];
let current: WheelActivity | null = null;
let wheelSpinning = false;
let npcFreqAnswer = "";
let npcMinutes = 0;
/** 0 = frequency adverb answer, 1 = frequency phrase answer */
let howOftenAnswerStep = 0;
let friendsCollected: ClassmateFriend[] = [];

const gameMain = document.getElementById("game-main")!;
const phaseLabel = document.getElementById("phase-label")!;
const friendsBar = document.getElementById("friends-collected");

function render(html: string) {
  gameMain.innerHTML = html;
  initNpcSpeech(gameMain);
}

function renderHintBox(text: string): string {
  return `
    <div class="tech-panel text-center mb-4">
      <p class="text-emerald-300 font-bold text-lg">${text}</p>
    </div>
  `;
}

function updateHUD() {
  phaseLabel.textContent = `Round ${roundsDone} / ${PASS_ROUNDS} · Friends ${friendsCollected.length}/${PASS_ROUNDS}`;
}

function pickNewFriend(): ClassmateFriend {
  const remaining = NEW_CLASSMATES.filter(
    (c) => !friendsCollected.some((f) => f.label === c.label),
  );
  const pool = remaining.length ? remaining : NEW_CLASSMATES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateFriendsBar() {
  if (!friendsBar) return;
  const chips =
    friendsCollected.length > 0
      ? friendsCollected.map((f) => `<span class="friend-chip filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" title="${f.label}">${f.emoji}</span>`).join("")
      : '<span class="text-emerald-500/50">—</span>';
  friendsBar.innerHTML = `<span class="font-bold mr-1 text-emerald-400">Friends</span>${chips}<span class="ml-1 text-emerald-300/70">${friendsCollected.length}/${PASS_ROUNDS}</span>`;
}

function showFriendReward(friend: ClassmateFriend, onContinue: () => void) {
  phaseLabel.textContent = `New friend · ${friendsCollected.length}/${PASS_ROUNDS}`;
  render(`
    <div class="tech-panel friend-reward-card text-center">
      <p class="text-emerald-400 font-bold text-lg mb-2">✓ Round complete!</p>
      <p class="text-2xl md:text-3xl font-bold text-emerald-300 mb-3">You made a new friend!</p>
      <p class="text-6xl mb-2 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" aria-hidden="true">${friend.emoji}</p>
      <p class="text-xl font-bold text-emerald-100 mb-4">${friend.label}</p>
      <p class="text-emerald-200/80 mb-6 leading-relaxed">
        ${friend.label} wants to keep chatting.<br />
        Friends in your class: ${friendsCollected.map((f) => f.emoji).join(" ")}
      </p>
      <button id="btn-friend-continue" type="button" class="w-full py-4 text-lg bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] action-btn-pulse">
        Continue
      </button>
    </div>
  `);
  document.getElementById("btn-friend-continue")!.addEventListener("click", onContinue);
}

function howOftenQuestion(act: WheelActivity): string {
  if (act.be) {
    const adj = act.activity.replace(/^be\s+/i, "");
    return `How often are you ${adj}?`;
  }
  return `How often do you ${act.activity}?`;
}

function howLongNpcQuestion(act: WheelActivity): string {
  if (act.be) {
    const adj = act.activity.replace(/^be\s+/i, "");
    return `How long are you ${adj}?`;
  }
  return `How long do you take to ${act.verb}?`;
}

const HOW_LONG_QUESTION_PLACEHOLDER = "How long does it take .....?";

function wheelDisplayLabel(label: string): string {
  return label.replace(/^the\s+/i, "");
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wheelLabelWords(label: string): string[] {
  return wheelDisplayLabel(label).split(/\s+/).filter(Boolean);
}

function buildWheelLabelText(
  tx: number,
  ty: number,
  rot: number,
  words: string[],
): string {
  const n = words.length;
  const maxLen = Math.max(...words.map((w) => w.length), 1);
  const lh = n > 2 ? 3.5 : 4.2;
  let fs = n === 1 ? 4.6 : n === 2 ? 4.1 : 3.6;
  if (maxLen > 9) fs = 3.2;
  else if (maxLen > 7) fs = 3.6;
  const startDy = n === 1 ? 0 : -((n - 1) * lh) / 2;
  const tspans = words
    .map((word, i) => {
      const dy = i === 0 ? startDy : lh;
      return `<tspan x="${tx}" dy="${dy}">${escapeXml(word)}</tspan>`;
    })
    .join("");
  return `<text x="${tx}" y="${ty}" fill="#fff" font-size="${fs}" font-weight="bold" text-anchor="middle" transform="rotate(${rot}, ${tx}, ${ty})">${tspans}</text>`;
}

function getWheelPool(): WheelActivity[] {
  const left = WHEEL_ACTIVITIES.filter((a) => !usedIds.includes(a.id));
  return left.length > 0 ? left : [...WHEEL_ACTIVITIES];
}

function buildWheelSVG(items: WheelActivity[]): string {
  const n = items.length;
  const seg = 360 / n;
  const colors = [
    "#a5d6a7",
    "#81c784",
    "#66bb6a",
    "#4caf50",
    "#43a047",
    "#388e3c",
    "#2e7d32",
    "#1b5e20",
  ];
  let paths = "";
  items.forEach((d, i) => {
    const start = (i * seg - 90) * (Math.PI / 180);
    const end = ((i + 1) * seg - 90) * (Math.PI / 180);
    const x1 = 50 + 48 * Math.cos(start);
    const y1 = 50 + 48 * Math.sin(start);
    const x2 = 50 + 48 * Math.cos(end);
    const y2 = 50 + 48 * Math.sin(end);
    const large = seg > 180 ? 1 : 0;
    const mid = ((i + 0.5) * seg - 90) * (Math.PI / 180);
    const textR = 28;
    const tx = 50 + textR * Math.cos(mid);
    const ty = 50 + textR * Math.sin(mid);
    const rot = (i + 0.5) * seg;
    paths += `<path d="M50,50 L${x1},${y1} A48,48 0 ${large},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="0.5"/>`;
    paths += buildWheelLabelText(tx, ty, rot, wheelLabelWords(d.label));
  });
  return `<svg viewBox="0 0 100 100" class="w-full h-full">${paths}</svg>`;
}

function randomMinutes(): number {
  const opts = [10, 15, 20, 30, 45, 60, 90];
  return opts[Math.floor(Math.random() * opts.length)];
}

function pickNpcFreqAnswer(act: WheelActivity): string {
  return pickNpcFreqAnswerFromBank(act, NPC_FREQ_TEMPLATES);
}

function hasFrequency(text: string): boolean {
  return FREQ_PATTERN.test(text);
}

function mentionsActivity(text: string, act: WheelActivity): boolean {
  const a = text.toLowerCase();
  let nounPhrase = act.activity.replace(/^(be|play|go to|do|watch|read|study)\s+/i, "").trim();
  if (nounPhrase.toLowerCase().startsWith("the ")) {
    nounPhrase = nounPhrase.substring(4).trim();
  }
  const key = nounPhrase.split(" ")[0];
  return a.includes(act.activity.toLowerCase()) || a.includes(key.toLowerCase());
}

function hasFreqAdverb(text: string): boolean {
  return FREQ_ADVERB_PATTERN.test(text);
}

function hasFreqPhrase(text: string): boolean {
  return FREQ_PHRASE_PATTERN.test(text);
}

function validateHowOftenAnswer(
  text: string,
  act: WheelActivity,
  mode: "adverb" | "phrase",
): string | null {
  if (!mentionsActivity(text, act)) {
    return `Mention the activity "${act.activity}".`;
  }
  if (mode === "adverb") {
    if (!hasFreqAdverb(text)) {
      return "Use a frequency adverb (e.g. usually, sometimes, never).";
    }
    if (hasFreqPhrase(text)) {
      return "This round use a frequency adverb only, not a phrase.";
    }
    return null;
  }
  if (!hasFreqPhrase(text)) {
    return "Use a frequency phrase (e.g. every day, twice a week, once a year).";
  }
  if (hasFreqAdverb(text) && !hasFreqPhrase(text)) {
    return "This round use a frequency phrase, not only an adverb.";
  }
  return null;
}

const TIME_NUMBER_WORDS =
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";

const TIME_DURATION_PATTERN = new RegExp(
  `\\b(?:${TIME_NUMBER_WORDS})(?:\\s*[-–]?\\s*(?:${TIME_NUMBER_WORDS}))?\\s*(?:minutes?|mins?|hours?|hrs?)\\b`,
  "i",
);

function hasTimeDuration(text: string): boolean {
  const t = text.toLowerCase();
  if (/\bhalf\s+an?\s+hour\b/.test(t) || /\ba\s+couple\s+of\s+(?:minutes?|hours?)\b/.test(t)) {
    return true;
  }
  return TIME_DURATION_PATTERN.test(t);
}

function hasDigitTime(text: string): boolean {
  return /\b\d+\s*(?:minutes?|mins?|hours?|hrs?)\b/i.test(text);
}

function validateStudentHowOftenQuestion(text: string, act: WheelActivity): string | null {
  const t = text.trim().toLowerCase();
  if (!/\bhow\s+often\b/.test(t)) {
    return 'Use "How often…?" to ask the NPC.';
  }
  if (!mentionsActivity(text, act)) {
    return `Ask about "${act.activity}".`;
  }
  return null;
}

function validateHowLongAnswer(text: string, act: WheelActivity): string | null {
  const t = text.trim();
  if (act.be) {
    if (!/\b(?:i|i'm|i\s+am)\b/i.test(t) || !/\bfor\b/i.test(t)) {
      const adj = act.activity.replace(/^be\s+/i, "");
      return `Use "I am ${adj} for … minutes."`;
    }
  } else {
    if (!/\bit\s+takes?\b/i.test(t)) {
      return `Use "It takes … minutes to ${act.verb}."`;
    }
  }

  if (hasDigitTime(t)) {
    return "Write the time in English words (e.g. thirty minutes), not digits.";
  }
  if (!hasTimeDuration(t)) {
    return "Include a time in words (e.g. twenty minutes).";
  }

  if (act.be) {
    const adj = act.activity.replace(/^be\s+/i, "").toLowerCase();
    if (!t.toLowerCase().includes(adj)) {
      return `Mention "${adj}" in your answer.`;
    }
  } else {
    if (!t.toLowerCase().includes(act.verb.toLowerCase().split(" ")[0])) {
      return `Mention "${act.verb}" in your answer.`;
    }
  }
  return null;
}

function validateStudentHowLongQuestion(text: string, act: WheelActivity): string | null {
  const t = text.trim().toLowerCase();
  if (act.be) {
    if (!/\bhow\s+long\s+are\s+you\b/.test(t)) {
      return 'Use "How long are you …?" to ask your classmate.';
    }
    const adj = act.activity.replace(/^be\s+/i, "").toLowerCase();
    if (!t.includes(adj)) {
      return `Ask about "${adj}".`;
    }
  } else {
    if (
      !/\bhow\s+long\s+does\s+it\s+take\b/.test(t) &&
      !/\bhow\s+long\s+do\s+you\s+take\b/.test(t)
    ) {
      return 'Use "How long does it take …?" to ask your classmate.';
    }
    if (!t.includes(act.verb.toLowerCase().split(" ")[0])) {
      return `Ask about "${act.verb}".`;
    }
  }
  return null;
}

function answerPanel(html: string, hint: string, inputId: string, btnId: string) {
  return `
    ${hint ? renderHintBox(hint) : ""}
    <div class="tech-panel mb-4">
      ${html}
      <label class="block text-sm font-bold text-emerald-200/70 mb-2 mt-4">Your answer (English):</label>
      <input id="${inputId}" type="text" class="w-full border-2 border-emerald-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-emerald-400 outline-none placeholder:text-emerald-200/50" placeholder="Type your answer..." autocomplete="off" />
      <p id="feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="${btnId}" type="button" class="mt-4 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Submit</button>
    </div>
  `;
}

function bindAnswer(inputId: string, btnId: string, onSubmit: (val: string, fb: HTMLElement) => void) {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const fb = document.getElementById("feedback")!;
  document.getElementById(btnId)!.addEventListener("click", () => {
    const v = input.value.trim();
    if (!v) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = "Please enter an answer.";
      return;
    }
    playSubmitSfx();
    onSubmit(v, fb);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById(btnId)!.click();
  });
  input.focus();
}

function showIntro() {
  phaseLabel.textContent = "New Class";
  friendsCollected = [];
  updateFriendsBar();
  render(`
    <div class="tech-panel w-full">
      <h2 class="text-2xl md:text-3xl font-bold text-emerald-300 mb-6 md:mb-8">🎒 New Class Icebreakers</h2>
      <div class="story-intro-body text-emerald-100">
        <p>
          It's your first day in a <strong>new class</strong>.<br />
          You want to make friends, but you do not know what to say.
        </p>
        <p>
          A classmate suggests a game:<br />
          <strong>spin the wheel</strong> to pick something you both do<br />
          (sports, homework, reading…).
        </p>
        <p>
          Then take turns —<br />
          answer <strong>How often</strong> with a frequency word and phrase,<br />
          ask your classmate back,<br />
          then talk about <strong>How long</strong> it takes.
        </p>
        <p class="text-emerald-300 font-medium text-lg md:text-xl leading-relaxed">
          Finish <strong>${PASS_ROUNDS} rounds</strong> of chat —<br />
          each round earns you <strong>one new friend</strong> in class!
        </p>
      </div>
      <button id="btn-start" type="button" class="story-intro-btn mt-8 md:mt-10 w-full bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] action-btn-pulse">
        Start —<br />
        spin for a topic!
      </button>
    </div>
  `);
  playIntroOnStoryScreen();
  document.getElementById("btn-start")!.addEventListener("click", () => {
    playEnterGameSfx();
    startTravelerBgm(TRAVELER_BGM.happyBackground);
    showSpinPhase();
  });
}

function showSpinPhase(banner?: string) {
  phaseLabel.textContent = `Round ${roundsDone + 1} · Pick a topic`;
  const pool = getWheelPool();
  render(`
    ${banner ? `<p class="text-center text-green-700 font-bold mb-3">${banner}</p>` : ""}
    <div class="tech-panel mb-4">
      ${renderNpcBlock({ id: "classmate", line: "Spin the wheel — what should we talk about this round?" })}
    </div>
    <div class="tech-panel text-center">
      <div class="wheel-wrap">
        <div class="wheel-pointer"></div>
        <div id="wheel" class="wheel" style="transform: rotate(0deg)">${buildWheelSVG(pool)}</div>
      </div>
      <p id="spin-result" class="text-lg font-bold text-emerald-300 mt-4 min-h-[1.5rem]"></p>
      <button id="btn-spin" type="button" class="mt-4 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50">🎡 Spin</button>
      <button id="btn-go" type="button" class="mt-3 px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hidden">Go → How often</button>
    </div>
  `);

  const wheel = document.getElementById("wheel")!;
  const btnSpin = document.getElementById("btn-spin") as HTMLButtonElement;
  const btnGo = document.getElementById("btn-go") as HTMLButtonElement;
  const spinResult = document.getElementById("spin-result")!;

  btnSpin.addEventListener("click", () => {
    if (wheelSpinning) return;
    wheelSpinning = true;
    btnSpin.disabled = true;
    playEnterGameSfx();
    const picked = pool[Math.floor(Math.random() * pool.length)];
    current = picked;
    howOftenAnswerStep = 0;
    npcFreqAnswer = pickNpcFreqAnswer(picked);
    npcMinutes = randomMinutes();

    const n = pool.length;
    const seg = 360 / n;
    const idx = pool.findIndex((a) => a.id === picked.id);
    const extra = 5 * 360 + (360 - idx * seg - seg / 2);
    wheel.style.transform = `rotate(${extra}deg)`;

    setTimeout(() => {
      wheelSpinning = false;
      spinResult.textContent = `📍 ${picked.label}`;
      btnGo.classList.remove("hidden");
    }, 4200);
  });

  btnGo.addEventListener("click", () => {
    if (!current) return;
    showHowOftenNpcAsk();
  });
}

function showHowOftenNpcAsk() {
  howOftenAnswerStep = 0;
  showHowOftenAnswerRound("adverb");
}

function showHowOftenAnswerRound(mode: "adverb" | "phrase") {
  const act = current!;
  const isAdverb = mode === "adverb";
  phaseLabel.textContent = isAdverb
    ? "How often · answer (adverb)"
    : "How often · answer (phrase)";

  render(`
    <div class="tech-panel mb-4">
      ${renderNpcBlock({ id: "classmate", line: howOftenQuestion(act) })}
    </div>
    ${answerPanel(
      "",
      isAdverb
        ? "This round: answer with a frequency word"
        : "This round: answer with a frequency phrase",
      "ans",
      "btn",
    )}
  `);

  bindAnswer("ans", "btn", (val, fb) => {
    const err = validateHowOftenAnswer(val, act, mode);
    if (err) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = err;
      return;
    }
    if (isAdverb) {
      howOftenAnswerStep = 1;
      showHowOftenAnswerRound("phrase");
    } else {
      showHowOftenStudentAsk();
    }
  });
}

function showHowOftenStudentAsk() {
  const act = current!;
  phaseLabel.textContent = "How often · Your turn to ask";
  render(`
    ${renderHintBox("Your turn — use How often…? to ask your classmate.")}
    <div class="tech-panel mb-4">
      <p class="text-sm text-emerald-200/50 mb-1">Topic from the wheel — ask your classmate:</p>
      <p class="font-bold text-emerald-300 text-lg mb-4">${act.label}</p>
      <label class="block text-sm font-bold text-emerald-200/70 mb-2">Your question</label>
      <input id="ans" type="text" class="w-full border-2 border-emerald-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-emerald-400 outline-none placeholder:text-emerald-200/50" placeholder="How often...?" autocomplete="off" />
      <p id="feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn" type="button" class="mt-4 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] action-btn-pulse">Submit question</button>
    </div>
  `);
  bindAnswer("ans", "btn", (val, fb) => {
    const err = validateStudentHowOftenQuestion(val, act);
    if (err) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = err;
      return;
    }
    showHowOftenNpcReply();
  });
}

function showHowOftenNpcReply() {
  const act = current!;
  phaseLabel.textContent = "How often · Classmate answers";
  render(`
    <div class="tech-panel mb-4">
      ${renderNpcBlock({
        id: "classmate",
        line: npcFreqAnswer,
      })}
    </div>
    <div class="tech-panel text-center">
      <p class="text-emerald-200/80 mb-4">Next: ask how long it takes!</p>
      <button id="btn-next" type="button" class="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition-colors shadow-[0_0_15px_rgba(20,184,166,0.4)] action-btn-pulse">Continue → How long</button>
    </div>
  `);
  document.getElementById("btn-next")!.addEventListener("click", showHowLongNpcAsk);
}

function showHowLongNpcAsk() {
  const act = current!;
  phaseLabel.textContent = "How long · Classmate asks";
  const hintText = act.be
    ? "This round: answer with I am … for … minutes (use English words for the number, e.g. thirty minutes)"
    : "This round: answer with It takes … minutes to … (use English words for the number, e.g. thirty minutes)";
  render(`
    <div class="tech-panel mb-4">
      ${renderNpcBlock({
        id: "classmate",
        line: howLongNpcQuestion(act),
      })}
    </div>
    ${answerPanel("", hintText, "ans", "btn")}
  `);
  bindAnswer("ans", "btn", (val, fb) => {
    const err = validateHowLongAnswer(val, act);
    if (err) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = err;
      return;
    }
    showHowLongStudentAsk();
  });
}

function showHowLongStudentAsk() {
  const act = current!;
  phaseLabel.textContent = "How long · Your turn to ask";
  const placeholder = act.be ? "How long are you .....?" : HOW_LONG_QUESTION_PLACEHOLDER;
  const hintText = act.be
    ? "Your classmate's time is a secret. Ask with How long are you...?"
    : "Your classmate's time is a secret. Ask with How long does it take...?";
  render(`
    ${renderHintBox(hintText)}
    <div class="tech-panel mb-4">
      <p class="text-emerald-100 mb-4">${hintText}</p>
      <p class="text-sm text-emerald-200/50 mb-1">Topic from the wheel — ask your classmate:</p>
      <p class="font-bold text-blue-300 text-lg mb-4">${act.label}</p>
      <label class="block text-sm font-bold text-emerald-200/70 mb-2">Your How long question:</label>
      <input id="ans" type="text" class="w-full border-2 border-emerald-400/30 bg-slate-800/50 text-white rounded-xl px-4 py-3 text-lg focus:border-emerald-400 outline-none placeholder:text-emerald-200/50" placeholder="${placeholder}" autocomplete="off" />
      <p id="feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn" type="button" class="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] action-btn-pulse">Submit question</button>
    </div>
  `);
  bindAnswer("ans", "btn", (val, fb) => {
    const err = validateStudentHowLongQuestion(val, act);
    if (err) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = err;
      return;
    }
    showHowLongNpcReply();
  });
}

function showHowLongNpcReply() {
  const act = current!;
  phaseLabel.textContent = "How long · Classmate answers";
  const replyLine = act.be
    ? `I am ${act.activity.replace(/^be\s+/i, "")} for ${npcMinutes} minutes.`
    : `It takes me ${npcMinutes} minutes to ${act.verb}.`;

  render(`
    <div class="tech-panel mb-4">
      ${renderNpcBlock({
        id: "classmate",
        line: replyLine,
        subline: "Your classmate answered your How long question.",
      })}
    </div>
    <div class="tech-panel text-center">
      <p class="text-green-400 font-bold mb-2">✓ Great chat!</p>
      <p class="text-emerald-200/80 mb-4">You are about to make a new friend…</p>
      <button id="btn-next" type="button" class="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] action-btn-pulse">Meet your new friend</button>
    </div>
  `);
  document.getElementById("btn-next")!.addEventListener("click", finishRound);
}

function finishRound() {
  if (!current) return;
  usedIds.push(current.id);
  const friend = pickNewFriend();
  friendsCollected.push(friend);
  roundsDone++;
  updateFriendsBar();
  updateHUD();
  current = null;

  showFriendReward(friend, () => {
    if (roundsDone >= PASS_ROUNDS) {
      endGame(true);
    } else {
      showSpinPhase("Pick another topic on the wheel and meet more classmates!");
    }
  });
}

function endGame(won: boolean) {
  stopAllTravelerAudio();
  if (won) {
    localStorage.setItem("traveler_quest_level2_complete", "true");
    localStorage.setItem("traveler_quest_how_often_complete", "true");
    localStorage.setItem("traveler_quest_how_long_complete", "true");
  }
  const sessionData = tracker.endGame(
    won ? "completed" : "abandoned",
    roundsDone,
    PASS_ROUNDS,
    PASS_ROUNDS,
  );
  if (sessionData) showResult(sessionData, userName);
}

document.addEventListener("DOMContentLoaded", () => {
  const user = ProgressTracker.getCurrentUser();
  if (!user) {
    alert("Please log in from the Grammar Hub first!");
    window.location.href = WH_HUB_RETURN;
    return;
  }
  userName = user;
  tracker.setUserName(userName);
  tracker.setUnitName("WHQA-Traveler-Level2-Schedule");
  tracker.startGame();

  initScoreboard({
    onRestart: () => {
      roundsDone = 0;
      usedIds = [];
      friendsCollected = [];
      current = null;
      updateFriendsBar();
      updateHUD();
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

  updateFriendsBar();
  updateHUD();
  showIntro();
});
