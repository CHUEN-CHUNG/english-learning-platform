import { GrammarDataTracker } from "../../../../../shared/game-core/GrammarDataTracker";
import { initScoreboard, showResult } from "../../../../../shared/game-core/GrammarScoreboard";
import { renderNpcBlock } from "../../shared/npc-ui";
import { initNpcSpeech } from "../../shared/traveler-npc-speech";
import { playEnterGameSfx } from "../../shared/enter-game-sfx";
// @ts-ignore
import { ProgressTracker } from "../../../../../shared/utils/ProgressTracker";

const WH_HUB_RETURN = "/apps/grammar-hub/index.html?tab=wh";


const TIME_TASKS = [
  { id: "cook_rice", label: "cook rice", verb: "cook rice" },
  { id: "drive_work", label: "drive to work", verb: "drive to work" },
  { id: "watch_movie", label: "watch a movie", verb: "watch a movie" },
];

const tracker = new GrammarDataTracker("TravelerHowLong");

let userName = "";

let npcTimes: Record<string, number> = {};
let studentTimes: Record<string, number> = {};
let currentTimeTaskIdx = 0;
let round1GuessCorrect = false;

const gameMain = document.getElementById("game-main")!;
const phaseLabel = document.getElementById("phase-label")!;

function render(html: string) {
  gameMain.innerHTML = html;
  initNpcSpeech(gameMain);
}

function randomMinutes(): number {
  const opts = [10, 15, 20, 30, 45, 60, 90, 120];
  return opts[Math.floor(Math.random() * opts.length)];
}

function initNpcTimes() {
  TIME_TASKS.forEach((t) => {
    npcTimes[t.id] = randomMinutes();
  });
}

function validateGuessQuestion(text: string, minutes: number, verb: string): boolean {
  const t = text.trim();
  const hasTime = new RegExp(`\\b${minutes}\\s*(minutes?|mins?|hours?|hrs?)\\b`, "i").test(t);
  const hasVerb = t.toLowerCase().includes(verb.toLowerCase());
  const hasTake =
    /\b(does\s+it\s+take|do\s+you\s+take)\b/i.test(t) && /\bto\s+/i.test(t);
  return hasTake && hasTime && hasVerb;
}

function validateHowLongQuestion(text: string, verb: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    (/\bhow\s+long\s+does\s+it\s+take\b/.test(t) ||
      /\bhow\s+long\s+do\s+you\s+take\b/.test(t)) &&
    t.includes(verb.toLowerCase())
  );
}

function validateItTakesAnswer(text: string, minutes: number, verb: string): boolean {
  const t = text.trim();
  const hasTime = new RegExp(`\\b${minutes}\\s*(minutes?|mins?|hours?|hrs?)\\b`, "i").test(t);
  const hasItTakes = /\bit\s+takes?\b/i.test(t);
  const hasVerb = t.toLowerCase().includes(verb.toLowerCase());
  return hasItTakes && hasTime && hasVerb;
}


// ─── How long ───

function showPartBIntro() {
  phaseLabel.textContent = "Time Planner · How long";
  initNpcTimes();
  studentTimes = {};
  currentTimeTaskIdx = 0;

  render(`
    <div class="detective-panel mb-4">
      ${renderNpcBlock({
        id: "planner",
        line: "I have secret times for each task. Can you guess them?",
        subline: "Set your secret times first, then try to guess mine!",
      })}
    </div>
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-blue-500 mb-4">
      <h2 class="text-xl font-bold text-blue-800 mb-3">⏱️ Time Planner (How long)</h2>
      <ol class="list-decimal list-inside text-gray-700 space-y-2 text-sm md:text-base mb-4">
        <li>Student and NPC each set a secret time for every activity.</li>
        <li><strong>Round 1</strong>: Student guesses the NPC's time (Does it take … to …?)</li>
        <li>If wrong, ask: <strong>How long does it take to …?</strong></li>
        <li><strong>Round 2</strong>: NPC guesses the student's time; student answers with It takes…</li>
      </ol>
      <h3 class="font-bold text-gray-800 mb-2">Set your secret time (minutes)</h3>
      ${TIME_TASKS.map(
        (t) => `
        <label class="block text-sm text-gray-600 mt-2">${t.label}</label>
        <input data-student-time="${t.id}" type="number" min="1" max="300" class="w-full border-2 rounded-xl px-4 py-2 mb-1" placeholder="minutes" />
      `,
      ).join("")}
      <p id="time-setup-feedback" class="text-red-600 text-sm mt-2"></p>
      <button id="btn-start-b" type="button" class="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-xl">
        Start Round 1
      </button>
    </div>
  `);

  document.getElementById("btn-start-b")!.addEventListener("click", () => {
    const fb = document.getElementById("time-setup-feedback")!;
    for (const t of TIME_TASKS) {
      const inp = document.querySelector(
        `[data-student-time="${t.id}"]`,
      ) as HTMLInputElement;
      const v = parseInt(inp?.value || "0", 10);
      if (!v || v < 1) {
        fb.textContent = `Please set minutes for "${t.label}".`;
        return;
      }
      studentTimes[t.id] = v;
    }
    playEnterGameSfx();
    showPartBRound1Guess();
  });
}

function showPartBRound1Guess() {
  const task = TIME_TASKS[currentTimeTaskIdx];
  const npcMin = npcTimes[task.id];

  render(`
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-blue-500 mb-4">
      <p class="text-sm text-blue-700 font-bold mb-2">Round 1 · Student guesses NPC's time</p>
      ${renderNpcBlock({
        id: "planner",
        line: `I'm thinking about ${task.label}… (my time is secret!)`,
        subline: "Use Does it take … minutes to …? to guess",
        className: "mb-4",
      })}
      <p class="text-gray-700 mb-2">Ask with a guess sentence, for example:</p>
      <p class="text-sm text-gray-500 italic mb-3">Does it take 20 minutes to ${task.verb}?</p>
      <input id="guess-q" type="text" class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg" placeholder="Does it take ___ minutes to ...?" />
      <p id="r1-feedback" class="text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn-guess-submit" type="button" class="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Submit guess</button>
    </div>
  `);

  document.getElementById("btn-guess-submit")!.addEventListener("click", () => {
    const fb = document.getElementById("r1-feedback")!;
    const val = (document.getElementById("guess-q") as HTMLInputElement).value;
    const match = val.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)?/i);
    if (!match) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = "Include a time, e.g. Does it take 20 minutes to cook rice?";
      return;
    }
    let guessed = parseInt(match[1], 10);
    if (/hour|hr/i.test(val) && !/minute|min/i.test(val)) guessed *= 60;

    if (guessed === npcMin && validateGuessQuestion(val, npcMin, task.verb)) {
      round1GuessCorrect = true;
      fb.className = "text-green-600 text-sm mt-2";
      fb.textContent = `✓ Correct! The NPC's time is ${npcMin} minutes.`;
      setTimeout(() => showPartBRound2TeacherGuess(), 1200);
    } else {
      round1GuessCorrect = false;
      fb.className = "text-orange-600 text-sm mt-2";
      fb.textContent = "Wrong guess! Ask with a How long question for the correct time.";
      setTimeout(() => showPartBRound1HowLong(val), 800);
    }
  });
}

function showPartBRound1HowLong(wrongGuess: string) {
  const task = TIME_TASKS[currentTimeTaskIdx];
  render(`
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-blue-500 mb-4">
      <p class="text-orange-700 font-bold mb-2">Wrong guess — ask the correct question</p>
      <p class="text-sm text-gray-500 mb-2">You asked: ${wrongGuess}</p>
      ${renderNpcBlock({
        id: "planner",
        line: `How long does it take to ${task.verb}?`,
        subline: "Use this question to get the correct time",
        className: "mb-3",
      })}
      <input id="howlong-q" type="text" class="w-full border-2 rounded-xl px-4 py-3" placeholder="How long does it take to ...?" />
      <p id="hl-feedback" class="text-sm mt-2"></p>
      <button id="btn-hl-submit" type="button" class="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Submit</button>
    </div>
  `);
  document.getElementById("btn-hl-submit")!.addEventListener("click", () => {
    const fb = document.getElementById("hl-feedback")!;
    const val = (document.getElementById("howlong-q") as HTMLInputElement).value;
    if (!validateHowLongQuestion(val, task.verb)) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = `Use: How long does it take to ${task.verb}?`;
      return;
    }
    fb.className = "text-green-600 text-sm mt-2";
    fb.textContent = `✓ Correct! The answer is: It takes ${npcTimes[task.id]} minutes to ${task.verb}.`;
    setTimeout(() => showPartBRound2TeacherGuess(), 1500);
  });
}

function showPartBRound2TeacherGuess() {
  const task = TIME_TASKS[currentTimeTaskIdx];
  const studentMin = studentTimes[task.id];

  render(`
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-blue-500 mb-4">
      <p class="text-sm text-blue-700 font-bold mb-2">Round 2 · NPC guesses student's time</p>
      <div class="teacher-panel mb-4">
        <p class="font-bold text-orange-800">🤖 NPC: how many minutes for the student's ${task.label}?</p>
        <input id="teacher-time-guess" type="number" class="mt-2 w-full border-2 rounded-xl px-4 py-2" placeholder="minutes" />
        <button id="btn-teacher-guess" type="button" class="mt-2 px-4 py-2 bg-orange-500 text-white font-bold rounded-lg">NPC submits guess</button>
      </div>
      <p id="teacher-guess-result" class="text-sm mb-4"></p>
      <p class="text-gray-700 font-bold mb-2">Student: answer with a full sentence:</p>
      <p class="text-sm text-gray-500 italic mb-2">It takes ${studentMin} minutes to ${task.verb}.</p>
      <input id="student-answer" type="text" class="w-full border-2 rounded-xl px-4 py-3" placeholder="It takes ... minutes to ..." />
      <p id="r2-feedback" class="text-sm mt-2"></p>
      <button id="btn-answer-submit" type="button" class="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-xl">Submit answer</button>
    </div>
  `);

  document.getElementById("btn-teacher-guess")!.addEventListener("click", () => {
    const tg = parseInt(
      (document.getElementById("teacher-time-guess") as HTMLInputElement).value,
      10,
    );
    const res = document.getElementById("teacher-guess-result")!;
    if (!tg) {
      res.textContent = "Please enter the NPC's guess.";
      return;
    }
    res.className = tg === studentMin ? "text-green-700 text-sm mb-4" : "text-red-600 text-sm mb-4";
    res.textContent =
      tg === studentMin
        ? `🎉 The NPC guessed right! (${studentMin} minutes)`
        : `NPC guessed ${tg} minutes; the actual time is ${studentMin} minutes.`;
  });

  document.getElementById("btn-answer-submit")!.addEventListener("click", () => {
    const fb = document.getElementById("r2-feedback")!;
    const val = (document.getElementById("student-answer") as HTMLInputElement).value;
    if (!validateItTakesAnswer(val, studentMin, task.verb)) {
      fb.className = "text-red-600 text-sm mt-2";
      fb.textContent = `Use: It takes ${studentMin} minutes to ${task.verb}.`;
      return;
    }
    fb.className = "text-green-600 text-sm mt-2";
    fb.textContent = "✓ Correct answer!";

    currentTimeTaskIdx++;
    if (currentTimeTaskIdx >= TIME_TASKS.length) {
      setTimeout(finishHowLong, 1200);
    } else {
      setTimeout(() => {
        round1GuessCorrect = false;
        showPartBRound1Guess();
      }, 1500);
    }
  });
}

function finishHowLong() {
  localStorage.setItem("traveler_quest_how_long_complete", "true");
  render(`
    <div class="bg-white rounded-2xl shadow-md p-8 border-b-4 border-blue-500 text-center">
      <p class="text-5xl mb-4">🎉</p>
      <h2 class="text-2xl font-bold text-blue-800 mb-2">Time Planner complete!</h2>
      <p class="text-gray-600">You practiced How long, Does it take…?, and It takes… sentences.</p>
      <button id="btn-finish" type="button" class="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl">View results</button>
    </div>
  `);
  document.getElementById("btn-finish")!.addEventListener("click", () => {
    const sessionData = tracker.endGame("completed", 3, 3, 1);
    if (sessionData) showResult(sessionData, userName);
  });
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
  tracker.setUnitName("WHQA-Traveler-How-Long");
  tracker.startGame();

  initScoreboard({
    onRestart: () => {
      tracker.startGame();
      showPartBIntro();
    },
    onHome: () => {
      window.location.href = WH_HUB_RETURN;
    },
  });

  showPartBIntro();
});
