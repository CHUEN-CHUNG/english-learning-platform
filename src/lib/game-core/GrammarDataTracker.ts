// shared/game-core/GrammarDataTracker.ts
//
// 逐題遊戲（選擇題 / 重組 / 對話 / 旅人任務…）的計時與統計收集器。
// 內部已改為寫入「全平台統一資料層」（gameData / platform_game_data），
// 對外 API 保持不變，使用端無需修改。

import { gameData, type QuestionResult } from '$lib/game-core/game-data';

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

  private toQuestionResults(): QuestionResult[] {
    return this.questionStats.map((s) => {
      const metrics: Record<string, number> = {};
      if (s.clicks !== undefined) metrics.clicks = s.clicks;
      if (s.wrongClicks !== undefined) metrics.wrongClicks = s.wrongClicks;
      if (s.wrongSubmits !== undefined) metrics.wrongSubmits = s.wrongSubmits;
      if (s.attaches !== undefined) metrics.attaches = s.attaches;
      if (s.detaches !== undefined) metrics.detaches = s.detaches;
      return {
        prompt: s.text || s.targetSentence || s.grammarPoint,
        isCorrect: s.isCorrect,
        timeMs: s.timeMs,
        tags: s.grammarPoint ? [s.grammarPoint] : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined
      };
    });
  }

  endGame(status: "completed" | "abandoned", score: number, livesLeft: number, totalQuestions: number) {
    if (!this.startTime) return null;

    this.logEvent(status === "completed" ? "game_completed" : "abandonment");

    const durationMs = Date.now() - this.startTime;
    const localDate = new Date().toLocaleString("zh-TW");

    // 寫入全平台統一資料層（單一 key / 單一結構）
    gameData.record({
      gameType: this.gameType,
      unitId: this.unitName,
      unitTitle: this.unitName,
      status,
      durationMs,
      score,
      maxScore: totalQuestions,
      questions: this.toQuestionResults(),
      extra: { livesLeft, events: this.events, date: localDate }
    });

    // 回傳高保真的 GameSessionData 供 Scoreboard 結算/檢討畫面使用（不另外持久化）
    const legacy: GameSessionData = {
      gameType: this.gameType,
      date: localDate,
      unit: this.unitName,
      status,
      score,
      duration: Math.floor(durationMs / 1000),
      livesLeft,
      totalQuestions,
      events: this.events,
      stats: this.questionStats
    };

    this.startTime = null;
    return legacy;
  }
}
