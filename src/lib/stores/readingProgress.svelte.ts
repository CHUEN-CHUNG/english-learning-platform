// Reading-side progress + identity store.
// Faithful port of shared/utils/ProgressTracker.js — keeps the SAME localStorage keys
// (word_exam_all_data / currentUser / platform_stats_data) for backward compatibility.

const STORAGE_KEY = 'word_exam_all_data';
const USER_KEY = 'currentUser';
const STATS_KEY = 'platform_stats_data';
const MIGRATION_DONE_KEY = 'word_exam_migration_done';

export interface ReadingProfile {
  streak: number;
  totalTests: number;
  lastTestDate: string;
}

export interface ReadingUserData {
  profile: ReadingProfile;
  history: any[];
  abandons: any[];
  progress: Record<string, Record<string, boolean>>;
}

export type AllReadingData = Record<string, ReadingUserData>;

export interface ReadingGameResult {
  gameType: 'Matching' | 'Reading' | 'Quiz' | string;
  unit: string;
  duration: number;
  score: number;
  total: number;
  totalPercent: number;
  stats?: any[];
  file?: string;
  timeString?: string;
  [key: string]: unknown;
}

export interface PlatformStats {
  handoutDownloads: number;
  phraseDownloads: number;
}

let _current = $state<string | null>(null);

function getAllData(): AllReadingData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveAllData(data: AllReadingData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function emptyUser(): ReadingUserData {
  return { profile: { streak: 0, totalTests: 0, lastTestDate: '' }, history: [], abandons: [], progress: {} };
}

function migrateOldData(): void {
  if (localStorage.getItem(MIGRATION_DONE_KEY) === 'true') return;

  const allData = getAllData();
  let migrated = false;

  try {
    const oldHistory = JSON.parse(localStorage.getItem('word_exam_history') || '[]');
    if (oldHistory.length > 0) {
      oldHistory.forEach((record: any) => {
        const u = record.userName || 'Unknown';
        if (!allData[u]) allData[u] = emptyUser();
        if (!allData[u].history) allData[u].history = [];
        allData[u].history.push(record);
        if (!allData[u].profile) allData[u].profile = { streak: 1, totalTests: 0, lastTestDate: (record.date || '').split(' ')[0] };
        allData[u].profile.totalTests = (allData[u].profile.totalTests || 0) + 1;
      });
      migrated = true;
    }

    const oldAbandons = JSON.parse(localStorage.getItem('word_exam_abandons') || '[]');
    if (oldAbandons.length > 0) {
      oldAbandons.forEach((record: any) => {
        const u = record.userName || 'Unknown';
        if (!allData[u]) allData[u] = emptyUser();
        if (!allData[u].abandons) allData[u].abandons = [];
        allData[u].abandons.push(record);
      });
      migrated = true;
    }

    const oldProfiles = JSON.parse(localStorage.getItem('word_exam_user_profiles') || '{}');
    if (Object.keys(oldProfiles).length > 0) {
      for (const [u, p] of Object.entries(oldProfiles)) {
        if (!allData[u]) allData[u] = { ...emptyUser(), profile: p as ReadingProfile };
        else allData[u].profile = p as ReadingProfile;
      }
      migrated = true;
    }
  } catch {
    // ignore malformed legacy data
  }

  if (migrated) saveAllData(allData);
  localStorage.setItem(MIGRATION_DONE_KEY, 'true');
}

export const readingProgress = {
  get current() {
    return _current;
  },

  init() {
    migrateOldData();
    _current = localStorage.getItem(USER_KEY);
  },

  getCurrentUser(): string | null {
    return _current ?? localStorage.getItem(USER_KEY);
  },

  setCurrentUser(userName: string): boolean {
    if (!userName || !userName.trim()) return false;
    const cleanName = userName.trim();
    localStorage.setItem(USER_KEY, cleanName);

    const allData = getAllData();
    if (!allData[cleanName]) {
      allData[cleanName] = emptyUser();
      saveAllData(allData);
    } else if (!allData[cleanName].progress) {
      allData[cleanName].progress = {};
      saveAllData(allData);
    }
    _current = cleanName;
    return true;
  },

  logout() {
    localStorage.removeItem(USER_KEY);
    _current = null;
  },

  getAllData,
  saveAllData,

  saveReadingGameResult(result: ReadingGameResult): void {
    const userName = this.getCurrentUser();
    if (!userName) return;

    const allData = getAllData();
    if (!allData[userName]) allData[userName] = emptyUser();
    if (!allData[userName].history) allData[userName].history = [];

    const today = new Date().toLocaleDateString('zh-TW');
    const profile = allData[userName].profile || { streak: 0, totalTests: 0, lastTestDate: '' };
    if (profile.lastTestDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (profile.lastTestDate === yesterday.toLocaleDateString('zh-TW')) profile.streak++;
      else profile.streak = 1;
      profile.lastTestDate = today;
    }
    profile.totalTests++;
    allData[userName].profile = profile;

    const record = {
      ...result,
      date: new Date().toLocaleString('zh-TW'),
      gameType: result.gameType,
      unit: result.unit,
      file: result.file || result.unit,
      duration: result.duration,
      timeString: result.timeString || `${result.duration}秒`,
      score: result.score,
      total: result.total,
      totalPercent: result.totalPercent,
      stats: result.stats || []
    };

    allData[userName].history.unshift(record);
    if (allData[userName].history.length > 50) {
      allData[userName].history = allData[userName].history.slice(0, 50);
    }
    saveAllData(allData);
  },

  markTaskComplete(unitId: string, taskId: string): void {
    const userName = this.getCurrentUser();
    if (!userName) return;
    const allData = getAllData();
    if (!allData[userName]) return;
    if (!allData[userName].progress) allData[userName].progress = {};
    if (!allData[userName].progress[unitId]) allData[userName].progress[unitId] = {};
    allData[userName].progress[unitId][taskId] = true;
    saveAllData(allData);
  },

  getUnitProgress(unitId: string): number {
    const userName = this.getCurrentUser();
    if (!userName) return 0;
    const allData = getAllData();
    const userProgress = allData[userName]?.progress || {};
    const unitProgress = userProgress[unitId] || {};
    const requiredTasks = ['synonyms', 'reading', 'quiz', 'questionnaire'];
    let completedCount = 0;
    requiredTasks.forEach((task) => {
      if (unitProgress[task]) completedCount++;
    });
    return Math.round((completedCount / requiredTasks.length) * 100);
  },

  isQuestionnaireDone(userName: string, unitId: string): boolean {
    const allData = getAllData();
    const userProgress = allData[userName]?.progress || {};
    const unitProgress = userProgress[unitId] || {};
    return !!unitProgress['questionnaire'];
  },

  getPlatformStats(unitId: string): PlatformStats {
    try {
      const data = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
      return data[unitId] || { handoutDownloads: 0, phraseDownloads: 0 };
    } catch {
      return { handoutDownloads: 0, phraseDownloads: 0 };
    }
  },

  savePlatformStats(unitId: string, stats: PlatformStats): void {
    try {
      const data = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
      data[unitId] = stats;
      localStorage.setItem(STATS_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  recordDownload(unitId: string, type: 'handout' | 'phrase'): void {
    const stats = this.getPlatformStats(unitId);
    if (type === 'handout') stats.handoutDownloads++;
    if (type === 'phrase') stats.phraseDownloads++;
    this.savePlatformStats(unitId, stats);
  },

  getSurveyCompletions(unitId: string): number {
    const allData = getAllData();
    let count = 0;
    for (const u in allData) {
      if (allData[u]?.progress?.[unitId]?.['questionnaire']) count++;
    }
    return count;
  }
};
