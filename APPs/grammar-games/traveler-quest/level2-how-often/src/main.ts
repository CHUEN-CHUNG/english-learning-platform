import { GrammarDataTracker } from "../../../../../shared/game-core/GrammarDataTracker";
import { initScoreboard, showResult } from "../../../../../shared/game-core/GrammarScoreboard";
import { renderNpcBlock } from "../../shared/npc-ui";
import { initNpcSpeech } from "../../shared/traveler-npc-speech";
import { playEnterGameSfx } from "../../shared/enter-game-sfx";
// @ts-ignore
import { ProgressTracker } from "../../../../../shared/utils/ProgressTracker";

const WH_HUB_RETURN = "/apps/grammar-hub/index.html?tab=wh";

const ACTIVITY_SETS: string[][] = [
  ["play tennis", "study English", "be sick"],
  ["go to the library", "watch TV", "do homework"],
  ["play basketball", "read books", "be late"],
];

const FREQ_ADVERB_PATTERN =
  /\b(always|usually|often|sometimes|seldom|never)\b/i;
const FREQ_PHRASE_PATTERN =
  /\b(every\s+day|every\s+week|once\s+a\s+\w+|twice\s+a\s+\w+|three\s+times\s+a\s+\w+|\d+\s+times\s+a\s+\w+)\b/i;
const FREQ_PATTERN = new RegExp(
  `${FREQ_ADVERB_PATTERN.source}|${FREQ_PHRASE_PATTERN.source}`,
  "i",
);

const tracker = new GrammarDataTracker("TravelerHowOften");

let userName = "";
let activities: string[] = [];
let studentSentences = ["", "", ""];
let fakeIndex = 0;
let teacherGuessIndex = -1;

const gameMain = document.getElementById("game-main")!;
const phaseLabel = document.getElementById("phase-label")!;

function render(html: string) {
  gameMain.innerHTML = html;
  initNpcSpeech(gameMain);
}

function pickActivitySet(): string[] {
  return [...ACTIVITY_SETS[Math.floor(Math.random() * ACTIVITY_SETS.length)]];
}

function howOftenQuestion(activity: string): string {
  if (/\bbe\s+/i.test(activity)) {
    return `How often are you ${activity.replace(/^be\s+/i, "")}?`;
  }
  return `How often do you ${activity}?`;
}

function freqPlaceholder(activity: string, index: number): string {
  if (/\bbe\s+/i.test(activity)) {
    const adj = activity.replace(/^be\s+/i, "");
    return index === 2
      ? `e.g. I am never ${adj}.`
      : `e.g. I am seldom ${adj}.`;
  }
  const templates = [
    (a: string) => `e.g. I usually ${a}.`,
    (a: string) => `e.g. I ${a} twice a week.`,
    (a: string) => `e.g. I never ${a}.`,
  ];
  return templates[index % templates.length](activity);
}

function hasFrequency(text: string): boolean {
  return FREQ_PATTERN.test(text);
}

function hasFreqAdverb(text: string): boolean {
  return FREQ_ADVERB_PATTERN.test(text);
}

function hasFreqPhrase(text: string): boolean {
  return FREQ_PHRASE_PATTERN.test(text);
}

function normalizeSentence(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractFrequencyMarker(text: string): string | null {
  const t = text.toLowerCase();
  const phrase = t.match(FREQ_PHRASE_PATTERN);
  if (phrase) return phrase[0].replace(/\s+/g, " ");
  const adv = t.match(FREQ_ADVERB_PATTERN);
  if (adv) return adv[0];
  return null;
}

function mentionsActivity(text: string, activity: string): boolean {
  const key = activity.replace(/^(be|play|go to|do|watch|read)\s+/i, "").split(" ")[0];
  return text.toLowerCase().includes(activity.toLowerCase()) || text.toLowerCase().includes(key.toLowerCase());
}

// ─── How often ───

function showPartAIntro() {
  phaseLabel.textContent = "How Often Challenge";
  activities = pickActivitySet();
  render(`
    <div class="detective-panel mb-4">
      ${renderNpcBlock({
        id: "planner",
        line: "Tell me how often you do these three activities!",
        subline: "Two truths and one lie—the NPC will guess the fake sentence.",
      })}
    </div>
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-emerald-500 mb-4">
      <h2 class="text-xl font-bold text-emerald-800 mb-3">📅 How Often Challenge</h2>
      <ol class="list-decimal list-inside text-gray-700 space-y-2 text-sm md:text-base">
        <li>Write one sentence for each activity. Use <strong>one frequency adverb</strong> and <strong>one frequency phrase</strong> (three different answers).</li>
        <li><strong>Two truths and one lie</strong>—select which sentence is your fake one.</li>
        <li>The NPC guesses which sentence is fake.</li>
        <li>Swap roles: the student asks the NPC with <strong>How often do/does…?</strong></li>
      </ol>
      <button id="btn-start-a" type="button" class="mt-6 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">
        Start How Often Challenge
      </button>
    </div>
  `);
  document.getElementById("btn-start-a")!.addEventListener("click", () => {
    playEnterGameSfx();
    showPartAWrite();
  });
}

function showPartAWrite() {
  render(`
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-emerald-500 mb-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <div>
          <p class="font-bold text-emerald-800 mb-2">Frequency adverbs</p>
          <ul class="space-y-1 text-gray-700 text-sm">
            <li>usually</li>
            <li>sometimes</li>
            <li>never</li>
          </ul>
        </div>
        <div>
          <p class="font-bold text-emerald-800 mb-2">Frequency phrases</p>
          <ul class="space-y-1 text-gray-700 text-sm">
            <li>every day</li>
            <li>twice a week</li>
            <li>once a year</li>
          </ul>
        </div>
      </div>
      <p class="text-sm text-emerald-800 mb-4">Include at least one adverb and one phrase. Do not repeat the same frequency word or the same full sentence.</p>
      ${activities
        .map(
          (a, i) => `
        <label class="block text-sm font-bold text-gray-600 mt-3">${howOftenQuestion(a)}</label>
        <input data-sentence="${i}" type="text" class="sentence-input w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-1" placeholder="${freqPlaceholder(a, i)}" />
      `,
        )
        .join("")}
      <p class="text-sm font-bold text-orange-700 mt-4">Which sentence is your fake one?</p>
      <div class="flex flex-col gap-2 mt-2">
        ${[0, 1, 2]
          .map(
            (i) => `
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="fake" value="${i}" ${i === 0 ? "checked" : ""} />
            <span>Sentence ${i + 1} is fake</span>
          </label>
        `,
          )
          .join("")}
      </div>
      <p id="write-feedback" class="text-red-600 text-sm mt-2"></p>
      <button id="btn-submit-sentences" type="button" class="mt-4 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">
        Submit sentences — ask the NPC to guess!
      </button>
    </div>
  `);

  document
    .getElementById("btn-submit-sentences")!
    .addEventListener("click", submitSentences);
}

function submitSentences() {
  const fb = document.getElementById("write-feedback")!;
  const inputs = document.querySelectorAll(
    ".sentence-input",
  ) as NodeListOf<HTMLInputElement>;
  studentSentences = [0, 1, 2].map((i) => inputs[i]?.value.trim() || "");

  for (let i = 0; i < 3; i++) {
    if (!studentSentences[i]) {
      fb.textContent = "Please complete all three sentences.";
      return;
    }
    if (!hasFrequency(studentSentences[i])) {
      fb.textContent = `Sentence ${i + 1}: add a frequency word or phrase (e.g. usually, every day, twice a year).`;
      return;
    }
    if (!mentionsActivity(studentSentences[i], activities[i])) {
      fb.textContent = `Sentence ${i + 1}: mention the activity "${activities[i]}".`;
      return;
    }
  }

  const hasAdverb = studentSentences.some((s) => hasFreqAdverb(s));
  const hasPhrase = studentSentences.some((s) => hasFreqPhrase(s));
  if (!hasAdverb || !hasPhrase) {
    fb.textContent =
      "Use at least one frequency adverb (e.g. usually, never) and one frequency phrase (e.g. every day, twice a week) across your three sentences.";
    return;
  }

  const seenSentences = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const key = normalizeSentence(studentSentences[i]);
    if (seenSentences.has(key)) {
      fb.textContent = `Sentence ${i + 1} repeats another answer. All three sentences must be different.`;
      return;
    }
    seenSentences.add(key);
  }

  const seenMarkers = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const marker = extractFrequencyMarker(studentSentences[i]);
    if (marker && seenMarkers.has(marker)) {
      fb.textContent = `Sentence ${i + 1} reuses "${marker}". Use a different frequency word or phrase in each sentence.`;
      return;
    }
    if (marker) seenMarkers.add(marker);
  }

  const fakeRadio = document.querySelector(
    'input[name="fake"]:checked',
  ) as HTMLInputElement;
  fakeIndex = parseInt(fakeRadio.value, 10);
  showPartANpcGuess();
}

function pickNpcGuess(): number {
  return Math.floor(Math.random() * 3);
}

function startsWithYes(text: string): boolean {
  return /^\s*yes\b/i.test(text.trim());
}

function startsWithNo(text: string): boolean {
  return /^\s*no\b/i.test(text.trim());
}

function contentAfterYesOrNo(text: string, word: "yes" | "no"): string {
  return text
    .trim()
    .replace(new RegExp(`^\\s*${word}[,!.\\s]*`, "i"), "")
    .trim();
}

function mentionsSentenceContent(
  answer: string,
  sentence: string,
  activity?: string,
): boolean {
  const a = answer.toLowerCase();
  if (activity) {
    const key = activity.replace(/^be\s+/i, "").toLowerCase();
    if (a.includes(key) || key.split(" ").some((w) => w.length > 2 && a.includes(w))) {
      return true;
    }
  }
  const skip = new Set([
    "i",
    "am",
    "is",
    "are",
    "do",
    "does",
    "the",
    "a",
    "an",
    "to",
    "my",
    "every",
    "once",
    "twice",
    "usually",
    "sometimes",
    "never",
    "often",
    "seldom",
    "always",
    "year",
    "week",
    "day",
  ]);
  const words = sentence
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !skip.has(w));
  let hits = 0;
  for (const w of words) {
    if (a.includes(w)) hits++;
  }
  return hits >= Math.min(2, Math.max(1, words.length));
}

function hasTruthCorrection(answer: string, fakeSentence: string): boolean {
  const a = answer.toLowerCase();
  if (/\b(don'?t|do not|doesn'?t|not|never|isn'?t|aren'?t|am not|hardly|rarely)\b/.test(a)) {
    return true;
  }
  return mentionsSentenceContent(answer, fakeSentence, activities[fakeIndex]);
}

function validateNpcAnswerResponse(text: string): {
  ok: boolean;
  feedback: string;
} {
  const val = text.trim();
  if (!val) {
    return { ok: false, feedback: "Please type your answer." };
  }

  const npcWasRight = teacherGuessIndex === fakeIndex;
  const fakeSentence = studentSentences[fakeIndex];
  const guessedSentence = studentSentences[teacherGuessIndex];
  const guessedNum = teacherGuessIndex + 1;

  if (npcWasRight) {
    if (!startsWithYes(val)) {
      return {
        ok: false,
        feedback:
          'The NPC is right — start with "Yes," then tell the truth. e.g. Yes, I don\'t usually play tennis.',
      };
    }
    if (contentAfterYesOrNo(val, "yes").length < 4) {
      return {
        ok: false,
        feedback: 'After "Yes," say the true fact (the opposite of your fake sentence).',
      };
    }
    if (!hasTruthCorrection(val, fakeSentence)) {
      return {
        ok: false,
        feedback: `After "Yes," tell the truth about your lie: "${fakeSentence}"`,
      };
    }
    return { ok: true, feedback: "" };
  }

  if (!startsWithNo(val)) {
    return {
      ok: false,
      feedback: `The NPC is wrong — start with "No," then affirm Sentence ${guessedNum}. e.g. No, ${guessedSentence}`,
    };
  }
  if (contentAfterYesOrNo(val, "no").length < 4) {
    return {
      ok: false,
      feedback: `After "No," say that Sentence ${guessedNum} is true.`,
    };
  }
  if (!mentionsSentenceContent(val, guessedSentence, activities[teacherGuessIndex])) {
    return {
      ok: false,
      feedback: `After "No," affirm Sentence ${guessedNum}: "${guessedSentence}"`,
    };
  }
  return { ok: true, feedback: "" };
}

function submitNpcAnswer(input: HTMLInputElement, fb: HTMLElement) {
  const result = validateNpcAnswerResponse(input.value);
  if (result.ok) {
    showPartAReveal();
    return;
  }
  fb.className = "text-red-600 text-sm mt-3";
  fb.textContent = result.feedback;
}

function showPartANpcGuess() {
  teacherGuessIndex = pickNpcGuess();
  const guessNum = teacherGuessIndex + 1;

  render(`
    <div class="detective-panel mb-4">
      ${renderNpcBlock({
        id: "planner",
        line: `I think Sentence ${guessNum} is fake!`,
      })}
    </div>
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-emerald-500 mb-4">
      <div class="mb-4 p-3 bg-purple-50 border-2 border-purple-300 rounded-xl">
        <p class="text-sm font-bold text-purple-800 mb-1">🔒 Your secret fake sentence</p>
        <p class="text-sm text-purple-700 mb-1">You marked Sentence ${fakeIndex + 1} as fake:</p>
        <p class="font-medium text-purple-900">${studentSentences[fakeIndex]}</p>
      </div>
      <p class="text-sm font-bold text-gray-600 mb-3">Your three sentences:</p>
      ${studentSentences
        .map((s, i) => {
          const tags: string[] = [];
          if (i === fakeIndex) tags.push("Your fake");
          if (i === teacherGuessIndex) tags.push("NPC's guess");
          const tagText = tags.length ? ` ← ${tags.join(" · ")}` : "";
          const border =
            i === fakeIndex && i === teacherGuessIndex
              ? "border-purple-400 bg-purple-50 ring-2 ring-orange-300"
              : i === fakeIndex
                ? "border-purple-400 bg-purple-50"
                : i === teacherGuessIndex
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200";
          return `
        <div class="border-2 ${border} rounded-xl p-4 mb-3">
          <p class="text-sm text-gray-500 mb-1">Sentence ${i + 1}${tagText}</p>
          <p class="font-medium text-gray-800">${s}</p>
        </div>
      `;
        })
        .join("")}
      <label class="block mb-2">
        <span class="text-sm font-bold text-gray-600">Your answer — </span>
        <span class="npc-line text-base text-gray-800">is the NPC wrong or right?</span>
      </label>
      <p class="text-sm text-gray-600 mb-2">
        ${
          teacherGuessIndex === fakeIndex
            ? 'NPC is right → start with <strong>Yes</strong>, then tell the truth (opposite of your fake).'
            : `NPC is wrong → start with <strong>No</strong>, then affirm Sentence ${guessNum} is true.`
        }
      </p>
      <input
        id="npc-answer-input"
        type="text"
        class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-emerald-500 outline-none"
        placeholder="${
          teacherGuessIndex === fakeIndex
            ? "e.g. Yes, I don't usually play tennis."
            : `e.g. No, ${studentSentences[teacherGuessIndex]}`
        }"
        autocomplete="off"
      />
      <p id="guess-feedback" class="text-red-600 text-sm mt-2 min-h-[1.25rem]"></p>
      <button id="btn-submit-npc-answer" type="button" class="mt-4 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">
        Submit
      </button>
    </div>
  `);

  const input = document.getElementById("npc-answer-input") as HTMLInputElement;
  const fb = document.getElementById("guess-feedback")!;
  document
    .getElementById("btn-submit-npc-answer")!
    .addEventListener("click", () => submitNpcAnswer(input, fb));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitNpcAnswer(input, fb);
  });
  input.focus();
}

function showPartAReveal() {
  const correct = teacherGuessIndex === fakeIndex;
  render(`
    <div class="bg-white rounded-2xl shadow-md p-6 border-b-4 border-emerald-500 mb-4">
      <p class="text-lg font-bold ${correct ? "text-green-700" : "text-red-600"} mb-4">
        ${correct ? "🎉 The NPC guessed right!" : "😅 Wrong guess! The fake sentence was #" + (fakeIndex + 1) + "."}
      </p>
      <p class="text-gray-700 mb-2">Fake sentence:</p>
      <p class="bg-red-50 border border-red-200 rounded-lg p-3 font-medium mb-4">${studentSentences[fakeIndex]}</p>
      <div class="teacher-panel">
        <p class="font-bold text-orange-800 mb-2">🔄 Swap roles</p>
        <p class="text-gray-700 text-sm mb-3">Now the student asks! Use How often to ask the NPC:</p>
        <ul class="text-sm space-y-1 text-gray-800">
          ${activities
            .map((a) => `<li>• ${howOftenQuestion(a)}</li>`)
            .join("")}
        </ul>
      </div>
      <button id="btn-part-a-done" type="button" class="mt-6 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">
        Finish How Often Challenge
      </button>
    </div>
  `);
  document.getElementById("btn-part-a-done")!.addEventListener("click", finishHowOften);
}

function finishHowOften() {
  localStorage.setItem("traveler_quest_how_often_complete", "true");
  render(`
    <div class="bg-white rounded-2xl shadow-md p-8 border-b-4 border-emerald-500 text-center">
      <p class="text-5xl mb-4">🎉</p>
      <h2 class="text-2xl font-bold text-emerald-800 mb-2">How Often Challenge complete!</h2>
      <p class="text-gray-600">Great job with frequency adverbs and How often questions.</p>
      <button id="btn-finish" type="button" class="mt-6 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl">View results</button>
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
  tracker.setUnitName("WHQA-Traveler-How-Often");
  tracker.startGame();

  initScoreboard({
    onRestart: () => {
      tracker.startGame();
      showPartAIntro();
    },
    onHome: () => {
      window.location.href = WH_HUB_RETURN;
    },
  });

  showPartAIntro();
});
