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
