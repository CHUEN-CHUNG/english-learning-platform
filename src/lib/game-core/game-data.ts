// 全平台統一遊戲數據層。
//
// 設計目標：所有遊戲（單字 / 文法 / 閱讀 / 口說 / 任務）都走「同一條寫入路徑」、
// 存進「同一個 storage key」、用「同一套資料結構」。教師端只需讀這一份即可。
//
// 單一 key：`platform_game_data`
// 結構：{ [userName]: UserGameData }

import { appStorage } from '$lib/utils/storage';
import { user } from '$lib/stores/user.svelte';
import { readingProgress } from '$lib/stores/readingProgress.svelte';

export const GAME_DATA_KEY = 'platform_game_data';
const MAX_SESSIONS = 200;

// 遊戲分類
export type GameCategory = 'vocab' | 'grammar' | 'reading' | 'speaking' | 'quest';

// 單場狀態
export type SessionStatus = 'completed' | 'abandoned';

// 統一的遊戲類型 enum（字串）＋ 中文標籤與分類，集中管理避免各遊戲各寫各的。
export const GAME_TYPES = {
  Matching: { category: 'vocab', label: '同反義詞連連看' },
  Quiz: { category: 'vocab', label: '單字總測驗' },
  Reading: { category: 'reading', label: '閱讀練習' },
  MultipleChoice: { category: 'grammar', label: '打地鼠選擇題' },
  Unscramble: { category: 'grammar', label: '火車重組' },
  Correction: { category: 'grammar', label: '抓蟲改錯' },
  FillIn: { category: 'grammar', label: '填空' },
  AdjNp: { category: 'grammar', label: '形容詞＋名詞' },
  DialogueRoleplay: { category: 'speaking', label: '對話角色扮演' },
  TravelerLevel1: { category: 'quest', label: '旅人任務 L1（Journey）' },
  TravelerLevel2: { category: 'quest', label: '旅人任務 L2（Schedule）' },
  TravelerLevel2Schedule: { category: 'quest', label: '旅人任務 L2（Schedule）' },
  TravelerLevel3: { category: 'quest', label: '旅人任務 L3（Souvenir）' },
  TimeCop: { category: 'quest', label: '時間警察' },
  RestaurantSurvival: { category: 'speaking', label: '餐廳求生' },
  'Dialogue Roleplay': { category: 'speaking', label: '對話角色扮演' }
} as const;

export type GameType = keyof typeof GAME_TYPES;

export function gameLabel(gameType: string): string {
  return (GAME_TYPES as Record<string, { label: string }>)[gameType]?.label ?? gameType;
}

export function gameCategory(gameType: string): GameCategory | 'unknown' {
  return (GAME_TYPES as Record<string, { category: GameCategory }>)[gameType]?.category ?? 'unknown';
}

// 逐題結果（統一 reviewData / stats 兩套舊格式）
export interface QuestionResult {
  prompt: string; // 題目文字
  userAnswer?: string; // 學生作答（可空＝未作答）
  correctAnswer?: string; // 正確答案
  isCorrect: boolean;
  timeMs?: number; // 該題耗時（毫秒）
  tags?: string[]; // 文法點 / 錯誤類型等標籤
  metrics?: Record<string, number>; // 遊戲特有計量：clicks, wrongClicks, attaches, detaches, wrongSubmits...
}

// 單場遊戲紀錄（完成與跳出共用，用 status 區分）
export interface GameSession {
  id: string;
  gameType: string;
  category: GameCategory | 'unknown';
  unitId: string; // 規範化單元代碼
  unitTitle?: string; // 顯示用單元名
  status: SessionStatus;
  date: string; // ISO 8601
  durationMs: number; // 全程耗時（毫秒）
  score: number;
  maxScore: number; // 滿分；0 代表不適用（如純通關型）
  percent: number; // 0–100
  questions: QuestionResult[];
  extra?: Record<string, unknown>; // 各遊戲特有資料（如單字測驗的分階段得分）；通用欄位以外的逃生艙
}

export interface UserProfile {
  streak: number;
  totalSessions: number;
  lastPlayedDate: string;
}

export interface UserGameData {
  profile: UserProfile;
  sessions: GameSession[];
}

export type AllGameData = Record<string, UserGameData>;

// 寫入一場紀錄時的輸入（id/date/category/percent 由系統補齊）
export interface SessionInput {
  gameType: string;
  unitId: string;
  unitTitle?: string;
  status?: SessionStatus; // 預設 completed
  durationMs: number;
  score: number;
  maxScore: number;
  questions?: QuestionResult[];
  extra?: Record<string, unknown>;
}

function emptyUser(): UserGameData {
  return { profile: { streak: 0, totalSessions: 0, lastPlayedDate: '' }, sessions: [] };
}

function getAllData(): AllGameData {
  try {
    return JSON.parse(appStorage.getItem(GAME_DATA_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAllData(data: AllGameData): void {
  appStorage.setItem(GAME_DATA_KEY, JSON.stringify(data));
}

// 過渡期同時認得文法側（user / current_user）與閱讀側（readingProgress / currentUser）登入名。
function currentUser(): string | null {
  return user.current ?? readingProgress.getCurrentUser();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildSession(input: SessionInput): GameSession {
  const status = input.status ?? 'completed';
  const maxScore = input.maxScore || 0;
  const percent = maxScore > 0 ? Math.round((input.score / maxScore) * 100) : 0;
  return {
    id: makeId(),
    gameType: input.gameType,
    category: gameCategory(input.gameType),
    unitId: input.unitId,
    unitTitle: input.unitTitle,
    status,
    date: new Date().toISOString(),
    durationMs: Math.max(0, Math.round(input.durationMs)),
    score: input.score,
    maxScore,
    percent,
    questions: input.questions ?? [],
    extra: input.extra
  };
}

function pushSession(userName: string, session: GameSession): void {
  const all = getAllData();
  if (!all[userName]) all[userName] = emptyUser();
  const u = all[userName];

  // 連續天數
  const today = new Date().toLocaleDateString('zh-TW');
  if (u.profile.lastPlayedDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    u.profile.streak = u.profile.lastPlayedDate === yesterday.toLocaleDateString('zh-TW') ? u.profile.streak + 1 : 1;
    u.profile.lastPlayedDate = today;
  }
  if (session.status === 'completed') u.profile.totalSessions++;

  u.sessions.unshift(session);
  if (u.sessions.length > MAX_SESSIONS) u.sessions = u.sessions.slice(0, MAX_SESSIONS);
  saveAllData(all);
}

export const gameData = {
  getAllData,
  saveAllData,
  getCurrentUser: currentUser,

  /** 記錄一場（預設 completed）。未登入則不寫入並回傳 null。 */
  record(input: SessionInput): GameSession | null {
    const userName = currentUser();
    if (!userName) return null;
    const session = buildSession(input);
    pushSession(userName, session);
    return session;
  },

  /** 記錄一場中途跳出。 */
  recordAbandon(input: Omit<SessionInput, 'status'>): GameSession | null {
    return this.record({ ...input, status: 'abandoned' });
  }
};
