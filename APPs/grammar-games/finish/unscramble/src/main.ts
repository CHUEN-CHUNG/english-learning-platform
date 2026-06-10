import { GrammarDataTracker } from "../../../../../shared/game-core/GrammarDataTracker";
import { bindTeacherDashboard } from "../../../../../shared/game-core/GrammarDashboard";
import { initScoreboard, showResult } from "../../../../../shared/game-core/GrammarScoreboard";
// @ts-ignore
import { ProgressTracker } from "../../../../../shared/utils/ProgressTracker";
import { playEnterGameSfx } from "../../../shared/enter-game-sfx";

// 載入所有文法題庫 CSV
const csvModules = import.meta.glob("../../../../../content/grammar/**/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});

interface Question {
  grammarPoint: string;
  targetSentence: string;
  scrambledParts: string[];
  distractorParts: string[];
  capitalizationHint: boolean;
  punctuationHint: boolean;
  explanation: string;
}

interface CarData {
  id: string;
  text: string;
  isDistractor: boolean;
}

let questions: Question[] = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let lives = 3;
let currentQuestionMistakes = 0;
let currentQuestionAttaches = 0;
let currentQuestionDetaches = 0;
let currentQuestionWrongSubmits = 0;
let allCars: CarData[] = [];
let selectedCarIds: string[] = [];

let timeLeft = 600; // 10 minutes
let timerInterval: number | null = null;
let gameActive = false;
let isTransitioning = false;

// DOM Elements
const grammarPointEl = document.getElementById("grammar-point")!;
const scoreDisplay = document.getElementById("score-display")!;
const livesDisplay = document.getElementById("lives-display")!;
const progressDisplay = document.getElementById("progress-display")!;
const timerDisplay = document.getElementById("timer-display")!;
const btnAddTime = document.getElementById("btn-add-time")!;
const btnMinusTime = document.getElementById("btn-minus-time")!;
const trainContainer = document.getElementById("train-container")!;
const scrambledArea = document.getElementById("scrambled-area")!;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

const explanationModal = document.getElementById("explanation-modal")!;
const modalTarget = document.getElementById("modal-target")!;
const modalExplanation = document.getElementById("modal-explanation")!;
const nextBtn = document.getElementById("next-btn")!;
// const finalScore = document.getElementById("final-score")!;
// const restartGameBtn = document.getElementById("restart-game-btn")!;

// Tracking Data
let userName = "";
let unitName = "";

const tracker = new GrammarDataTracker("Unscramble");

const WH_HUB_RETURN = "/apps/grammar-hub/index.html?tab=wh";

function resolveReturnUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  if (returnTo) return returnTo;
  if (params.get("questLevel")) return WH_HUB_RETURN;
  return "../../../grammar-hub/index.html";
}

function applyHubReturnLink() {
  const url = resolveReturnUrl();
  const hubLink = document.querySelector(
    'a[href*="grammar-hub"]',
  ) as HTMLAnchorElement | null;
  if (hubLink) hubLink.href = url;
}

function logEvent(eventName: string) {
  tracker.logEvent(eventName);
}

// Init Game
function initGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const unitParam = urlParams.get("unit");
  if (!unitParam) {
    document.getElementById("game-subtitle")!.textContent =
      "Missing unit parameter in URL";
    return;
  }

  // Find matching CSV
  const targetFileKey = Object.keys(csvModules).find((key) =>
    key.includes(`${unitParam}.csv`),
  );

  if (targetFileKey && csvModules[targetFileKey]) {
    unitName = unitParam;
    tracker.setUnitName(unitName);
    parseCSV(csvModules[targetFileKey] as string);
    document.getElementById("game-subtitle")!.textContent = unitName.replace(/-/g, " ");
    // Don't startGame here anymore, wait for user name
  } else {
    document.getElementById("game-subtitle")!.textContent =
      `Question bank not found: ${unitParam}.csv`;
  }
}

function parseCSV(csv: string) {
  questions = [];
  const lines = csv.trim().split("\n");

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts: string[] = [];
    let currentPart = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(currentPart);
        currentPart = "";
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart);

    if (parts.length >= 7) {
      questions.push({
        grammarPoint: parts[0],
        targetSentence: parts[1],
        scrambledParts: parts[2].split("|").filter((p) => p.trim() !== ""),
        distractorParts: parts[3]
          ? parts[3].split("|").filter((p) => p.trim() !== "")
          : [],
        capitalizationHint: parts[4].trim().toUpperCase() === "TRUE",
        punctuationHint: parts[5].trim().toUpperCase() === "TRUE",
        explanation: parts[6],
      });
    }
  }

  // Shuffle questions
  shuffleArray(questions);
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

btnAddTime.addEventListener("click", () => {
  timeLeft += 30; // 加 30 秒
  updateTimerDisplay();
});

btnMinusTime.addEventListener("click", () => {
  timeLeft = Math.max(0, timeLeft - 30); // 減 30 秒
  updateTimerDisplay();
});

function startGame() {
  playEnterGameSfx();
  correctCount = 0;
  lives = 3;
  currentQuestionIndex = 0;
  currentQuestionMistakes = 0;
  timeLeft = 600; // Reset to 10 mins
  gameActive = true;
  isTransitioning = false;

  tracker.startGame();

  updateScore();
  loadQuestion();
  startTimer();
}

function loadQuestion() {
  isTransitioning = false;
  currentQuestionMistakes = 0;
  currentQuestionAttaches = 0;
  currentQuestionDetaches = 0;
  currentQuestionWrongSubmits = 0;
  if (currentQuestionIndex >= questions.length || lives <= 0 || timeLeft <= 0) {
    endGame();
    return;
  }

  tracker.startQuestion(
    questions[currentQuestionIndex].grammarPoint,
    questions[currentQuestionIndex].targetSentence,
    true
  );

  const q = questions[currentQuestionIndex];
  grammarPointEl.textContent = q.grammarPoint.replace(/_/g, " ");
  progressDisplay.textContent = `${currentQuestionIndex + 1}/${questions.length}`;

  // Prepare cars
  allCars = [];
  selectedCarIds = [];

  // Add correct parts
  q.scrambledParts.forEach((part, idx) => {
    allCars.push({
      id: `correct-${idx}`,
      text: part.trim(),
      isDistractor: false,
    });
  });

  // Add distractors
  q.distractorParts.forEach((part, idx) => {
    allCars.push({
      id: `distract-${idx}`,
      text: part.trim(),
      isDistractor: true,
    });
  });

  shuffleArray(allCars);

  trainContainer.className = "train-container"; // Reset success bg
  renderCars();
  checkSubmitStatus();
}

function renderCars() {
  // Clear areas
  const engine = trainContainer.firstElementChild; // Keep engine
  trainContainer.innerHTML = "";
  if (engine) trainContainer.appendChild(engine);

  scrambledArea.innerHTML = "";

  // Render unselected in scrambled area
  allCars.forEach((car) => {
    if (!selectedCarIds.includes(car.id)) {
      scrambledArea.appendChild(createCarElement(car, false));
    }
  });

  // Render selected in train container
  selectedCarIds.forEach((id) => {
    const car = allCars.find((c) => c.id === id);
    if (car) {
      trainContainer.appendChild(createCarElement(car, true));
    }
  });

  checkSubmitStatus();
}

function createCarElement(car: CarData, isSelected: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "train-car";
  el.textContent = car.text;

  el.addEventListener("click", () => {
    if (!gameActive) return;

    if (isSelected) {
      // Remove from selected
      selectedCarIds = selectedCarIds.filter((id) => id !== car.id);
      currentQuestionDetaches++;
      tracker.updateCurrentQuestionStat({ detaches: currentQuestionDetaches });
      playSound("detach");
    } else {
      // Add to selected at the end
      selectedCarIds.push(car.id);
      currentQuestionAttaches++;
      tracker.updateCurrentQuestionStat({ attaches: currentQuestionAttaches });
      playSound("attach");
    }
    renderCars();
  });

  return el;
}

function checkSubmitStatus() {
  const q = questions[currentQuestionIndex];
  // Enable submit if they have placed at least the same number of cards as the correct answer
  if (selectedCarIds.length === q.scrambledParts.length) {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

resetBtn.addEventListener("click", () => {
  if (!gameActive) return;
  selectedCarIds = [];
  renderCars();
});

submitBtn.addEventListener("click", () => {
  if (!gameActive || isTransitioning) return;
  const q = questions[currentQuestionIndex];

  // Build the user's sentence
  const userSentence = selectedCarIds
    .map((id) => {
      const car = allCars.find((c) => c.id === id);
      return car ? car.text : "";
    })
    .join(" ")
    .replace(/\s+([.,!?])/g, "$1"); // Remove space before punctuation if Punctuation_Hint is true

  // Normalize both for comparison (remove extra spaces)
  const normalizedUser = userSentence
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
  const normalizedTarget = q.targetSentence
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();

  if (normalizedUser === normalizedTarget) {
    // Correct!
    isTransitioning = true;
    correctCount++;
    updateScore();

    // Record stats
    tracker.endQuestion(true);

    // Success feedback
    trainContainer.classList.add("success-bg");
    playSound("success");

    // Fade out distractors left in scrambled area
    Array.from(scrambledArea.children).forEach((child) => {
      (child as HTMLElement).classList.add("fade-out");
    });

    setTimeout(() => {
      // 答對不顯示解說，直接進入下一題
      currentQuestionIndex++;
      loadQuestion();
    }, 1500);
  } else {
    // Wrong!
    currentQuestionWrongSubmits++;
    tracker.updateCurrentQuestionStat({ wrongSubmits: currentQuestionWrongSubmits });
    currentQuestionMistakes++;
    trainContainer.classList.add("shake");
    playSound("wrong");
    
    if (currentQuestionMistakes >= 3) {
      lives--;
      updateScore();
      isTransitioning = true;
      setTimeout(() => {
        trainContainer.classList.remove("shake");
        // 記錄並顯示解說
        showExplanation(false);
      }, 500);
    } else {
      setTimeout(() => {
        trainContainer.classList.remove("shake");
      }, 500);
    }
  }
});

function showExplanation(isCorrect: boolean) {
  const q = questions[currentQuestionIndex];
  
  const modalIcon = document.getElementById("modal-icon")!;
  const modalTitle = document.getElementById("modal-title")!;
  
  if (isCorrect) {
    modalIcon.textContent = "✅";
    modalTitle.textContent = "Correct! The train is leaving!";
    modalTitle.className = "text-2xl font-bold mb-2 text-green-600";
  } else {
    modalIcon.textContent = "❌";
    modalTitle.textContent = "Not quite!";
    modalTitle.className = "text-2xl font-bold mb-2 text-red-600";
  }

  modalTarget.textContent = `Answer: ${q.targetSentence}`;
  modalExplanation.textContent = q.explanation;
  explanationModal.classList.remove("hidden");
  
  // Track that we reached explanation (meaning it was incorrect)
  tracker.endQuestion(isCorrect);
}

nextBtn.addEventListener("click", () => {
  if (!explanationModal.classList.contains("hidden")) {
    explanationModal.classList.add("hidden");
    currentQuestionIndex++;
    loadQuestion();
  }
});

function endGame() {
  gameActive = false;
  if (timerInterval) clearInterval(timerInterval);

  const questLevel = new URLSearchParams(window.location.search).get(
    "questLevel",
  );
  if (questLevel === "2" && correctCount >= 3) {
    localStorage.setItem("traveler_quest_level2_complete", "true");
  }

  const sessionData = tracker.endGame("completed", correctCount, lives, questions.length);

  if (sessionData) {
    showResult(sessionData, userName);
  }
}

function updateScore() {
  const displayLives = Math.max(0, lives);
  if (scoreDisplay) scoreDisplay.textContent = correctCount.toString();
  if (livesDisplay) livesDisplay.textContent = "❤️".repeat(displayLives) + "🖤".repeat(3 - displayLives);
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function playSound(type: "attach" | "detach" | "success" | "wrong") {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "attach") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "detach") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "success") {
      // Cute train horn sound: toot toot!
      osc.type = "triangle"; // Softer, cuter sound

      // Toot 1 (C5)
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

      // Toot 2 (E5)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.25);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.45);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Ignore audio errors
  }
}

// Start
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = ProgressTracker.getCurrentUser();
  if (!currentUser) {
    alert("Please log in from the Grammar Hub first!");
    window.location.href = resolveReturnUrl();
    return;
  }
  userName = currentUser;
  tracker.setUserName(userName);

  applyHubReturnLink();
  initGame();

  initScoreboard({
    onRestart: () => startGame(),
    onHome: () => {
      window.location.href = resolveReturnUrl();
    },
  });

  logEvent("click_start");
  startGame();
});

window.addEventListener("beforeunload", () => {
  if (gameActive) {
    tracker.endGame("abandoned", correctCount, lives, questions.length);
  }
});

// --- Teacher Dashboard Logic ---
bindTeacherDashboard([document.getElementById("game-title")!].filter(Boolean) as HTMLElement[]);
