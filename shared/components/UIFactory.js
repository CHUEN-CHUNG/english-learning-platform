import { ProgressTracker } from '../utils/ProgressTracker.js';

/**
 * UIFactory.js
 * 負責渲染 Reading Hub 與 Teacher Hub 的共用 UI 元件，例如單元卡片。
 */

export class UIFactory {
    /**
     * 檢查檔案是否存在 (用於學生端判斷講義是否可下載)
     */
    static async checkFileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 去除 UTF-8 BOM
     */
    static stripUtf8Bom(s) {
        return s.replace(/^\uFEFF/, '');
    }

    /**
     * 解析 CSV 單行
     */
    static parseCsvLine(line) {
        const parts = [];
        let cur = '';
        let inQ = false;
        for (let j = 0; j < line.length; j++) {
            const c = line[j];
            if (c === '"') inQ = !inQ;
            else if (c === ',' && !inQ) {
                parts.push(cur);
                cur = '';
            } else cur += c;
        }
        parts.push(cur);
        return parts;
    }

    /**
     * 從 Para 欄位取得最小段號
     */
    static minParagraphFromParaCell(cell) {
        if (!cell || !String(cell).trim()) return 1;
        const s = String(cell).trim().replace(/^["']|["']$/g, '');
        const nums = s
            .split(/[,，\s]+/)
            .map((x) => parseInt(x.trim(), 10))
            .filter((n) => !Number.isNaN(n));
        if (!nums.length) return 1;
        return Math.min(...nums);
    }

    /**
     * 抓取字典的最大段落數 (與 Matching Game 一致)
     */
    static async fetchDictionaryMaxParagraph(unitNumber) {
        const url = `../../content/vocabulary/YLE-${unitNumber}/YLE-${unitNumber}-Dictionary.csv`;
        try {
            const r = await fetch(url);
            if (!r.ok) return null;
            let text = await r.text();
            text = this.stripUtf8Bom(text);
            const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length);
            if (lines.length < 2) return null;
            const heads = this.parseCsvLine(lines[0]).map((h) =>
                this.stripUtf8Bom(h).trim().toLowerCase().replace(/\s+/g, ' ')
            );
            const paraIdx = heads.indexOf('para');
            if (paraIdx < 0) return null;
            let maxP = 0;
            for (let i = 1; i < lines.length; i++) {
                const parts = this.parseCsvLine(lines[i]);
                const m = this.minParagraphFromParaCell(parts[paraIdx] || '');
                if (m > maxP) maxP = m;
            }
            return maxP > 0 ? maxP : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * 渲染學生端 (Reading Hub) 單元卡片
     */
    static async renderStudentUnitCard(unit) {
        const handoutUrl = `/content/handouts/vocabulary/${unit.unitCode}/${unit.unitCode}-Handout.pdf`;
        const phraseUrl = `/content/handouts/phrase-reorganization/${unit.unitCode}/${unit.unitCode}-Phrase.pdf`;

        // 併發檢查檔案是否存在
        const [hasHandout, hasPhrase] = await Promise.all([
            this.checkFileExists(handoutUrl),
            this.checkFileExists(phraseUrl)
        ]);

        // 段落數：以 units.json 為底，若存在 Dictionary 則與題庫 Para 最大值對齊
        const dictMaxPara = await this.fetchDictionaryMaxParagraph(unit.unitNumber);
        const paragraphsCount = dictMaxPara != null
            ? Math.max(unit.paragraphs || 2, dictMaxPara)
            : unit.paragraphs || 2;

        let synonymsParaLinks = '';
        let readingParaLinks = '';
        for (let i = 1; i <= paragraphsCount; i++) {
            synonymsParaLinks += `<a href="../../apps/Matching-Game/index.html?unit=${unit.unitNumber}&para=${i}" class="dropdown-item" onclick="hubMarkTask('${unit.id}', 'synonyms')">Paragraph ${i} (第${i}段)</a>\n`;
            readingParaLinks += `<a href="../../apps/reading-practice/index.html?unit=${unit.unitNumber}&para=${i}" class="dropdown-item" onclick="hubMarkTask('${unit.id}', 'reading')">Paragraph ${i} (第${i}段)</a>\n`;
        }
        
        // 加入文章總結填空
        readingParaLinks += `<a href="../../apps/reading-practice/index.html?unit=${unit.unitNumber}&mode=summary" class="dropdown-item" style="color: #6b21a8; font-weight: bold;" onclick="hubMarkTask('${unit.id}', 'reading')">📝 Unit Summary Challenge (文章主旨填空)</a>\n`;

        // 取得該單元的進度
        const progressPercent = await ProgressTracker.getUnitProgress(unit.id);

        return `
            <div class="unit-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 class="unit-title" style="margin-bottom: 0;">${unit.title}</h2>
                    <div class="progress-container" style="width: 150px; text-align: right;">
                        <div style="font-size: 0.85em; color: #666; margin-bottom: 4px;">完成度: ${progressPercent}%</div>
                        <div style="width: 100%; background-color: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; background-color: ${progressPercent === 100 ? '#28a745' : '#007bff'}; height: 100%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
                <div class="action-grid">
                    <div class="dropdown-container">
                        <button type="button" class="action-btn w-100" onclick="toggleDropdown('${unit.id}-synonyms', event)">
                            <div class="action-title">🎮 同反義詞連連看</div>
                            <div class="action-desc">Synonyms & Antonyms Match</div>
                        </button>
                        <div id="${unit.id}-synonyms" class="dropdown-menu">
                            <a href="../../apps/Matching-Game/index.html?unit=${unit.unitNumber}" class="dropdown-item" onclick="hubMarkTask('${unit.id}', 'synonyms')">Full Article (全文章)</a>
                            ${synonymsParaLinks}
                        </div>
                    </div>
                    
                    <div class="dropdown-container">
                        <button type="button" class="action-btn w-100" onclick="toggleDropdown('${unit.id}-reading', event)">
                            <div class="action-title">📖 閱讀練習</div>
                            <div class="action-desc">Reading Practice</div>
                        </button>
                        <div id="${unit.id}-reading" class="dropdown-menu">
                            ${readingParaLinks}
                        </div>
                    </div>

                    <a href="${hasHandout ? handoutUrl : '#'}" target="${hasHandout ? '_blank' : '_self'}" class="action-btn ${hasHandout ? '' : 'disabled'}" ${hasHandout ? `onclick="hubRecordDownload('${unit.id}', 'handout')"` : ''}>
                        <div class="action-title">📥 課堂講義下載</div>
                        <div class="action-desc">${hasHandout ? 'Class Handout (PDF)' : '教材準備中 (Not Ready)'}</div>
                    </a>

                    <a href="${hasPhrase ? phraseUrl : '#'}" target="${hasPhrase ? '_blank' : '_self'}" class="action-btn ${hasPhrase ? '' : 'disabled'}" ${hasPhrase ? `onclick="hubRecordDownload('${unit.id}', 'phrase')"` : ''}>
                        <div class="action-title">📥 例句重組測驗下載</div>
                        <div class="action-desc">${hasPhrase ? 'Phrase Reorganization Quiz (PDF)' : '教材準備中 (Not Ready)'}</div>
                    </a>

                    <a href="../../apps/Vocabulary-Quiz/index.html?unit=${unit.unitNumber}" class="action-btn" onclick="hubMarkTask('${unit.id}', 'quiz')">
                        <div class="action-title">📝 單字總測驗</div>
                        <div class="action-desc">Comprehensive Vocabulary Quiz</div>
                    </a>

                    <button type="button" data-tally-open="44PkBr" data-tally-layout="modal" data-tally-width="1500" data-tally-overlay="1" data-tally-emoji-text="👋" data-tally-emoji-animation="wave" class="action-btn" onclick="hubMarkTask('${unit.id}', 'questionnaire'); setTimeout(function(){ window.location.reload(); }, 1000);">
                        <div class="action-title">📋 課後問卷</div>
                        <div class="action-desc">Unit Questionnaire</div>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染教師端 (Teacher Hub) 單元卡片
     */
    static async renderTeacherUnitCard(unit) {
        const handoutUrl = `/content/handouts/vocabulary/${unit.unitCode}/${unit.unitCode}-Handout.pdf`;
        const phraseUrl = `/content/handouts/phrase-reorganization/${unit.unitCode}/${unit.unitCode}-Phrase.pdf`;

        const [hasHandout, hasPhrase] = await Promise.all([
            this.checkFileExists(handoutUrl),
            this.checkFileExists(phraseUrl)
        ]);

        // 取得下載與問卷統計資料
        const stats = await ProgressTracker.getPlatformStats(unit.id);
        const surveyCount = await ProgressTracker.getSurveyCompletions(unit.id);

        return `
            <div class="unit-card">
                <h2 class="unit-title">${unit.title}</h2>
                <div class="action-grid">
                    <a href="javascript:void(0)" onclick="window.openTeacherData('Matching', '${unit.unitCode}', '${unit.unitNumber}', ${JSON.stringify(unit.title)})" class="action-btn data-btn w-100">
                        <div class="action-title">📊 同反義詞連連看 (數據)</div>
                        <div class="action-desc">Synonyms Match Data</div>
                    </a>
                    
                    <a href="javascript:void(0)" onclick="window.openTeacherData('Reading', '${unit.unitCode}', '${unit.unitNumber}', ${JSON.stringify(unit.title)})" class="action-btn data-btn w-100">
                        <div class="action-title">📈 閱讀練習 (數據)</div>
                        <div class="action-desc">Reading Practice Data</div>
                    </a>

                    <a href="javascript:void(0)" class="action-btn stats-btn ${hasHandout ? '' : 'disabled'}">
                        <div class="action-title">📥 課堂講義 (下載次數)</div>
                        <div class="action-desc">${hasHandout ? `累積下載: ${stats.handoutDownloads} 次` : '教材準備中 (Not Ready)'}</div>
                    </a>

                    <a href="javascript:void(0)" class="action-btn stats-btn ${hasPhrase ? '' : 'disabled'}">
                        <div class="action-title">📥 例句重組測驗 (下載次數)</div>
                        <div class="action-desc">${hasPhrase ? `累積下載: ${stats.phraseDownloads} 次` : '教材準備中 (Not Ready)'}</div>
                    </a>

                    <a href="javascript:void(0)" onclick="window.openTeacherData('Quiz', '${unit.unitCode}', '${unit.unitNumber}', ${JSON.stringify(unit.title)})" class="action-btn data-btn">
                        <div class="action-title">📝 單字總測驗 (數據)</div>
                        <div class="action-desc">Vocabulary Quiz Data</div>
                    </a>

                    <a href="javascript:void(0)" class="action-btn survey-btn">
                        <div class="action-title">📋 問卷回復 (已填寫)</div>
                        <div class="action-desc">共 ${surveyCount} 位學生完成</div>
                    </a>
                </div>
            </div>
        `;
    }
}
