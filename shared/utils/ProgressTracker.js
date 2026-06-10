/**
 * ProgressTracker.js
 * 負責管理學生的學習進度與全站身分識別 (整合 word_exam_all_data)
 */

import { appStorage } from '../storage/StorageManager.js';

export class ProgressTracker {
    static STORAGE_KEY = 'word_exam_all_data';
    static USER_KEY = 'currentUser';
    static STATS_KEY = 'platform_stats_data';
    static MIGRATION_DONE_KEY = 'word_exam_migration_done';

    /**
     * 執行舊資料遷移 (Migration)
     */
    static async migrateOldData() {
        if (await appStorage.load(this.MIGRATION_DONE_KEY) === 'true') {
            return; // 已經遷移過，不再重複執行
        }

        let allData = await this.getAllData();
        let migrated = false;

        const oldHistory = await appStorage.load('word_exam_history') || [];
        if (oldHistory.length > 0) {
            oldHistory.forEach(record => {
                const u = record.userName || 'Unknown';
                if (!allData[u]) allData[u] = { profile: { streak: 1, totalTests: 0, lastTestDate: record.date.split(' ')[0] }, history: [], abandons: [], progress: {} };
                if (!allData[u].history) allData[u].history = [];
                allData[u].history.push(record);
                if (!allData[u].profile) allData[u].profile = { streak: 1, totalTests: 0, lastTestDate: record.date.split(' ')[0] };
                allData[u].profile.totalTests = (allData[u].profile.totalTests || 0) + 1;
            });
            migrated = true;
        }

        const oldAbandons = await appStorage.load('word_exam_abandons') || [];
        if (oldAbandons.length > 0) {
            oldAbandons.forEach(record => {
                const u = record.userName || 'Unknown';
                if (!allData[u]) allData[u] = { profile: { streak: 0, totalTests: 0, lastTestDate: '' }, history: [], abandons: [], progress: {} };
                if (!allData[u].abandons) allData[u].abandons = [];
                allData[u].abandons.push(record);
            });
            migrated = true;
        }

        const oldProfiles = await appStorage.load('word_exam_user_profiles') || {};
        if (Object.keys(oldProfiles).length > 0) {
            for (const [u, p] of Object.entries(oldProfiles)) {
                if (!allData[u]) allData[u] = { profile: p, history: [], abandons: [], progress: {} };
                else allData[u].profile = p;
            }
            migrated = true;
        }

        if (migrated) {
            await this.saveAllData(allData);
        }
        
        // 標記為已遷移
        await appStorage.save(this.MIGRATION_DONE_KEY, 'true');
    }

    /**
     * 取得當前登入的使用者名稱
     */
    static async getCurrentUser() {
        return await appStorage.load(this.USER_KEY);
    }

    /**
     * 設定當前使用者 (登入)
     */
    static async setCurrentUser(userName) {
        if (!userName || !userName.trim()) return false;
        
        const cleanName = userName.trim();
        await appStorage.save(this.USER_KEY, cleanName);
        
        // 初始化該使用者的資料結構 (若不存在)
        const allData = await this.getAllData();
        if (!allData[cleanName]) {
            allData[cleanName] = {
                profile: { streak: 0, totalTests: 0, lastTestDate: '' },
                history: [],
                abandons: [],
                progress: {}
            };
            await this.saveAllData(allData);
        } else if (!allData[cleanName].progress) {
            allData[cleanName].progress = {};
            await this.saveAllData(allData);
        }
        return true;
    }

    /**
     * 登出
     */
    static async logout() {
        await appStorage.remove(this.USER_KEY);
    }

    /**
     * 取得所有資料
     */
    static async getAllData() {
        try {
            const data = await appStorage.load(this.STORAGE_KEY);
            return data || {};
        } catch (e) {
            return {};
        }
    }

    /**
     * 儲存所有資料
     */
    static async saveAllData(data) {
        await appStorage.save(this.STORAGE_KEY, data);
    }

    /**
     * 儲存閱讀大廳的遊戲/測驗結果
     */
    static async saveReadingGameResult(result) {
        const userName = await this.getCurrentUser();
        if (!userName) return;

        const allData = await this.getAllData();
        if (!allData[userName]) {
            allData[userName] = { profile: { streak: 0, totalTests: 0, lastTestDate: '' }, history: [], abandons: [], progress: {} };
        }
        if (!allData[userName].history) allData[userName].history = [];

        // 更新 profile
        let today = new Date().toLocaleDateString('zh-TW');
        let profile = allData[userName].profile || { streak: 0, totalTests: 0, lastTestDate: '' };
        
        if (profile.lastTestDate !== today) {
            let yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (profile.lastTestDate === yesterday.toLocaleDateString('zh-TW')) {
                profile.streak++;
            } else {
                profile.streak = 1;
            }
            profile.lastTestDate = today;
        }
        profile.totalTests++;
        allData[userName].profile = profile;

        // 建立標準化紀錄
        const record = {
            date: new Date().toLocaleString('zh-TW'),
            gameType: result.gameType,
            unit: result.unit,
            file: result.file || result.unit,
            duration: result.duration,
            timeString: result.timeString || `${result.duration}秒`,
            score: result.score,
            total: result.total,
            totalPercent: result.totalPercent,
            stats: result.stats || [],
            ...result
        };

        // 將新紀錄加到最前面
        allData[userName].history.unshift(record);

        // 保留最近 50 筆
        if (allData[userName].history.length > 50) {
            allData[userName].history = allData[userName].history.slice(0, 50);
        }

        await this.saveAllData(allData);
    }

    /**
     * 標記某個單元的特定任務為完成
     */
    static async markTaskComplete(unitId, taskId) {
        const userName = await this.getCurrentUser();
        if (!userName) return;

        const allData = await this.getAllData();
        if (!allData[userName]) return;
        
        if (!allData[userName].progress) {
            allData[userName].progress = {};
        }
        if (!allData[userName].progress[unitId]) {
            allData[userName].progress[unitId] = {};
        }
        
        allData[userName].progress[unitId][taskId] = true;
        await this.saveAllData(allData);
    }

    /**
     * 取得當前使用者在某個單元的完成度百分比
     */
    static async getUnitProgress(unitId) {
        const userName = await this.getCurrentUser();
        if (!userName) return 0;

        const allData = await this.getAllData();
        const userProgress = allData[userName]?.progress || {};
        const unitProgress = userProgress[unitId] || {};
        
        const requiredTasks = ['synonyms', 'reading', 'quiz', 'questionnaire'];
        
        let completedCount = 0;
        requiredTasks.forEach(task => {
            if (unitProgress[task]) {
                completedCount++;
            }
        });

        return Math.round((completedCount / requiredTasks.length) * 100);
    }

    /**
     * 取得特定使用者在某個單元的問卷是否完成
     */
    static async isQuestionnaireDone(userName, unitId) {
        const allData = await this.getAllData();
        const userProgress = allData[userName]?.progress || {};
        const unitProgress = userProgress[unitId] || {};
        return !!unitProgress['questionnaire'];
    }

    /**
     * 取得全站的下載統計資料
     */
    static async getPlatformStats(unitId) {
        try {
            const data = await appStorage.load(this.STATS_KEY) || {};
            return data[unitId] || { handoutDownloads: 0, phraseDownloads: 0 };
        } catch (e) {
            return { handoutDownloads: 0, phraseDownloads: 0 };
        }
    }

    /**
     * 儲存全站的下載統計資料
     */
    static async savePlatformStats(unitId, stats) {
        try {
            const data = await appStorage.load(this.STATS_KEY) || {};
            data[unitId] = stats;
            await appStorage.save(this.STATS_KEY, data);
        } catch (e) {}
    }

    /**
     * 記錄一次下載行為
     */
    static async recordDownload(unitId, type) {
        const stats = await this.getPlatformStats(unitId);
        if (type === 'handout') stats.handoutDownloads++;
        if (type === 'phrase') stats.phraseDownloads++;
        await this.savePlatformStats(unitId, stats);
    }

    /**
     * 取得特定單元的問卷總完成人數
     */
    static async getSurveyCompletions(unitId) {
        const allData = await this.getAllData();
        let count = 0;
        for (const user in allData) {
            if (allData[user]?.progress?.[unitId]?.['questionnaire']) {
                count++;
            }
        }
        return count;
    }
}

// 載入時自動執行舊資料遷移
ProgressTracker.migrateOldData();
