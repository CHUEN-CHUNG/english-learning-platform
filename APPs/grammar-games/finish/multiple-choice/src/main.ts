import { GrammarDataTracker } from "../../../../../shared/game-core/GrammarDataTracker";
import { bindTeacherDashboard } from "../../../../../shared/game-core/GrammarDashboard";
import { initScoreboard, showResult } from "../../../../../shared/game-core/GrammarScoreboard";
// @ts-ignore
import { ProgressTracker } from "../../../../../shared/utils/ProgressTracker";
import { findCsvUrlForUnit } from "./csv-banks";
import { playEnterGameSfx } from "../../../shared/enter-game-sfx";

interface Question {
  grammarPoint: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

interface ActiveMole {
  holeIndex: number;
  optionKey: string;
  button: HTMLButtonElement;
  hideTimer: number;
}

const THEME_PRESETS: Record<
  string,
  { title: string; emoji: string; bodyClass: string; accent: string }
> = {
  "Present-Simple-Choice": {
    title: "打地鼠 · Present Simple",
    emoji: "🎯",
    bodyClass: "bg-amber-50",
    accent: "border-amber-500",
  },
  "Present-Continuous-Choice": {
    title: "打地鼠 · Present Continuous",
    emoji: "🎯",
    bodyClass: "bg-amber-50",
    accent: "border-amber-500",
  },
  "Past-Simple-Choice": {
    title: "打地鼠 · Past Simple",
    emoji: "🎯",
    bodyClass: "bg-amber-50",
    accent: "border-amber-500",
  },
  "Future-Simple-Choice": {
    title: "打地鼠 · Future Simple",
    emoji: "🎯",
    bodyClass: "bg-amber-50",
    accent: "border-amber-500",
  },
  "WHQA-Traveler-Level1-MC": {
    title: "Super Traveler · Level 1",
    emoji: "✈️",
    bodyClass: "bg-sky-50",
    accent: "border-sky-500",
  },
  "WHQA-Traveler-Level3-MC": {
    title: "Super Traveler · Level 3",
    emoji: "🛍️",
    bodyClass: "bg-rose-50",
    accent: "border-rose-500",
  },
  "WHQA-How-Units9-10-MC": {
    title: "打地鼠 · Transport & Status",
    emoji: "✈️",
    bodyClass: "bg-sky-50",
    accent: "border-sky-500",
  },
  "WHQA-How-Units11-12-MC": {
    title: "打地鼠 · How Often & How Long",
    emoji: "🎒",
    bodyClass: "bg-amber-50",
    accent: "border-amber-500",
  },
  "WHQA-How-Unit14-Quantity-MC": {
    title: "打地鼠 · Souvenir Shop",
    emoji: "🛍️",
    bodyClass: "bg-rose-50",
    accent: "border-rose-500",
  },
};

/** 當初版本：3×2 共 6 洞 */
const HOLE_COUNT = 6;
const MAX_ACTIVE_MOLES = 3;
const MOLE_VISIBLE_MS = 2600;
const SPAWN_TICK_MS = 750;

const QUEST_PASS_CORRECT = 3;
const PRACTICE_DURATION_SEC = 900;
const QUEST_DURATION_SEC = 600;
const MAX_MISTAKES_PER_Q = 3;

const MOLE_FACE_DEFAULT = "🐹";
const MOLE_FACE_CORRECT = "🤩";
const MOLE_FACE_WRONG = "😵";

function isQuestMode(): boolean {
  return !!new URLSearchParams(window.location.search).get("questLevel");
}

let questions: Question[] = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let lives = 3;
let currentQuestionMistakes = 0;
let currentQuestionClicks = 0;
let currentQuestionWrongClicks = 0;

let timeLeft = PRACTICE_DURATION_SEC;
let timerInterval: number | null = null;
let spawnTickTimer: number | null = null;
let gameActive = false;
let isTransitioning = false;
let userName = "";
let unitName = "";

let activeMoles: ActiveMole[] = [];
let holeCells: HTMLDivElement[] = [];
let moleButtons: HTMLButtonElement[] = [];

const tracker = new GrammarDataTracker("MultipleChoice");

const WH_HUB_RETURN = "/apps/grammar-hub/index.html?tab=wh";

const livesDisplay = document.getElementById("lives-display")!;
const progressDisplay = document.getElementById("progress-display")!;
const timerDisplay = document.getElementById("timer-display")!;
const questionTextEl = document.getElementById("question-text")!;
const moleBoard = document.getElementById("mole-board")!;
const questionCard = document.getElementById("question-card")!;
const explanationModal = document.getElementById("explanation-modal")!;
const modalExplanation = document.getElementById("modal-explanation")!;
const nextBtn = document.getElementById("next-btn")!;
const hubLink = document.getElementById("hub-link") as HTMLAnchorElement;
const btnAddTime = document.getElementById("btn-add-time")!;
const btnMinusTime = document.getElementById("btn-minus-time")!;

function resolveReturnUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  if (returnTo) return returnTo;
  if (params.get("questLevel")) return WH_HUB_RETURN;
  return "../../../grammar-hub/index.html";
}

function applyHubReturnLink() {
  if (hubLink) hubLink.href = resolveReturnUrl();
}

function parseCSVLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function parseCSV(csv: string) {
  questions = [];
  const lines = csv.trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCSVLine(line);
    if (parts.length < 9) continue;

    const correct = parts[6].trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(correct)) continue;

    questions.push({
      grammarPoint: parts[0],
      questionText: parts[1],
      options: [
        { key: "A", text: parts[2] },
        { key: "B", text: parts[3] },
        { key: "C", text: parts[4] },
        { key: "D", text: parts[5] },
      ],
      correctAnswer: correct,
      explanation: parts[8],
    });
  }
  shuffleArray(questions);
}

function formatQuestionHtml(text: string): string {
  return text.replace(/___/g, '<span class="blank-highlight">___</span>');
}

function applyTheme(unit: string) {
  const preset = THEME_PRESETS[unit];
  const titleEl = document.getElementById("game-title")!;
  const subtitleEl = document.getElementById("game-subtitle")!;

  if (preset) {
    titleEl.textContent = `${preset.emoji} ${preset.title}`;
    document.body.className = `${preset.bodyClass} h-[100dvh] flex flex-col font-sans overflow-hidden`;
    questionCard.className = `w-full shrink-0 bg-white rounded-xl shadow-md px-3 py-2 md:px-4 md:py-3 border-b-4 max-h-[28vh] overflow-y-auto ${preset.accent}`;
  } else {
    titleEl.textContent = "🎯 打地鼠文法選擇挑戰";
    document.body.className =
      "bg-amber-50 h-[100dvh] flex flex-col font-sans overflow-hidden";
    questionCard.className =
      "w-full shrink-0 bg-white rounded-xl shadow-md px-3 py-2 md:px-4 md:py-3 border-b-4 border-amber-500 max-h-[28vh] overflow-y-auto";
  }

}

function fitSignText(signEl: HTMLElement) {
  signEl.style.fontSize = "";
  let sizePx = 13;
  signEl.style.fontSize = `${sizePx}px`;
  const maxWidth = signEl.parentElement?.clientWidth ?? 120;
  while (signEl.scrollWidth > maxWidth - 4 && sizePx > 8) {
    sizePx -= 1;
    signEl.style.fontSize = `${sizePx}px`;
  }
}

function resetMoleButton(btn: HTMLButtonElement) {
  btn.classList.remove("mole-up", "mole-correct", "mole-wrong", "mole-whack");
  btn.disabled = true;
  btn.onclick = null;
  const face = btn.querySelector(".mole-face");
  const sign = btn.querySelector(".mole-sign-text");
  if (face) face.textContent = MOLE_FACE_DEFAULT;
  if (sign) sign.textContent = "";
}

function buildMoleBoard() {
  moleBoard.innerHTML = "";
  holeCells = [];
  moleButtons = [];

  for (let i = 0; i < HOLE_COUNT; i++) {
    const cell = document.createElement("div");
    cell.className = "hole-cell";
    cell.dataset.holeIndex = String(i);

    const holeBg = document.createElement("div");
    holeBg.className = "hole-bg";
    cell.appendChild(holeBg);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mole";
    btn.disabled = true;
    btn.innerHTML = `
      <span class="mole-face" aria-hidden="true">${MOLE_FACE_DEFAULT}</span>
      <span class="mole-sign"><span class="mole-sign-text"></span></span>
    `;
    cell.appendChild(btn);
    moleBoard.appendChild(cell);
    holeCells.push(cell);
    moleButtons.push(btn);
  }
}

function getOccupiedHoles(): Set<number> {
  return new Set(activeMoles.map((m) => m.holeIndex));
}

function stopSpawnLoop() {
  pauseSpawnLoop();
  activeMoles.forEach((m) => resetMoleButton(m.button));
  activeMoles = [];
}

function pauseSpawnLoop() {
  if (spawnTickTimer !== null) {
    clearInterval(spawnTickTimer);
    spawnTickTimer = null;
  }
  activeMoles.forEach((m) => clearTimeout(m.hideTimer));
}

function hideMole(mole: ActiveMole) {
  clearTimeout(mole.hideTimer);
  resetMoleButton(mole.button);
  activeMoles = activeMoles.filter((m) => m.holeIndex !== mole.holeIndex);
}

function currentQuestion(): Question | undefined {
  return questions[currentQuestionIndex];
}

function trySpawnMole() {
  if (!gameActive || isTransitioning) return;
  const q = currentQuestion();
  if (!q) return;
  if (activeMoles.length >= MAX_ACTIVE_MOLES) return;

  const occupied = getOccupiedHoles();
  const freeHoles: number[] = [];
  for (let i = 0; i < HOLE_COUNT; i++) {
    if (!occupied.has(i)) freeHoles.push(i);
  }
  if (freeHoles.length === 0) return;

  const holeIndex = freeHoles[Math.floor(Math.random() * freeHoles.length)];
  const opt = q.options[Math.floor(Math.random() * q.options.length)];
  const btn = moleButtons[holeIndex];
  const signEl = btn.querySelector(".mole-sign-text") as HTMLElement;
  const faceEl = btn.querySelector(".mole-face") as HTMLElement;

  signEl.textContent = `${opt.key}. ${opt.text}`;
  fitSignText(signEl);
  faceEl.textContent = MOLE_FACE_DEFAULT;
  btn.classList.remove("mole-correct", "mole-wrong", "mole-whack");
  btn.disabled = false;

  const hideTimer = window.setTimeout(() => {
    const still = activeMoles.find((m) => m.holeIndex === holeIndex && m.hideTimer === hideTimer);
    if (still) hideMole(still);
  }, MOLE_VISIBLE_MS);

  btn.onclick = () => handleMoleWhack(holeIndex, opt.key, btn);

  window.setTimeout(() => btn.classList.add("mole-up"), 40);

  activeMoles.push({ holeIndex, optionKey: opt.key, button: btn, hideTimer });
}

function startSpawnLoop() {
  stopSpawnLoop();
  trySpawnMole();
  spawnTickTimer = window.setInterval(() => {
    if (activeMoles.length < MAX_ACTIVE_MOLES) trySpawnMole();
  }, SPAWN_TICK_MS);
}

async function initGame(): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);
  const unitParam = urlParams.get("unit");
  const subtitleEl = document.getElementById("game-subtitle")!;

  if (!unitParam) {
    subtitleEl.textContent = "Missing unit parameter in URL";
    return false;
  }

  subtitleEl.textContent = "載入題庫中…";

  const csvUrl = findCsvUrlForUnit(unitParam);
  if (!csvUrl) {
    subtitleEl.textContent = `Question bank not found: ${unitParam}.csv`;
    return false;
  }

  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    if (!csvText.includes("GrammarPoint")) {
      throw new Error("Invalid CSV content");
    }

    unitName = unitParam;
    tracker.setUnitName(unitName);
    parseCSV(csvText);
    applyTheme(unitName);
    buildMoleBoard();
    subtitleEl.textContent = `${questions.length} 題 · ${unitName.replace(/-/g, " ")}`;
    return questions.length > 0;
  } catch (err) {
    console.error("Failed to load question bank:", unitParam, err);
    subtitleEl.textContent = `題庫載入失敗（${unitParam}）`;
    return false;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* audio optional */
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerDisplay.textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function startGame() {
  playEnterGameSfx();
  correctCount = 0;
  lives = 3;
  currentQuestionIndex = 0;
  timeLeft = isQuestMode() ? QUEST_DURATION_SEC : PRACTICE_DURATION_SEC;
  gameActive = true;
  isTransitioning = false;
  tracker.startGame();
  updateScore();
  loadQuestion();
  startTimer();
}

function loadQuestion() {
  if (holeCells.length !== HOLE_COUNT) buildMoleBoard();

  if (lives <= 0 || timeLeft <= 0) {
    endGame();
    return;
  }

  if (currentQuestionIndex >= questions.length) {
    if (isQuestMode()) {
      endGame();
      return;
    }
    currentQuestionIndex = 0;
    shuffleArray(questions);
  }

  if (isQuestMode() && correctCount >= QUEST_PASS_CORRECT) {
    endGame();
    return;
  }

  stopSpawnLoop();
  isTransitioning = false;
  currentQuestionMistakes = 0;
  currentQuestionClicks = 0;
  currentQuestionWrongClicks = 0;
  explanationModal.classList.add("hidden");

  const q = questions[currentQuestionIndex];
  if (!q) {
    questionTextEl.textContent = "題目載入中…";
    return;
  }
  tracker.startQuestion(q.grammarPoint, q.questionText, false);
  progressDisplay.textContent = `${currentQuestionIndex + 1}/${questions.length}`;
  const html = formatQuestionHtml(q.questionText || "");
  questionTextEl.innerHTML = html || "（無題目文字）";
  questionCard.classList.remove("shake");

  startSpawnLoop();
}

function handleMoleWhack(holeIndex: number, selectedKey: string, btn: HTMLButtonElement) {
  if (!gameActive || isTransitioning || btn.disabled) return;

  const mole = activeMoles.find((m) => m.holeIndex === holeIndex);
  if (!mole) return;

  const q = questions[currentQuestionIndex];
  clearTimeout(mole.hideTimer);
  pauseSpawnLoop();
  activeMoles.forEach((m) => {
    if (m.holeIndex !== holeIndex) resetMoleButton(m.button);
  });
  activeMoles = [mole];
  btn.disabled = true;

  currentQuestionClicks++;
  tracker.updateCurrentQuestionStat({
    clicks: currentQuestionClicks,
    wrongClicks: currentQuestionWrongClicks,
    text: selectedKey,
  });

  const faceEl = btn.querySelector(".mole-face") as HTMLElement;

  if (selectedKey === q.correctAnswer) {
    isTransitioning = true;
    faceEl.textContent = MOLE_FACE_CORRECT;
    btn.classList.add("mole-correct", "mole-whack");
    playTone(520, 0.08);
    correctCount++;
    updateScore();
    tracker.endQuestion(true);

    window.setTimeout(() => {
      currentQuestionIndex++;
      if (isQuestMode() && correctCount >= QUEST_PASS_CORRECT) {
        endGame();
      } else {
        loadQuestion();
      }
    }, 550);
  } else {
    currentQuestionWrongClicks++;
    currentQuestionMistakes++;
    faceEl.textContent = MOLE_FACE_WRONG;
    btn.classList.add("mole-wrong", "mole-whack");
    playTone(180, 0.12, "square");
    questionCard.classList.add("shake");

    if (currentQuestionMistakes >= MAX_MISTAKES_PER_Q) {
      lives--;
      updateScore();
      isTransitioning = true;
      tracker.endQuestion(false);
      modalExplanation.textContent = q.explanation;
      window.setTimeout(() => {
        questionCard.classList.remove("shake");
        explanationModal.classList.remove("hidden");
      }, 400);
    } else {
      window.setTimeout(() => {
        questionCard.classList.remove("shake");
        resetMoleButton(btn);
        activeMoles = [];
        if (!isTransitioning) startSpawnLoop();
      }, 650);
    }
  }
}

nextBtn.addEventListener("click", () => {
  explanationModal.classList.add("hidden");
  currentQuestionIndex++;
  if (isQuestMode() && correctCount >= QUEST_PASS_CORRECT) {
    endGame();
  } else {
    loadQuestion();
  }
});

function endGame() {
  gameActive = false;
  if (timerInterval) clearInterval(timerInterval);
  stopSpawnLoop();

  const questLevel = new URLSearchParams(window.location.search).get("questLevel");
  if (questLevel && correctCount >= QUEST_PASS_CORRECT) {
    localStorage.setItem(`traveler_quest_level${questLevel}_complete`, "true");
  }

  const sessionData = tracker.endGame(
    "completed",
    correctCount,
    lives,
    questions.length,
  );
  if (sessionData) showResult(sessionData, userName);
}

function updateScore() {
  const displayLives = Math.max(0, lives);
  livesDisplay.textContent =
    "❤️".repeat(displayLives) + "🖤".repeat(3 - displayLives);
}

function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void (async () => {
    const currentUser = ProgressTracker.getCurrentUser();
    if (!currentUser) {
      alert("請先從文法大廳登入！");
      window.location.href = resolveReturnUrl();
      return;
    }
    userName = currentUser;
    tracker.setUserName(userName);

    applyHubReturnLink();

    const ready = await initGame();
    if (!ready) return;

    btnAddTime?.addEventListener("click", () => {
      timeLeft += 30;
      updateTimerDisplay();
    });
    btnMinusTime?.addEventListener("click", () => {
      timeLeft = Math.max(0, timeLeft - 30);
      updateTimerDisplay();
    });

    initScoreboard({
      onRestart: () => startGame(),
      onHome: () => {
        window.location.href = resolveReturnUrl();
      },
    });

    tracker.logEvent("click_start");
    startGame();
  })();
});

window.addEventListener("beforeunload", () => {
  if (gameActive) {
    tracker.endGame("abandoned", correctCount, lives, questions.length);
  }
});

bindTeacherDashboard(
  [document.getElementById("game-title")!].filter(Boolean) as HTMLElement[],
);
