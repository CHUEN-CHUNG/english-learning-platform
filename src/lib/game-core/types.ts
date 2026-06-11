// Re-export from GrammarDataTracker for convenience
export type { GameEvent, QuestionStat, GameSessionData } from '$lib/game-core/GrammarDataTracker';

export interface MCQuestion {
  grammarPoint: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

// From APPs/grammar-games/to-do/correction/src/types.ts
export interface BugData {
  target_index: number;
  wrong_word: string;
  correct_word: string;
  options: string[];
  explanation: string;
}

export interface BugQuestion {
  question_id: string;
  category: string;
  difficulty: number;
  original_sentence: string;
  tokens: string[];
  bugs: BugData[];
}
