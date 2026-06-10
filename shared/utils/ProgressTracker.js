/**
 * ProgressTracker.js
 * 負責管理學生的學習進度與全站身分識別 (整合 word_exam_all_data)
 */

export class ProgressTracker {
    static STORAGE_KEY = 'word_exam_all_data';
    static USER_KEY = 'currentUser';
    static STATS_KEY = 'platform_stats_data';
    static MIGRATION_DONE_KEY = 'word_exam_migration_done';

    /**
     * 執行舊資料遷移 (Migration)
     * 將舊版的 word_exam_history 等資料合併至 word_exam_all_data
     */
    static migrateOldData() {
        if (localStorage.getItem(this.MIGRATION_DONE_KEY) === 'true') {
            return; // 已經遷移過，不再重複執行
        }

        let allData = this.getAllData();
        let migrated = false;

        const oldHistory = JSON.parse(localStorage.getItem('word_exam_history') || '[]');
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

        const oldAbandons = JSON.parse(localStorage.getItem('word_exam_abandons') || '[]');
        if (oldAbandons.length > 0) {
            oldAbandons.forEach(record => {
                const u = record.userName || 'Unknown';
                if (!allData[u]) allData[u] = { profile: { streak: 0, totalTests: 0, lastTestDate: '' }, history: [], abandons: [], progress: {} };
                if (!allData[u].abandons) allData[u].abandons = [];
                allData[u].abandons.push(record);
            });
            migrated = true;
        }

        const oldProfiles = JSON.parse(localStorage.getItem('word_exam_user_profiles') || '{}');
        if (Object.keys(oldProfiles).length > 0) {
            for (const [u, p] of Object.entries(oldProfiles)) {
                if (!allData[u]) allData[u] = { profile: p, history: [], abandons: [], progress: {} };
                else allData[u].profile = p;
            }
            migrated = true;
        }

        if (migrated) {
            this.saveAllData(allData);
        }
        
        // 標記為已遷移
        localStorage.setItem(this.MIGRATION_DONE_KEY, 'true');
    }

    /**
     * 取得當前登入的使用者名稱
     */
    static getCurrentUser() {
        return localStorage.getItem(this.USER_KEY);
    }

    /**
     * 設定當前使用者 (登入)
     */
    static setCurrentUser(userName) {
        if (!userName || !userName.trim()) return false;
        
        const cleanName = userName.trim();
        localStorage.setItem(this.USER_KEY, cleanName);
        
        // 初始化該使用者的資料結構 (若不存在)
        const allData = this.getAllData();
        if (!allData[cleanName]) {
            allData[cleanName] = {
                profile: { streak: 0, totalTests: 0, lastTestDate: '' },
                history: [],
                abandons: [],
                progress: {}
            };
            this.saveAllData(allData);
        } else if (!allData[cleanName].progress) {
            allData[cleanName].progress = {};
            this.saveAllData(allData);
        }
        return true;
    }

    /**
     * 登出
     */
    static logout() {
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * 取得所有資料
     */
    static getAllData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    /**
     * 儲存所有資料
     */
    static saveAllData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * 儲存閱讀大廳的遊戲/測驗結果
     * @param {Object} result - 遊戲結果資料
     * @param {string} result.gameType - 'Matching' | 'Reading' | 'Quiz'
     * @param {string} result.unit - 單元名稱/ID
     * @param {number} result.duration - 耗時 (秒)
     * @param {number} result.score - 分數或答對題數
     * @param {number} result.total - 總題數
     * @param {number} result.totalPercent - 得分百分比
     * @param {Array} result.stats - 詳細答題數據 (可選)
     * @param {string} result.file - 檔案/單元名稱 (供舊版相容)
     * @param {string} result.timeString - 格式化耗時 (供舊版相容)
     */
    static saveReadingGameResult(result) {
        const userName = this.getCurrentUser();
        if (!userName) return;

        const allData = this.getAllData();
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
            ...result // 允許傳入其他客製化欄位 (如 reviewData, stage1Duration 等)
        };

        // 將新紀錄加到最前面
        allData[userName].history.unshift(record);

        // 保留最近 50 筆
        if (allData[userName].history.length > 50) {
            allData[userName].history = allData[userName].history.slice(0, 50);
        }

        this.saveAllData(allData);
    }

    /**
     * 標記某個單元的特定任務為完成
     * @param {string} unitId - 單元 ID (例如 'yle-1')
     * @param {string} taskId - 任務 ID (例如 'synonyms', 'reading', 'quiz', 'questionnaire')
     */
    static markTaskComplete(unitId, taskId) {
        const userName = this.getCurrentUser();
        if (!userName) return; // 未登入不記錄

        const allData = this.getAllData();
        if (!allData[userName]) return;
        
        if (!allData[userName].progress) {
            allData[userName].progress = {};
        }
        if (!allData[userName].progress[unitId]) {
            allData[userName].progress[unitId] = {};
        }
        
        allData[userName].progress[unitId][taskId] = true;
        this.saveAllData(allData);
    }

    /**
     * 取得當前使用者在某個單元的完成度百分比
     * @param {string} unitId - 單元 ID
     * @returns {number} 0-100 的百分比
     */
    static getUnitProgress(unitId) {
        const userName = this.getCurrentUser();
        if (!userName) return 0;

        const allData = this.getAllData();
        const userProgress = allData[userName]?.progress || {};
        const unitProgress = userProgress[unitId] || {};
        
        // 定義該單元需要完成的核心任務
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
     * 取得特定使用者在某個單元的問卷是否完成 (供 Teacher Hub 使用)
     */
    static isQuestionnaireDone(userName, unitId) {
        const allData = this.getAllData();
        const userProgress = allData[userName]?.progress || {};
        const unitProgress = userProgress[unitId] || {};
        return !!unitProgress['questionnaire'];
    }

    /**
     * 取得全站的下載統計資料
     */
    static getPlatformStats(unitId) {
        try {
            const data = JSON.parse(localStorage.getItem(this.STATS_KEY)) || {};
            return data[unitId] || { handoutDownloads: 0, phraseDownloads: 0 };
        } catch (e) {
            return { handoutDownloads: 0, phraseDownloads: 0 };
        }
    }

    /**
     * 儲存全站的下載統計資料
     */
    static savePlatformStats(unitId, stats) {
        try {
            const data = JSON.parse(localStorage.getItem(this.STATS_KEY)) || {};
            data[unitId] = stats;
            localStorage.setItem(this.STATS_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    /**
     * 記錄一次下載行為
     * @param {string} unitId - 單元 ID
     * @param {string} type - 'handout' 或 'phrase'
     */
    static recordDownload(unitId, type) {
        const stats = this.getPlatformStats(unitId);
        if (type === 'handout') stats.handoutDownloads++;
        if (type === 'phrase') stats.phraseDownloads++;
        this.savePlatformStats(unitId, stats);
    }

    /**
     * 取得特定單元的問卷總完成人數
     */
    static getSurveyCompletions(unitId) {
        const allData = this.getAllData();
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
