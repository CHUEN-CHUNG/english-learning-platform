// shared/game-core/GrammarDataTracker.ts

export interface GameEvent {
  event: string;
  timestamp: string;
}

export interface QuestionStat {
  grammarPoint: string;
  isCorrect: boolean;
  timeMs: number;
  // Common
  text?: string;           // Option text or sentence (MC)
  targetSentence?: string; // Unscramble sentence
  // Game Specific
  clicks?: number;         // MC
  wrongClicks?: number;    // MC
  wrongSubmits?: number;   // Both / Unscramble
  attaches?: number;       // Unscramble
  detaches?: number;       // Unscramble
}

export interface GameSessionData {
  gameType: string;
  date: string;
  unit: string;
  status: "completed" | "abandoned";
  score: number;
  duration: number;
  livesLeft: number;
  totalQuestions: number;
  events: GameEvent[];
  stats: QuestionStat[];
}

export class GrammarDataTracker {
  private startTime: number | null = null;
  private qStartTime: number | null = null;
  private events: GameEvent[] = [];
  private questionStats: QuestionStat[] = [];
  private currentQStats: Partial<QuestionStat> | null = null;
  private gameType: string;
  private userName: string;
  private unitName: string;

  constructor(gameType: string) {
    this.gameType = gameType;
    this.userName = "";
    this.unitName = "";
  }

  setUserName(name: string) {
    this.userName = name;
  }

  setUnitName(unit: string) {
    this.unitName = unit;
  }

  startGame() {
    this.startTime = Date.now();
    this.events = [];
    this.questionStats = [];
  }

  logEvent(eventName: string) {
    this.events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
    });
  }

  startQuestion(grammarPoint: string, textOrSentence: string, isUnscramble: boolean = false) {
    this.qStartTime = Date.now();
    this.currentQStats = {
      grammarPoint,
      [isUnscramble ? "targetSentence" : "text"]: textOrSentence,
    };
    return this.currentQStats;
  }

  updateCurrentQuestionStat(stats: Partial<QuestionStat>) {
    if (this.currentQStats) {
      Object.assign(this.currentQStats, stats);
    }
  }

  endQuestion(isCorrect: boolean) {
    if (this.currentQStats && this.qStartTime) {
      this.currentQStats.isCorrect = isCorrect;
      this.currentQStats.timeMs = Date.now() - this.qStartTime;
      this.questionStats.push(this.currentQStats as QuestionStat);
      this.currentQStats = null;
    }
  }

  endGame(status: "completed" | "abandoned", score: number, livesLeft: number, totalQuestions: number) {
    if (!this.startTime) return;

    this.logEvent(status === "completed" ? "game_completed" : "abandonment");
    
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    const dataToSave: GameSessionData = {
      gameType: this.gameType,
      date: new Date().toLocaleString("zh-TW"),
      unit: this.unitName,
      status,
      score,
      duration,
      livesLeft,
      totalQuestions,
      events: this.events,
      stats: this.questionStats,
    };

    // Save to unified local storage
    const allData = JSON.parse(localStorage.getItem("grammar_platform_data") || "{}");
    
    if (!allData[this.userName]) {
      allData[this.userName] = { history: [], abandons: [] };
    }
    
    let savedData: GameSessionData | null = null;
    if (status === "completed") {
      allData[this.userName].history.unshift(dataToSave);
      savedData = dataToSave;
    } else {
      allData[this.userName].abandons.unshift(dataToSave);
      savedData = dataToSave;
    }
    
    localStorage.setItem("grammar_platform_data", JSON.stringify(allData));
    return savedData;
  }
}
