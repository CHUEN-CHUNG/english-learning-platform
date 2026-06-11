<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import * as XLSX from 'xlsx';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';

  onMount(() => {
    const STORAGE_KEY = 'word_exam_all_data';

    let wordsData: any[] = [];
    let stage1Answers: any[] = [];
    let stage2Answers: any[] = [];
    let stage3Answers: any[] = [];
    let stage3PhraseRevealed: Record<number, boolean> = {};
    let currentStage = 0;
    let startTime: Date | null = null;
    let stage1StartTime: number | null = null;
    let stage2StartTime: number | null = null;
    let stage3StartTime: number | null = null;
    let userName = '';
    let reviewSource: 'result' | 'history' = 'result';

    const trackingData: any = {
      events: [],
      qTimeS1: {},
      qTimeS2: {},
      qTimeS3: {},
      lastActionTime: Date.now()
    };

    const cleanups: Array<() => void> = [];

    function logEvent(eventName: string) {
      trackingData.events.push({ event: eventName, timestamp: new Date().toISOString() });
    }

    function forceAllScrollRootsToTop() {
      const root = (document.scrollingElement || document.documentElement) as HTMLElement;
      root.scrollTop = 0;
      root.scrollLeft = 0;
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

      const sc = document.getElementById('scroll-container');
      if (sc) {
        sc.scrollTop = 0;
        sc.scrollLeft = 0;
      }

      let el: HTMLElement | null = document.getElementById('app');
      while (el && el !== document.documentElement) {
        if (el.scrollHeight > el.clientHeight + 1) {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        }
        el = el.parentElement;
      }
    }

    function scrollAppToTop() {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && typeof ae.blur === 'function' && ae !== document.body) {
        try {
          ae.blur();
        } catch {
          /* ignore */
        }
      }
      forceAllScrollRootsToTop();
      requestAnimationFrame(() => forceAllScrollRootsToTop());
      requestAnimationFrame(() => requestAnimationFrame(() => forceAllScrollRootsToTop()));
      setTimeout(() => forceAllScrollRootsToTop(), 0);
      setTimeout(() => forceAllScrollRootsToTop(), 50);
      setTimeout(() => forceAllScrollRootsToTop(), 120);
    }

    function logUserEngagement(actionType: string) {
      if (!userName) return;
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!allData[userName]) {
        allData[userName] = { profile: { streak: 0, totalTests: 0, lastTestDate: '', engagement: {} }, history: [], abandons: [] };
      }
      if (!allData[userName].profile.engagement) {
        allData[userName].profile.engagement = { historyClicks: 0, reviewCurrentClicks: 0, reviewHistoryClicks: 0 };
      }
      allData[userName].profile.engagement[actionType] = (allData[userName].profile.engagement[actionType] || 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    }

    const onBeforeUnload = () => {
      if (currentStage > 0 && currentStage < 4) {
        logEvent('abandonment');
        const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (!allData[userName]) {
          allData[userName] = { profile: { streak: 0, totalTests: 0, lastTestDate: '' }, history: [], abandons: [] };
        }
        if (!allData[userName].abandons) allData[userName].abandons = [];
        allData[userName].abandons.push({ date: new Date().toLocaleString('zh-TW'), stage: currentStage, events: trackingData.events });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    cleanups.push(() => window.removeEventListener('beforeunload', onBeforeUnload));

    const elLoading = document.getElementById('loading')!;
    const elError = document.getElementById('error')!;
    const elStartScreen = document.getElementById('start-screen')!;
    const elStage1 = document.getElementById('stage1')!;
    const elStage2 = document.getElementById('stage2')!;
    const elResult = document.getElementById('result')!;

    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    const unitParam = urlParams.get('unit');

    let filePath = '';
    if (fileParam) filePath = fileParam;
    else if (unitParam) filePath = `${base}/content/vocabulary/YLE-${unitParam}/YLE-${unitParam}.xlsx`;
    else filePath = `${base}/content/vocabulary/YLE-1/YLE-1.xlsx`;

    function isEmptySynAntValue(val: any): boolean {
      const s = (val || '').toString().trim();
      if (!s) return true;
      return /^(無|no synonyms?|no antonyms?)$/i.test(s);
    }

    function collectEnglishWords(...values: any[]): string[] {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const v of values) {
        const s = (v || '').toString().trim();
        if (isEmptySynAntValue(s)) continue;
        const key = s.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(s);
      }
      return result;
    }

    function checkAnswer(input: string, correct: string): boolean {
      if (!input || !correct) return false;
      const cleanInput = input.trim().toLowerCase().replace(/\s+/g, ' ');
      const cleanCorrect = correct.trim().toLowerCase().replace(/\s+/g, ' ');
      return cleanInput === cleanCorrect;
    }

    function escapeHtml(text: any): string {
      if (text == null) return '';
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function formatStage1SynAntLine(synonyms: string[], antonyms: string[]): string {
      const parts: string[] = [];
      if (synonyms.length) parts.push(`同義詞：${synonyms.join('、')}`);
      if (antonyms.length) parts.push(`反義詞：${antonyms.join('、')}`);
      return parts.join('；');
    }

    function hasStage3Item(item: any): boolean {
      return !!(item.ex3En && item.ex3Zh);
    }

    function countStage3Items(data: any[]): number {
      return data.filter(hasStage3Item).length;
    }

    function inferEx3Pattern(ex3En: string, phrase: string): string {
      const s = String(ex3En || '').trim().toLowerCase();
      const p = String(phrase || '').trim().toLowerCase();
      if (!s) return 'S + V + O';
      if (/^there (is|are)\b/.test(s)) return 'There is/are…';
      if (/\b(must|cannot|can't|can)\b/.test(s)) return 'can / must + V';
      if (/\b(want|like|loves|love)\b/.test(s)) return 'S + like / want + n / v-ing';
      if (/\b(asked|need|decide|explain|ran|jumped|will open|find out)\b/.test(s) && /\bto\b/.test(s)) return 'S + V + to + V';
      if (/\b(is|are|was|were|am|will be)\b/.test(s)) return 'S + be + adj';
      if (p && s.includes(p)) return '片語';
      return 'S + V + O';
    }

    function inferEx3Tense(ex3En: string): string {
      const s = String(ex3En || '').trim().toLowerCase();
      if (!s) return '現在簡單式';
      if (/\b(am|is|are)\s+\w+ing\b/.test(s) && !/\binterested in\b/.test(s)) return '現在進行式';
      if (/\bwill\b/.test(s) || /\w'll\b/.test(s) || /\bgoing to\b/.test(s)) return '未來式';
      if (/\b(yesterday|last night|was|were)\b/.test(s) || /\b(came|got|made|found|read|took|helped|ran|jumped|waited|bought|told|moved|put|caught|had|waited)\b/.test(s)) return '過去式';
      return '現在簡單式';
    }

    function expandContractions(text: string): string {
      let s = String(text || '').replace(/[\u2019\u0060\u00B4]/g, "'").toLowerCase();
      const ntMap: Record<string, string> = {
        "won't": 'will not', "can't": 'cannot', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
        "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "mustn't": 'must not',
        "couldn't": 'could not', "shouldn't": 'should not', "wouldn't": 'would not', "haven't": 'have not', "hasn't": 'has not'
      };
      for (const [k, v] of Object.entries(ntMap)) {
        const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(`\\b${esc}\\b`, 'g'), v);
      }
      const prons = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'that', 'there'];
      for (const p of prons) {
        s = s.replace(new RegExp(`\\b${p}'ll\\b`, 'g'), `${p} will`);
        s = s.replace(new RegExp(`\\b${p}'re\\b`, 'g'), `${p} are`);
        s = s.replace(new RegExp(`\\b${p}'ve\\b`, 'g'), `${p} have`);
      }
      s = s.replace(/\bi'm\b/g, 'i am');
      s = s.replace(/\b(he|she|it|that)'s\b/g, '$1 is');
      s = s.replace(/\b(you|we|they)'re\b/g, '$1 are');
      return s.replace(/\s{2,}/g, ' ').trim();
    }

    function normalizeSentenceText(text: string): string {
      if (!text) return '';
      const stripped = String(text).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' ').trim();
      return expandContractions(stripped);
    }

    function bumpCount(map: Map<string, number>, key: string, amount = 1) {
      if (!key) return;
      map.set(key, (map.get(key) || 0) + amount);
    }

    function topEntriesFromMap(map: Map<string, number>, limit = 8): [string, number][] {
      return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant')).slice(0, limit);
    }

    function checkSentenceAnswer(input: string, correct: string): boolean {
      if (!input || !correct) return false;
      return normalizeSentenceText(input) === normalizeSentenceText(correct);
    }

    function analyzeS3GrammarErrors(userAns: string, correct: string, item: any): string[] {
      const u = normalizeSentenceText(userAns);
      const c = normalizeSentenceText(correct);
      if (!u) return ['第三階段：未寫完整句'];
      if (u === c) return [];

      const tags: string[] = [];
      const pattern = item.ex3Pattern || inferEx3Pattern(correct, item.phrase);
      const word = (item.word || '').toLowerCase();
      const phrase = (item.phrase || '').toLowerCase();

      if (word && !u.includes(word) && !u.includes(word.replace(/e$/, ''))) tags.push('漏寫目標單字');
      if (phrase && !u.includes(phrase)) tags.push('片語用法錯誤');
      if (pattern === 'There is/are…' && !/\bthere (is|are)\b/.test(u)) tags.push('There is/are 句型');
      if (pattern === 'can / must + V' && !/\b(must|can|cannot|can't)\b/.test(u)) tags.push('情態動詞 can/must');
      if (pattern === 'S + be + adj' && !/\b(is|are|was|were|am|be)\b/.test(u)) tags.push('be 動詞 + 形容詞');
      if (pattern === 'S + V + to + V' && !/\bto\b/.test(u)) tags.push('V + to + V 不定詞');
      if (pattern === 'S + like / want + n / v-ing' && !/\b(like|want|love)\b/.test(u)) tags.push('like / want 句型');
      if (pattern === '片語' && phrase && !u.includes(phrase)) tags.push('固定片語搭配');
      if (!tags.length) tags.push('句子拼寫或詞序');
      return tags;
    }

    function buildExamErrorSummary(reviewData: any[]) {
      const wrongWords = new Map<string, number>();
      const wrongPhrases = new Map<string, number>();
      const wrongPatterns = new Map<string, number>();
      const wrongGrammar = new Map<string, number>();

      reviewData.forEach((r, i) => {
        const item = wordsData[i] || {};
        if (!r.s1Correct) {
          bumpCount(wrongWords, r.word);
          bumpCount(wrongGrammar, r.s1ErrorType === 'Blank' ? '第一階段：定義未作答' : '第一階段：單字拼寫');
        }
        if (!r.s2Correct) {
          bumpCount(wrongWords, r.word);
          bumpCount(wrongGrammar, r.s2ErrorType === 'Blank' ? '第二階段：例句未選字' : '第二階段：例句選錯字');
        }
        if (r.s3Eligible && r.s3Correct === false) {
          bumpCount(wrongWords, r.word);
          if (item.phrase) bumpCount(wrongPhrases, item.phrase);
          if (item.ex3Pattern) bumpCount(wrongPatterns, item.ex3Pattern);
          (r.s3GrammarTags || []).forEach((tag: string) => bumpCount(wrongGrammar, tag));
        }
      });

      return { wrongWords, wrongPhrases, wrongPatterns, wrongGrammar };
    }

    function renderInsightSection(title: string, entries: [string, number][], emptyText: string): string {
      if (!entries.length) {
        return `<section><h4 class="font-bold text-gray-700 mb-2">${title}</h4><p class="text-gray-500 text-sm md:text-base">${emptyText}</p></section>`;
      }
      const chips = entries
        .map(
          ([label, count]) =>
            `<span class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-100 px-2.5 py-1 rounded-lg text-sm md:text-base mr-2 mb-2"><span>${escapeHtml(label)}</span><span class="text-xs font-bold bg-indigo-200 px-1.5 rounded">${count}</span></span>`
        )
        .join('');
      return `<section><h4 class="font-bold text-gray-700 mb-2">${title}</h4><div class="flex flex-wrap">${chips}</div></section>`;
    }

    function showExamInsightModal(reviewData: any[]) {
      const modal = document.getElementById('exam-insight-modal');
      const content = document.getElementById('exam-insight-content');
      if (!modal || !content) return;
      const summary = buildExamErrorSummary(reviewData);
      const hasAnyError = summary.wrongWords.size > 0;
      if (!hasAnyError) {
        content.innerHTML = `
          <p class="text-center text-green-600 font-bold text-lg py-4">🎉 太棒了！這次三階段都沒有明顯錯誤弱點。</p>
          <p class="text-center text-gray-500 text-sm">保持練習，繼續累積語感與句構！</p>`;
      } else {
        content.innerHTML =
          renderInsightSection('常錯單字', topEntriesFromMap(summary.wrongWords), '無') +
          renderInsightSection('常錯片語', topEntriesFromMap(summary.wrongPhrases), '第三階段片語皆正確') +
          renderInsightSection('常錯句型', topEntriesFromMap(summary.wrongPatterns), '第三階段句型皆正確') +
          renderInsightSection('常錯文法／題型', topEntriesFromMap(summary.wrongGrammar), '無');
      }
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeExamInsightModal() {
      const modal = document.getElementById('exam-insight-modal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    document.getElementById('btn-close-exam-insight')?.addEventListener('click', closeExamInsightModal);
    document.getElementById('exam-insight-modal')?.addEventListener('click', (e: any) => {
      if (e.target.id === 'exam-insight-modal') closeExamInsightModal();
    });

    function countEnglishWords(sentence: string): number {
      if (!sentence || !String(sentence).trim()) return 0;
      return String(sentence).trim().split(/\s+/).filter(Boolean).length;
    }

    function getStage3ValidationIssues(sentence: string, phrase: string): string[] {
      if (!sentence || !String(sentence).trim()) return [];
      const s = String(sentence).trim();
      const issues: string[] = [];
      const wordCount = countEnglishWords(s);
      if (wordCount < 6) issues.push(`too short (${wordCount} words, min 6)`);
      if (wordCount > 10) issues.push(`too long (${wordCount} words, max 10)`);
      if (phrase && String(phrase).trim()) {
        const p = String(phrase).trim().toLowerCase();
        if (!s.toLowerCase().includes(p)) issues.push(`missing Phrase「${phrase}」`);
      }
      const rules = [
        { label: 'because', re: /\bbecause\b/i },
        { label: 'so', re: /\bso\b/i },
        { label: 'when', re: /\bwhen\b/i },
        { label: 'if', re: /\bif\b/i },
        { label: 'who', re: /\bwho\b/i },
        { label: 'which', re: /\bwhich\b/i },
        { label: 'that (relative)', re: /\b\w[\w'-]*\s+that\s+(?!I\b|you\b|he\b|she\b|it\b|we\b|they\b|is\b|are\b|was\b|were\b|the\b|a\b|an\b)[\w'-]+/i },
        { label: 'semicolon', re: /;/ },
        { label: 'or...or', re: /\bor\b[^.?!]*\bor\b/i },
        { label: 'by + -ing (nested)', re: /\bby\s+\w+ing\b/i },
        { label: 'hoping to', re: /\bhoping\s+to\b/i }
      ];
      for (const rule of rules) if (rule.re.test(s)) issues.push(rule.label);
      return issues;
    }

    function auditStage3Dictionary(data: any[]) {
      data.forEach((item) => {
        if (!item.ex3En) return;
        const issues = getStage3ValidationIssues(item.ex3En, item.phrase);
        if (issues.length) console.warn(`[單字測驗·第三階段 QA]「${item.word}」Example-English 3 不符合規範（${issues.join('、')}）：`, item.ex3En);
      });
    }

    async function loadData() {
      try {
        let response: Response | undefined;
        let actualPath = filePath;
        const isHTML = (res: Response) => res.headers.get('content-type')?.includes('text/html');

        let baseName = '';
        let possiblePaths: string[] = [];

        if (fileParam) {
          baseName = fileParam.startsWith('word-final-') ? fileParam.replace('word-final-', '') : fileParam;
          possiblePaths = [
            `${base}/content/vocabulary/${baseName}/${baseName}.xlsx`,
            `${base}/content/vocabulary/${baseName}/${baseName}.csv`,
            `${base}/content/vocabulary/${baseName}.xlsx`,
            `${base}/content/vocabulary/${baseName}.csv`,
            fileParam.endsWith('.xlsx') || fileParam.endsWith('.csv') ? fileParam : `${fileParam}.xlsx`,
            fileParam.endsWith('.xlsx') || fileParam.endsWith('.csv') ? fileParam : `${fileParam}.csv`
          ];
        } else {
          baseName = unitParam ? `YLE-${unitParam}` : 'YLE-1';
          possiblePaths = [
            `${base}/content/vocabulary/${baseName}/${baseName}-Dictionary.csv`,
            `${base}/content/vocabulary/${baseName}/${baseName}-Dictionary.xlsx`,
            `${base}/content/vocabulary/${baseName}/${baseName}.xlsx`,
            `${base}/content/vocabulary/${baseName}/${baseName}.csv`,
            `${base}/content/vocabulary/${baseName}.xlsx`,
            `${base}/content/vocabulary/${baseName}.csv`
          ];
        }

        let found = false;
        for (const path of possiblePaths) {
          response = await fetch(path);
          if (response.ok && !isHTML(response)) {
            actualPath = path;
            found = true;
            break;
          }
        }

        if (!found || !response) throw new Error(`找不到題庫檔案：${baseName} (.xlsx 或 .csv)。請確認檔案是否存在於 content/vocabulary 資料夾中！`);

        filePath = actualPath;

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        wordsData = json
          .map((row: any) => {
            const keys = Object.keys(row);
            const wordKey = keys.find((k) => k.toLowerCase() === 'word' || (k.includes('單字') && k.includes('挑選')));
            const defKey = keys.find((k) => k.toLowerCase().includes('definition'));
            const posKey = keys.find((k) => {
              const lk = k.toLowerCase().trim();
              return lk === 'pos' || lk === 'speech' || lk.includes('詞性');
            });
            const syn1Key = keys.find((k) => k.toLowerCase().includes('synonym-english 1') || k.includes('同義詞一單字'));
            const syn2Key = keys.find((k) => k.toLowerCase().includes('synonym-english 2') || k.includes('同義詞二單字'));
            const ant1Key = keys.find((k) => k.toLowerCase().includes('antonym-english 1') || k.includes('反義詞一單字'));
            const ant2Key = keys.find((k) => k.toLowerCase().includes('antonym-english 2') || k.includes('反義詞二單字'));
            const exKey = keys.find((k) => k.toLowerCase().trim() === 'example-english 2') || keys.find((k) => k.toLowerCase().includes('example-english'));
            const phraseKey = keys.find((k) => k.toLowerCase().trim() === 'phrase');
            const ex3EnKey = keys.find((k) => k.toLowerCase().includes('example-english 3'));
            const ex3ZhKey = keys.find((k) => k.toLowerCase().includes('example-chinnese 3') || k.toLowerCase().includes('example-chinese 3'));
            const ex3PatternKey = keys.find((k) => k.toLowerCase().trim() === 'ex3-pattern');
            const ex3TenseKey = keys.find((k) => k.toLowerCase().trim() === 'ex3-tense');

            const pos = posKey && row[posKey] ? row[posKey].toString().trim() : '';
            const synonyms = collectEnglishWords(syn1Key ? row[syn1Key] : '', syn2Key ? row[syn2Key] : '');
            const antonyms = collectEnglishWords(ant1Key ? row[ant1Key] : '', ant2Key ? row[ant2Key] : '');

            return {
              word: wordKey && row[wordKey] ? row[wordKey].toString().trim() : '',
              pos,
              definition: defKey && row[defKey] ? row[defKey].toString().trim() : '',
              synonyms,
              antonyms,
              phrase: phraseKey && row[phraseKey] ? row[phraseKey].toString().trim() : '',
              example: exKey && row[exKey] ? row[exKey].toString().trim() : '',
              ex3En: ex3EnKey && row[ex3EnKey] ? row[ex3EnKey].toString().trim() : '',
              ex3Zh: ex3ZhKey && row[ex3ZhKey] ? row[ex3ZhKey].toString().trim() : '',
              ex3Pattern: ex3PatternKey && row[ex3PatternKey] ? row[ex3PatternKey].toString().trim() : '',
              ex3Tense: ex3TenseKey && row[ex3TenseKey] ? row[ex3TenseKey].toString().trim() : ''
            };
          })
          .filter((item) => item.word && item.definition);

        wordsData.forEach((item) => {
          if (!item.ex3Pattern && item.ex3En) item.ex3Pattern = inferEx3Pattern(item.ex3En, item.phrase);
          if (!item.ex3Tense && item.ex3En) item.ex3Tense = inferEx3Tense(item.ex3En);
        });

        auditStage3Dictionary(wordsData);
        wordsData.sort(() => Math.random() - 0.5);

        stage1Answers = new Array(wordsData.length).fill('');
        stage2Answers = new Array(wordsData.length).fill('');
        stage3Answers = new Array(wordsData.length).fill('');
        stage3PhraseRevealed = {};

        document.getElementById('s1-total')!.textContent = String(wordsData.length);
        document.getElementById('s2-total')!.textContent = String(wordsData.length);
        document.getElementById('s3-total')!.textContent = String(countStage3Items(wordsData));

        elLoading.classList.add('hidden');
        renderStage1();

        if (urlParams.get('mode') !== 'teacher') {
          (document.getElementById('btn-start') as HTMLButtonElement).click();
        }
      } catch (error: any) {
        elLoading.classList.add('hidden');
        elError.classList.remove('hidden');
        elError.textContent = '載入資料失敗：' + error.message;
        console.error(error);
      }
    }

    // --- Stage 1 ---
    const s1Container = document.getElementById('s1-questions-container')!;
    const s1FocusTimes: Record<string, number | null> = {};

    function renderStage1() {
      s1Container.innerHTML = '';
      wordsData.forEach((item, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-blue-50 p-4 md:p-6 rounded-xl';
        const defLine = item.pos ? `(${escapeHtml(item.pos)}) ${escapeHtml(item.definition)}` : escapeHtml(item.definition);
        const synAntLine = formatStage1SynAntLine(item.synonyms || [], item.antonyms || []);
        const synAntHtml = synAntLine ? `<p class="text-sm md:text-base text-gray-600 mt-2 leading-relaxed">${escapeHtml(synAntLine)}</p>` : '';
        questionDiv.innerHTML = `
          <div class="flex items-start mb-4">
            <span class="text-blue-600 font-bold text-base md:text-xl mr-3 shrink-0">${index + 1}.</span>
            <div>
              <p class="text-base md:text-xl leading-relaxed">${defLine}</p>
              ${synAntHtml}
            </div>
          </div>
          <input type="text" data-index="${index}" class="s1-input w-full text-base md:text-xl p-2 md:p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500" placeholder="請輸入單字..." autocomplete="off" value="${escapeHtml(stage1Answers[index] || '')}">`;
        s1Container.appendChild(questionDiv);
      });

      document.querySelectorAll('.s1-input').forEach((input) => {
        input.addEventListener('keydown', (e: any) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const currentIdx = parseInt(e.target.getAttribute('data-index'));
            const nextInput = document.querySelector(`.s1-input[data-index="${currentIdx + 1}"]`) as HTMLElement | null;
            if (nextInput) nextInput.focus();
            else (document.getElementById('s1-submit') as HTMLElement).focus();
          }
        });
        input.addEventListener('input', (e: any) => {
          stage1Answers[e.target.getAttribute('data-index')] = e.target.value;
        });
        input.addEventListener('focus', (e: any) => {
          s1FocusTimes[e.target.getAttribute('data-index')] = Date.now();
        });
        input.addEventListener('blur', (e: any) => {
          const idx = e.target.getAttribute('data-index');
          if (s1FocusTimes[idx]) {
            trackingData.qTimeS1[idx] = (trackingData.qTimeS1[idx] || 0) + (Date.now() - (s1FocusTimes[idx] as number));
            s1FocusTimes[idx] = null;
          }
        });
      });
    }

    document.getElementById('s1-submit')!.addEventListener('click', () => {
      if (document.activeElement && (document.activeElement as HTMLElement).classList.contains('s1-input')) {
        (document.activeElement as HTMLElement).blur();
      }
      if (confirm('未填寫題目將視為錯誤，請確認是否皆有作答～')) {
        logEvent('complete_stage1');
        trackingData.stage1Duration = Math.floor((Date.now() - (stage1StartTime as number)) / 1000);
        stage2StartTime = Date.now();
        trackingData.lastActionTime = Date.now();
        elStage1.classList.add('hidden');
        elStage2.classList.remove('hidden');
        currentStage = 2;
        renderStage2();
        scrollAppToTop();
      }
    });

    // --- Stage 2 ---
    const s2Container = document.getElementById('s2-questions-container')!;
    const s2WordBank = document.getElementById('s2-word-bank')!;
    let selectedZoneElement: HTMLElement | null = null;
    let selectedWordElement: HTMLElement | null = null;

    function renderStage2() {
      s2Container.innerHTML = '';
      s2WordBank.innerHTML = '';
      const stage2DisplayWords: any[] = [];

      wordsData.forEach((item, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-purple-50 p-4 md:p-6 rounded-xl';
        const word = item.word;
        const example = item.example;
        let actualWordInSentence = word;

        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        let matchFound = false;
        let blankedExample = example.replace(regex, (match: string, offset: number) => {
          if (matchFound) return match;
          matchFound = true;
          actualWordInSentence = match;
          const isStart = offset === 0 || example.substring(0, offset).trim() === '';
          return `<span class="click-zone inline-flex items-center justify-center min-w-[80px] md:min-w-[120px] h-[32px] md:h-[40px] bg-white border-2 border-purple-300 rounded-lg mx-1 md:mx-2 align-bottom transition-colors duration-200 overflow-hidden cursor-pointer hover:bg-gray-100" data-index="${index}" data-capitalize="${isStart}"></span>`;
        });

        if (!matchFound) {
          const wordsInExample = example.match(/[a-zA-Z]+/g) || [];
          let bestMatch = '';
          let maxPrefixLen = 0;
          for (const w of wordsInExample) {
            let prefixLen = 0;
            const minLen = Math.min(word.length, w.length);
            for (let i = 0; i < minLen; i++) {
              if (word.toLowerCase()[i] === w.toLowerCase()[i]) prefixLen++;
              else break;
            }
            if (prefixLen >= Math.min(3, word.length) && Math.abs(word.length - w.length) <= 4) {
              if (prefixLen > maxPrefixLen) {
                maxPrefixLen = prefixLen;
                bestMatch = w;
              }
            }
          }
          if (bestMatch) {
            const fallbackRegex = new RegExp(`\\b${bestMatch}\\b`, 'gi');
            blankedExample = example.replace(fallbackRegex, (match: string, offset: number) => {
              if (matchFound) return match;
              matchFound = true;
              actualWordInSentence = match;
              const isStart = offset === 0 || example.substring(0, offset).trim() === '';
              return `<span class="click-zone inline-flex items-center justify-center min-w-[80px] md:min-w-[120px] h-[32px] md:h-[40px] bg-white border-2 border-purple-300 rounded-lg mx-1 md:mx-2 align-bottom transition-colors duration-200 overflow-hidden cursor-pointer hover:bg-gray-100" data-index="${index}" data-capitalize="${isStart}"></span>`;
            });
          }
        }

        if (!matchFound) {
          const simpleRegex = new RegExp(word, 'gi');
          blankedExample = example.replace(simpleRegex, (match: string, offset: number) => {
            if (matchFound) return match;
            matchFound = true;
            actualWordInSentence = match;
            const isStart = offset === 0 || example.substring(0, offset).trim() === '';
            return `<span class="click-zone inline-flex items-center justify-center min-w-[80px] md:min-w-[120px] h-[32px] md:h-[40px] bg-white border-2 border-purple-300 rounded-lg mx-1 md:mx-2 align-bottom transition-colors duration-200 overflow-hidden cursor-pointer hover:bg-gray-100" data-index="${index}" data-capitalize="${isStart}"></span>`;
          });
        }

        stage2DisplayWords.push({ displayWord: actualWordInSentence.toLowerCase(), baseWord: word, id: `word-${index}` });

        questionDiv.innerHTML = `
          <div class="flex items-start">
            <span class="text-purple-600 font-bold text-base md:text-xl mr-3 mt-1">${index + 1}.</span>
            <p class="text-base md:text-xl leading-loose">${blankedExample}</p>
          </div>`;
        s2Container.appendChild(questionDiv);
      });

      const shuffledWords = [...stage2DisplayWords].sort(() => Math.random() - 0.5);
      shuffledWords.forEach((item) => {
        const wordEl = document.createElement('div');
        wordEl.id = item.id;
        wordEl.className = 'clickable-word inline-flex items-center justify-center bg-white px-2 py-1.5 md:px-4 md:py-2 rounded-lg shadow border-2 border-purple-300 cursor-pointer text-base md:text-lg font-medium text-purple-700 hover:bg-purple-50 transition-all';
        wordEl.textContent = item.displayWord;
        wordEl.dataset.originalWord = item.displayWord;
        wordEl.dataset.baseWord = item.baseWord;
        wordEl.addEventListener('click', handleWordClick);
        s2WordBank.appendChild(wordEl);
      });

      document.querySelectorAll('.click-zone').forEach((zone) => {
        zone.addEventListener('click', handleZoneClick);
      });
    }

    function handleWordClick(e: any) {
      const el = e.currentTarget as HTMLElement;
      if (el.parentElement !== s2WordBank) {
        returnToBank(el);
        return;
      }
      if (selectedZoneElement) {
        placeWordInZone(el, selectedZoneElement);
      } else if (selectedWordElement === el) {
        el.classList.remove('ring-4', 'ring-purple-500');
        selectedWordElement = null;
      } else {
        if (selectedWordElement) selectedWordElement.classList.remove('ring-4', 'ring-purple-500');
        el.classList.add('ring-4', 'ring-purple-500');
        selectedWordElement = el;
      }
    }

    function handleZoneClick(e: any) {
      const zone = e.currentTarget as HTMLElement;
      if (selectedWordElement) {
        if (zone.children.length > 0) returnToBank(zone.children[0] as HTMLElement);
        placeWordInZone(selectedWordElement, zone);
        return;
      }
      if (zone.children.length > 0) {
        returnToBank(zone.children[0] as HTMLElement);
        return;
      }
      if (selectedZoneElement === zone) {
        zone.classList.remove('bg-gray-200');
        zone.classList.add('bg-white');
        selectedZoneElement = null;
      } else {
        if (selectedZoneElement) {
          selectedZoneElement.classList.remove('bg-gray-200');
          selectedZoneElement.classList.add('bg-white');
        }
        zone.classList.remove('bg-white');
        zone.classList.add('bg-gray-200');
        selectedZoneElement = zone;
      }
    }

    function placeWordInZone(wordEl: HTMLElement, zoneEl: HTMLElement) {
      const idx = zoneEl.getAttribute('data-index')!;
      trackingData.qTimeS2[idx] = (trackingData.qTimeS2[idx] || 0) + (Date.now() - trackingData.lastActionTime);
      trackingData.lastActionTime = Date.now();

      if (zoneEl.children.length > 0) returnToBank(zoneEl.children[0] as HTMLElement);
      zoneEl.appendChild(wordEl);

      const isStart = zoneEl.getAttribute('data-capitalize') === 'true';
      const originalText = wordEl.dataset.originalWord!;
      wordEl.textContent = isStart ? originalText.charAt(0).toUpperCase() + originalText.slice(1) : originalText;

      wordEl.classList.remove('shadow', 'border-2', 'px-2', 'py-1.5', 'md:px-4', 'md:py-2', 'rounded-lg', 'border-purple-300', 'ring-4', 'ring-purple-500');
      wordEl.classList.add('w-full', 'h-full', 'bg-transparent');

      zoneEl.classList.remove('bg-gray-200');
      zoneEl.classList.add('bg-white');
      selectedZoneElement = null;
      selectedWordElement = null;
    }

    function returnToBank(el: HTMLElement) {
      el.textContent = el.dataset.originalWord!;
      el.classList.add('shadow', 'border-2', 'px-2', 'py-1.5', 'md:px-4', 'md:py-2', 'rounded-lg', 'border-purple-300');
      el.classList.remove('w-full', 'h-full', 'bg-transparent', 'ring-4', 'ring-purple-500');
      s2WordBank.appendChild(el);
    }

    document.getElementById('s2-submit')!.addEventListener('click', () => {
      if (confirm('未填寫題目將視為錯誤，請確認是否皆有作答～')) {
        logEvent('complete_stage2');
        trackingData.stage2Duration = Math.floor((Date.now() - (stage2StartTime as number)) / 1000);
        stage3StartTime = Date.now();
        elStage2.classList.add('hidden');
        document.getElementById('stage3')!.classList.remove('hidden');
        currentStage = 3;
        renderStage3();
        scrollAppToTop();
      }
    });

    // --- Stage 3 ---
    const s3Container = document.getElementById('s3-questions-container')!;
    const s3FocusTimes: Record<string, number | null> = {};

    function revealS3PhraseHint(index: number) {
      const item = wordsData[index];
      if (!item?.phrase) return;
      const slot = document.querySelector(`.s3-phrase-slot[data-phrase-index="${index}"]`) as HTMLElement | null;
      if (!slot || slot.dataset.filled === '1') return;
      stage3PhraseRevealed[index] = true;
      slot.dataset.filled = '1';
      slot.className = 's3-phrase-hint s3-phrase-slot text-sm md:text-base text-purple-700 mt-2 mb-3';
      slot.innerHTML = `💡 片語提示：<span class="font-semibold">${escapeHtml(item.phrase)}</span>`;
    }

    function tryRevealS3PhraseOnWrong(index: number, answer: string) {
      const item = wordsData[index];
      if (!item?.phrase || !hasStage3Item(item)) return;
      if (stage3PhraseRevealed[index]) return;
      if (!String(answer || '').trim()) return;
      if (checkSentenceAnswer(answer, item.ex3En)) return;
      revealS3PhraseHint(index);
    }

    function renderStage3() {
      s3Container.innerHTML = '';
      wordsData.forEach((item, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-pink-50 p-4 md:p-6 rounded-xl';
        if (!hasStage3Item(item)) {
          questionDiv.innerHTML = `
            <div class="flex items-start mb-2">
              <span class="text-pink-600 font-bold text-base md:text-xl mr-3">${index + 1}.</span>
              <p class="text-base md:text-lg text-gray-500">${escapeHtml(item.word)} — 此單字暫無第三階段題目，請跳過。</p>
            </div>`;
          s3Container.appendChild(questionDiv);
          return;
        }
        const displayZh = escapeHtml(item.ex3Zh);
        const phraseSlot = item.phrase ? `<div class="s3-phrase-slot" data-phrase-index="${index}" data-filled="0"></div>` : '';
        questionDiv.innerHTML = `
          <div class="flex items-start mb-4">
            <span class="text-pink-600 font-bold text-base md:text-xl mr-3 shrink-0">${index + 1}.</span>
            <div>
              <p class="text-base md:text-xl leading-relaxed">${displayZh}</p>
              ${item.ex3Pattern ? `<p class="text-sm md:text-base text-teal-700 mt-2">📐 句型提示：<span class="font-semibold">${escapeHtml(item.ex3Pattern)}</span></p>` : ''}
              ${item.ex3Tense ? `<p class="text-sm md:text-base text-amber-700 mt-1">⏱️ 時態提示：<span class="font-semibold">${escapeHtml(item.ex3Tense)}</span></p>` : ''}
              ${phraseSlot}
            </div>
          </div>
          <textarea data-index="${index}" class="s3-input w-full text-base md:text-xl p-2 md:p-3 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500 min-h-[80px]" placeholder="請輸入英文句子..." autocomplete="off">${escapeHtml(stage3Answers[index] || '')}</textarea>`;
        s3Container.appendChild(questionDiv);
        if (stage3PhraseRevealed[index]) revealS3PhraseHint(index);
      });

      document.querySelectorAll('.s3-input').forEach((input) => {
        input.addEventListener('input', (e: any) => {
          stage3Answers[e.target.getAttribute('data-index')] = e.target.value;
        });
        input.addEventListener('focus', (e: any) => {
          s3FocusTimes[e.target.getAttribute('data-index')] = Date.now();
        });
        input.addEventListener('blur', (e: any) => {
          const idx = e.target.getAttribute('data-index');
          if (s3FocusTimes[idx]) {
            trackingData.qTimeS3[idx] = (trackingData.qTimeS3[idx] || 0) + (Date.now() - (s3FocusTimes[idx] as number));
            s3FocusTimes[idx] = null;
          }
          tryRevealS3PhraseOnWrong(Number(idx), e.target.value);
        });
      });
    }

    document.getElementById('s3-submit')!.addEventListener('click', () => {
      if (document.activeElement && (document.activeElement as HTMLElement).classList.contains('s3-input')) {
        (document.activeElement as HTMLElement).blur();
      }
      if (confirm('確定要完成測驗並查看成績嗎？')) calculateScore();
    });

    function calculateScore() {
      let s1Score = 0;
      let s2Score = 0;
      let s3Score = 0;
      const total = wordsData.length;
      const s3Total = countStage3Items(wordsData);

      for (let i = 0; i < total; i++) {
        if (checkAnswer(stage1Answers[i], wordsData[i].word)) s1Score++;
        const zone = document.querySelector(`.click-zone[data-index="${i}"]`);
        let s2Answer = '';
        let s2BaseAnswer = '';
        if (zone && zone.children.length > 0) {
          s2Answer = (zone.children[0] as HTMLElement).dataset.originalWord || '';
          s2BaseAnswer = (zone.children[0] as HTMLElement).dataset.baseWord || '';
        }
        stage2Answers[i] = { display: s2Answer, base: s2BaseAnswer };
        if (checkAnswer(s2BaseAnswer, wordsData[i].word)) s2Score++;
        if (hasStage3Item(wordsData[i]) && checkSentenceAnswer(stage3Answers[i], wordsData[i].ex3En)) s3Score++;
      }

      const s1Percent = Math.round((s1Score / total) * 100);
      const s2Percent = Math.round((s2Score / total) * 100);
      const s3Percent = s3Total ? Math.round((s3Score / s3Total) * 100) : 0;
      const maxPoints = total * 2 + s3Total;
      const totalPercent = maxPoints ? Math.round(((s1Score + s2Score + s3Score) / maxPoints) * 100) : 0;

      const endTime = new Date();
      const timeDiff = Math.floor((endTime.getTime() - (startTime as Date).getTime()) / 1000);
      const minutes = Math.floor(timeDiff / 60);
      const seconds = timeDiff % 60;
      const timeString = `${minutes} 分 ${seconds} 秒`;

      trackingData.stage3Duration = Math.floor((Date.now() - (stage3StartTime as number)) / 1000);
      currentStage = 4;
      logEvent('complete_stage3');

      document.getElementById('display-name')!.textContent = userName;
      document.getElementById('display-time')!.textContent = timeString;
      document.getElementById('score1')!.textContent = `${s1Score} / ${total} (${s1Percent}%)`;
      document.getElementById('score2')!.textContent = `${s2Score} / ${total} (${s2Percent}%)`;
      document.getElementById('score3')!.textContent = `${s3Score} / ${s3Total} (${s3Percent}%)`;
      document.getElementById('score-total')!.textContent = `${s1Score + s2Score + s3Score} / ${maxPoints} (${totalPercent}%)`;

      const reviewData = wordsData.map((item, i) => {
        const s2AnsObj = stage2Answers[i] || { display: '', base: '' };
        const s1Ans = stage1Answers[i] || '';
        const s2Ans = s2AnsObj.base || '';
        const s3Ans = stage3Answers[i] || '';
        const s1Correct = checkAnswer(s1Ans, item.word);
        const s2Correct = checkAnswer(s2Ans, item.word);
        const s3Eligible = hasStage3Item(item);
        const s3Correct = s3Eligible ? checkSentenceAnswer(s3Ans, item.ex3En) : null;
        const s1ErrorType = s1Correct ? 'Correct' : s1Ans === '' ? 'Blank' : 'Typo';
        const s2ErrorType = s2Correct ? 'Correct' : s2Ans === '' ? 'Blank' : 'Wrong_Choice';
        const s3ErrorType = !s3Eligible ? 'Skipped' : s3Correct ? 'Correct' : s3Ans === '' ? 'Blank' : 'Sentence_Error';
        const s3GrammarTags = s3Eligible && !s3Correct ? analyzeS3GrammarErrors(s3Ans, item.ex3En, item) : [];
        return {
          definition: item.definition,
          example: item.example,
          ex3En: item.ex3En,
          ex3Zh: item.ex3Zh,
          phrase: item.phrase,
          ex3Pattern: item.ex3Pattern,
          ex3Tense: item.ex3Tense,
          s3Eligible,
          word: item.word,
          s1UserAns: s1Ans,
          s2UserAns: s2AnsObj.display || '',
          s3UserAns: s3Ans,
          s1Correct,
          s2Correct,
          s3Correct,
          s1ErrorType,
          s2ErrorType,
          s3ErrorType,
          s3GrammarTags,
          s1TimeMs: trackingData.qTimeS1[i] || 0,
          s2TimeMs: trackingData.qTimeS2[i] || 0,
          s3TimeMs: trackingData.qTimeS3[i] || 0
        };
      });

      readingProgress.saveReadingGameResult({
        gameType: 'Quiz',
        unit: filePath,
        file: filePath,
        duration: Math.round((trackingData.stage1Duration + trackingData.stage2Duration + trackingData.stage3Duration) / 1000),
        timeString,
        score: s1Score + s2Score + s3Score,
        total,
        maxPoints,
        s3Total,
        totalPercent,
        stage1Duration: trackingData.stage1Duration,
        stage2Duration: trackingData.stage2Duration,
        stage3Duration: trackingData.stage3Duration,
        s1Score,
        s2Score,
        s3Score,
        reviewData
      });

      document.getElementById('stage3')?.classList.add('hidden');
      elResult.classList.remove('hidden');
      const fab = document.getElementById('btn-fab-query-score')!;
      fab.classList.remove('hidden');
      fab.classList.add('flex');
      scrollAppToTop();
      showExamInsightModal(reviewData);
    }

    function renderScoreHistory() {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const filterSelect = document.getElementById('history-user-filter') as HTMLSelectElement;
      const selectedUser = filterSelect.value;
      let historyList: any[] = [];

      if (selectedUser === 'all') {
        for (const [user, data] of Object.entries(allData) as any) {
          if (data.history) data.history.forEach((record: any, index: number) => historyList.push({ userName: user, originalIndex: index, ...record }));
        }
        historyList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (allData[selectedUser] && allData[selectedUser].history) {
        historyList = allData[selectedUser].history.map((record: any, index: number) => ({ userName: selectedUser, originalIndex: index, ...record }));
      }

      const historyContent = document.getElementById('history-content')!;
      const historyEmpty = document.getElementById('history-empty')!;

      if (historyList.length === 0) {
        historyContent.innerHTML = '';
        historyEmpty.classList.remove('hidden');
      } else {
        historyEmpty.classList.add('hidden');
        let html = '';
        historyList.forEach((record) => {
          const fileName = record.file.split('/').pop();
          html += `
            <div class="p-3 md:p-4 border border-indigo-100 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <div class="flex justify-between items-center mb-2 border-b border-indigo-200 pb-2">
                <span class="font-bold text-indigo-800 text-sm md:text-base">${record.userName}</span>
                <span class="text-[10px] md:text-xs text-gray-500">${record.date}</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-700">
                <div><span class="font-medium text-gray-500">題庫：</span>${fileName}</div>
                <div><span class="font-medium text-gray-500">耗時：</span>${record.timeString} <span class="text-xs text-gray-400 ml-1">(S1: ${record.stage1Duration || 0}s | S2: ${record.stage2Duration || 0}s | S3: ${record.stage3Duration || 0}s)</span></div>
                <div class="col-span-1 md:col-span-2 mt-2">
                  <div class="flex justify-between items-center bg-white p-2 md:p-2 rounded-lg border border-indigo-100">
                    <span class="font-bold text-gray-600 text-base md:text-lg">總分</span>
                    <span class="text-lg md:text-xl font-bold ${record.totalPercent >= 80 ? 'text-green-600' : record.totalPercent >= 60 ? 'text-yellow-600' : 'text-red-500'}">
                      ${record.s1Score + record.s2Score + (record.s3Score || 0)} / ${record.maxPoints || record.total * (record.s3Score !== undefined ? 3 : 2)} (${record.totalPercent}%)
                    </span>
                  </div>
                </div>
              </div>
              ${record.reviewData ? `
              <div class="mt-3 text-right">
                <button onclick="showHistoryReview('${record.userName}', ${record.originalIndex})" class="px-3 md:px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm md:text-base font-bold transition shadow-sm">查看此測驗錯題</button>
              </div>` : ''}
            </div>`;
        });
        historyContent.innerHTML = html;
      }
    }

    (window as any).showHistoryReview = function (targetUser: string, idx: number) {
      logEvent('click_review_history');
      logUserEngagement('reviewHistoryClicks');
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!allData[targetUser] || !allData[targetUser].history) return;
      const record = allData[targetUser].history[idx];
      if (!record || !record.reviewData) return;
      reviewSource = 'history';
      document.getElementById('score-history')!.classList.add('hidden');
      document.getElementById('review')!.classList.remove('hidden');
      document.getElementById('review-content')!.innerHTML = generateReviewHTML(record.reviewData);
      switchReviewTab(1);
      scrollAppToTop();
    };

    function generateReviewHTML(reviewData: any[]): string {
      let s1Html = '<div id="review-s1-content">';
      reviewData.forEach((item, i) => {
        const userAns = item.s1UserAns ? item.s1UserAns : '(未作答)';
        const colorClass = item.s1Correct ? 'text-green-600 font-bold' : 'text-red-500 font-bold line-through';
        const s1TimeStr = item.s1TimeMs ? (item.s1TimeMs / 1000).toFixed(1) + 's' : '--';
        s1Html += `
          <div class="mb-4 p-3 md:p-5 ${item.s1Correct ? 'bg-green-50' : 'bg-red-50'} rounded-xl border-2 ${item.s1Correct ? 'border-green-200' : 'border-red-200'} relative">
            <span class="absolute top-3 right-3 text-xs md:text-sm bg-white px-2 py-1 rounded shadow-sm text-gray-500 border border-gray-200">⏱️ ${s1TimeStr}</span>
            <p class="text-base md:text-xl mb-2 pr-12"><span class="font-bold text-gray-700">Q${i + 1}:</span> ${item.definition}</p>
            <p class="text-base md:text-xl">你的答案：<span class="${colorClass}">${userAns}</span></p>
            ${!item.s1Correct ? `<p class="text-base md:text-xl mt-1">正確答案：<span class="text-green-600 font-bold">${item.word}</span></p>` : ''}
          </div>`;
      });
      s1Html += '</div>';

      let s2Html = '<div id="review-s2-content" class="hidden">';
      reviewData.forEach((item, i) => {
        const userAns = item.s2UserAns ? item.s2UserAns : '(未作答)';
        const colorClass = item.s2Correct ? 'text-green-600 font-bold' : 'text-red-500 font-bold line-through';
        const s2TimeStr = item.s2TimeMs ? (item.s2TimeMs / 1000).toFixed(1) + 's' : '--';
        s2Html += `
          <div class="mb-4 p-3 md:p-5 ${item.s2Correct ? 'bg-green-50' : 'bg-red-50'} rounded-xl border-2 ${item.s2Correct ? 'border-green-200' : 'border-red-200'} relative">
            <span class="absolute top-3 right-3 text-xs md:text-sm bg-white px-2 py-1 rounded shadow-sm text-gray-500 border border-gray-200">⏱️ ${s2TimeStr}</span>
            <p class="text-base md:text-xl mb-2 pr-12"><span class="font-bold text-gray-700">Q${i + 1}:</span> ${item.example}</p>
            <p class="text-base md:text-xl">你的答案：<span class="${colorClass}">${userAns}</span></p>
            ${!item.s2Correct ? `<p class="text-base md:text-xl mt-1">正確答案：<span class="text-green-600 font-bold">${item.word}</span></p>` : ''}
          </div>`;
      });
      s2Html += '</div>';

      let s3Html = '<div id="review-s3-content" class="hidden">';
      reviewData.forEach((item, i) => {
        if (item.s3UserAns === undefined) return;
        if (item.s3Eligible === false || (!item.ex3En && !item.ex3Zh)) return;
        const userAns = item.s3UserAns ? item.s3UserAns : '(未作答)';
        const colorClass = item.s3Correct ? 'text-green-600 font-bold' : 'text-red-500 font-bold line-through';
        const s3TimeStr = item.s3TimeMs ? (item.s3TimeMs / 1000).toFixed(1) + 's' : '--';
        const displayZh = item.ex3Zh ? item.ex3Zh : '(此單字無中文翻譯)';
        s3Html += `
          <div class="mb-4 p-3 md:p-5 ${item.s3Correct ? 'bg-green-50' : 'bg-red-50'} rounded-xl border-2 ${item.s3Correct ? 'border-green-200' : 'border-red-200'} relative">
            <span class="absolute top-3 right-3 text-xs md:text-sm bg-white px-2 py-1 rounded shadow-sm text-gray-500 border border-gray-200">⏱️ ${s3TimeStr}</span>
            <p class="text-base md:text-xl mb-2 pr-12"><span class="font-bold text-gray-700">Q${i + 1}:</span> ${displayZh}</p>
            <p class="text-base md:text-xl">你的答案：<span class="${colorClass}">${userAns}</span></p>
            ${!item.s3Correct ? `<p class="text-base md:text-xl mt-1">正確答案：<span class="text-green-600 font-bold">${item.ex3En}</span></p>` : ''}
          </div>`;
      });
      s3Html += '</div>';

      return s1Html + s2Html + s3Html;
    }

    function switchReviewTab(stage: number) {
      const tab1 = document.getElementById('tab-stage1')!;
      const tab2 = document.getElementById('tab-stage2')!;
      const tab3 = document.getElementById('tab-stage3');
      const content1 = document.getElementById('review-s1-content');
      const content2 = document.getElementById('review-s2-content');
      const content3 = document.getElementById('review-s3-content');

      tab1.className = 'px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-transparent text-gray-500 hover:text-blue-500 -mb-[2px] transition-colors cursor-pointer';
      tab2.className = 'px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-transparent text-gray-500 hover:text-purple-500 -mb-[2px] transition-colors cursor-pointer';
      if (tab3) tab3.className = 'px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-transparent text-gray-500 hover:text-pink-500 -mb-[2px] transition-colors cursor-pointer';

      content1?.classList.add('hidden');
      content2?.classList.add('hidden');
      content3?.classList.add('hidden');

      if (stage === 1) {
        tab1.className = 'px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-blue-500 text-blue-600 -mb-[2px] transition-colors';
        content1?.classList.remove('hidden');
      } else if (stage === 2) {
        tab2.className = 'px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-purple-500 text-purple-600 -mb-[2px] transition-colors';
        content2?.classList.remove('hidden');
      } else if (stage === 3) {
        if (tab3) tab3.className = 'px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-pink-500 text-pink-600 -mb-[2px] transition-colors';
        content3?.classList.remove('hidden');
      }
      scrollAppToTop();
    }

    document.getElementById('tab-stage1')!.addEventListener('click', () => switchReviewTab(1));
    document.getElementById('tab-stage2')!.addEventListener('click', () => switchReviewTab(2));
    document.getElementById('tab-stage3')?.addEventListener('click', () => switchReviewTab(3));

    function updateHistoryFilterOptions() {
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const filterSelect = document.getElementById('history-user-filter') as HTMLSelectElement;
      const currentValue = filterSelect.value;
      filterSelect.innerHTML = '<option value="all">所有使用者</option>';
      const uniqueUsers = Object.keys(allData);
      uniqueUsers.forEach((u) => {
        const option = document.createElement('option');
        option.value = u;
        option.textContent = u;
        filterSelect.appendChild(option);
      });
      if (currentValue && (currentValue === 'all' || uniqueUsers.includes(currentValue))) filterSelect.value = currentValue;
    }

    document.getElementById('btn-fab-query-score')!.addEventListener('click', () => {
      logEvent('click_history_score');
      logUserEngagement('historyClicks');
      document.getElementById('start-screen')!.classList.add('hidden');
      document.getElementById('result')!.classList.add('hidden');
      document.getElementById('review')!.classList.add('hidden');
      document.getElementById('stage1')!.classList.add('hidden');
      document.getElementById('stage2')!.classList.add('hidden');
      document.getElementById('score-history')!.classList.remove('hidden');
      updateHistoryFilterOptions();
      renderScoreHistory();
      scrollAppToTop();
    });

    document.getElementById('btn-back-to-result')!.addEventListener('click', () => {
      logEvent('click_back_to_result');
      document.getElementById('review')!.classList.add('hidden');
      if (reviewSource === 'history') document.getElementById('score-history')!.classList.remove('hidden');
      else document.getElementById('result')!.classList.remove('hidden');
      scrollAppToTop();
    });

    document.getElementById('btn-review')!.addEventListener('click', () => {
      logEvent('click_review_current');
      logUserEngagement('reviewCurrentClicks');
      reviewSource = 'result';
      elResult.classList.add('hidden');
      document.getElementById('review')!.classList.remove('hidden');
      const currentReviewData = wordsData.map((item, i) => {
        const s2AnsObj = stage2Answers[i] || { display: '', base: '' };
        const s3Ans = stage3Answers[i] || '';
        return {
          definition: item.definition,
          example: item.example,
          ex3En: item.ex3En,
          ex3Zh: item.ex3Zh,
          word: item.word,
          s1UserAns: stage1Answers[i] || '',
          s2UserAns: s2AnsObj.display || '',
          s3UserAns: s3Ans,
          s1Correct: checkAnswer(stage1Answers[i], item.word),
          s2Correct: checkAnswer(s2AnsObj.base, item.word),
          s3Eligible: hasStage3Item(item),
          s3Correct: hasStage3Item(item) ? checkSentenceAnswer(s3Ans, item.ex3En) : null,
          s1TimeMs: trackingData.qTimeS1[i] || 0,
          s2TimeMs: trackingData.qTimeS2[i] || 0,
          s3TimeMs: trackingData.qTimeS3[i] || 0
        };
      });
      document.getElementById('review-content')!.innerHTML = generateReviewHTML(currentReviewData);
      switchReviewTab(1);
      scrollAppToTop();
    });

    document.getElementById('btn-start')!.addEventListener('click', () => {
      if (!userName) {
        alert('無法取得使用者名稱，請重新從閱讀大廳進入！');
        window.location.href = `${base}/reading-hub`;
        return;
      }
      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!allData[userName]) {
        allData[userName] = { profile: { streak: 0, totalTests: 0, lastTestDate: '' }, history: [], abandons: [], progress: {} };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      }
      startTime = new Date();
      stage1StartTime = Date.now();
      currentStage = 1;
      logEvent('click_start');
      elStartScreen.classList.add('hidden');
      elStage1.classList.remove('hidden');
      const fab = document.getElementById('btn-fab-query-score')!;
      fab.classList.add('hidden');
      fab.classList.remove('flex');
      scrollAppToTop();
    });

    document.getElementById('btn-history-back')!.addEventListener('click', () => {
      document.getElementById('score-history')!.classList.add('hidden');
      if (document.getElementById('score-total')!.textContent !== '') document.getElementById('result')!.classList.remove('hidden');
      else location.reload();
      scrollAppToTop();
    });

    document.getElementById('history-user-filter')!.addEventListener('change', () => renderScoreHistory());

    // --- Teacher dashboard ---
    let titleClickCount = 0;
    document.querySelector('.vq-root h1')!.addEventListener('click', () => {
      titleClickCount++;
      if (titleClickCount === 5) {
        titleClickCount = 0;
        const pwd = prompt('請輸入教師密碼 (預設: admin)：');
        if (pwd === 'admin') showTeacherDashboard();
        else if (pwd !== null) alert('密碼錯誤！');
      }
    });

    function showTeacherDashboard() {
      ['start-screen', 'stage1', 'stage2', 'stage3', 'result', 'review', 'score-history', 'btn-fab-query-score'].forEach((id) => {
        document.getElementById(id)?.classList.add('hidden');
      });
      const dashboard = document.getElementById('teacher-dashboard')!;
      dashboard.classList.remove('hidden');

      const allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      let totalStarts = 0;
      let completedS1 = 0;
      let completedAll = 0;
      let totalAbandons = 0;
      let totalHistoryClicks = 0;
      let totalReviewClicks = 0;
      let totalS1Time = 0;
      let totalS2Time = 0;
      let totalS3Time = 0;
      let validTimeRecords = 0;
      const errorCounts: any = { Blank: 0, Typo: 0, Wrong_Choice: 0, Sentence_Error: 0 };
      const wordErrors: any = {};
      let userHtml = '';

      for (const [user, data] of Object.entries(allData) as any) {
        const history = data.history || [];
        const abandons = data.abandons || [];
        const profile = data.profile || { streak: 0, totalTests: 0, lastTestDate: '無' };

        totalStarts += history.length + abandons.length;
        completedS1 += history.length + abandons.filter((a: any) => a.stage > 1).length;
        completedAll += history.length;
        totalAbandons += abandons.length;

        const engagement = profile.engagement || {};
        totalHistoryClicks += engagement.historyClicks || 0;
        totalReviewClicks += (engagement.reviewCurrentClicks || 0) + (engagement.reviewHistoryClicks || 0);

        history.forEach((record: any) => {
          if (record.stage1Duration !== undefined && record.stage2Duration !== undefined) {
            totalS1Time += record.stage1Duration;
            totalS2Time += record.stage2Duration;
            totalS3Time += record.stage3Duration || 0;
            validTimeRecords++;
          }
          if (record.reviewData) {
            record.reviewData.forEach((q: any) => {
              if (!q.s1Correct) {
                const errType = q.s1ErrorType || (!q.s1UserAns || q.s1UserAns === '(未作答)' ? 'Blank' : 'Typo');
                errorCounts[errType] = (errorCounts[errType] || 0) + 1;
                if (errType === 'Typo') wordErrors[q.word] = (wordErrors[q.word] || 0) + 1;
              }
              if (!q.s2Correct) {
                const errType = q.s2ErrorType || (!q.s2UserAns || q.s2UserAns === '(未作答)' ? 'Blank' : 'Wrong_Choice');
                errorCounts[errType] = (errorCounts[errType] || 0) + 1;
              }
              if (q.s3Correct !== undefined && !q.s3Correct && q.s3ErrorType !== 'Skipped') {
                const errType = q.s3ErrorType || (!q.s3UserAns || q.s3UserAns === '(未作答)' ? 'Blank' : 'Sentence_Error');
                errorCounts[errType] = (errorCounts[errType] || 0) + 1;
              }
            });
          }
        });

        userHtml += `
          <div class="flex justify-between items-center border-b py-3">
            <span class="font-bold text-gray-700 text-lg">${user}</span>
            <div class="text-sm md:text-base text-gray-600 flex flex-wrap gap-2 md:gap-4 items-center">
              <span>連續: <span class="font-bold text-orange-500">${profile.streak} 🔥</span></span>
              <span>總測驗: <span class="font-bold text-blue-500">${profile.totalTests}</span></span>
              <span class="hidden md:inline">上次: ${profile.lastTestDate || '無'}</span>
              <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold" title="查看錯題次數">檢討 ${(profile.engagement?.reviewCurrentClicks || 0) + (profile.engagement?.reviewHistoryClicks || 0)} 次</span>
              <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold" title="查看歷史成績次數">查榜 ${profile.engagement?.historyClicks || 0} 次</span>
            </div>
          </div>`;
      }

      document.getElementById('td-starts')!.textContent = String(totalStarts);
      document.getElementById('td-s1-comp')!.textContent = String(completedS1);
      document.getElementById('td-all-comp')!.textContent = String(completedAll);
      document.getElementById('td-abandon')!.textContent = String(totalAbandons);
      document.getElementById('td-total-history')!.textContent = String(totalHistoryClicks);
      document.getElementById('td-total-review')!.textContent = String(totalReviewClicks);

      document.getElementById('td-err-blank')!.textContent = String(errorCounts.Blank || 0);
      document.getElementById('td-err-typo')!.textContent = String(errorCounts.Typo || 0);
      document.getElementById('td-err-wrong')!.textContent = String(errorCounts.Wrong_Choice || 0);
      document.getElementById('td-err-sentence')!.textContent = String(errorCounts.Sentence_Error || 0);

      const sortedWords = Object.entries(wordErrors).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
      document.getElementById('td-top-errors')!.innerHTML =
        sortedWords.length > 0
          ? sortedWords.map((w: any) => `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold">${w[0]} (${w[1]}次)</span>`).join(' ')
          : '<span class="text-gray-500">尚無數據</span>';

      const avgS1 = validTimeRecords ? Math.round(totalS1Time / validTimeRecords) : 0;
      const avgS2 = validTimeRecords ? Math.round(totalS2Time / validTimeRecords) : 0;
      const avgS3 = validTimeRecords ? Math.round(totalS3Time / validTimeRecords) : 0;
      document.getElementById('td-avg-s1')!.textContent = avgS1 + 's';
      document.getElementById('td-avg-s2')!.textContent = avgS2 + 's';
      document.getElementById('td-avg-s3')!.textContent = avgS3 + 's';
      document.getElementById('td-avg-total')!.textContent = avgS1 + avgS2 + avgS3 + 's';

      document.getElementById('td-users')!.innerHTML = userHtml || '<div class="text-gray-500">尚無數據</div>';
      scrollAppToTop();
    }

    // --- Bootstrap ---
    readingProgress.init();
    const currentUser = readingProgress.getCurrentUser();
    if (!currentUser && urlParams.get('mode') !== 'teacher') {
      alert('請先在閱讀大廳登入您的名字！');
      window.location.href = `${base}/reading-hub`;
      return () => {};
    }
    userName = currentUser || '';

    logEvent('enter_home');
    void loadData();

    const fab = document.getElementById('btn-fab-query-score')!;
    fab.classList.remove('hidden');
    fab.classList.add('flex');

    if (urlParams.get('mode') === 'teacher') {
      setTimeout(() => showTeacherDashboard(), 100);
    }

    return () => {
      cleanups.forEach((fn) => fn());
      delete (window as any).showHistoryReview;
    };
  });
</script>

<svelte:head>
  <title>單字測驗 Word Exam</title>
</svelte:head>

<div class="vq-root bg-white text-gray-800">
  <div id="scroll-container" class="flex flex-col justify-start min-h-screen">
    <div id="app" class="w-full max-w-[95%] mx-auto px-4 py-6 md:px-10 md:py-12 min-h-full bg-white relative shrink-0">
      <a href="{base}/reading-hub" class="absolute top-4 right-4 md:top-6 md:right-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-bold shadow-sm flex items-center gap-2 z-10">
        🏠 回閱讀大廳
      </a>

      <h1 class="text-3xl md:text-5xl font-bold text-center mb-8 text-blue-600 mt-8 md:mt-0 cursor-pointer select-none">單字測驗 Word Exam</h1>

      <div id="loading" class="text-center text-2xl text-gray-500">載入中，請稍候...</div>
      <div id="error" class="hidden text-center text-red-500 text-2xl"></div>

      <div id="start-screen" class="hidden text-center flex-1 flex-col justify-center">
        <h2 class="text-4xl font-semibold mb-10">歡迎來到單字測驗</h2>
        <div class="max-w-4xl mx-auto bg-blue-50 p-12 rounded-2xl shadow-sm w-full">
          <button id="btn-start" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-2xl transition shadow-md">開始測驗</button>
        </div>
      </div>

      <button id="btn-fab-query-score" class="fixed bottom-8 right-8 w-24 h-24 md:w-28 md:h-28 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg flex-col items-center justify-center transition-transform hover:scale-110 z-50 group flex">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 md:h-10 md:w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-sm md:text-lg font-bold tracking-wider text-center leading-tight">History<br />Score</span>
      </button>

      <div id="stage1" class="hidden">
        <h2 class="text-xl md:text-2xl font-semibold mb-6 border-b pb-3">第一階段：定義填空</h2>
        <p class="text-gray-600 mb-6 text-base md:text-lg">請根據英文定義，填入正確的單字。</p>
        <div class="mb-6 flex justify-between items-center">
          <span class="text-base md:text-lg font-medium">共 <span id="s1-total">10</span> 題</span>
        </div>
        <div id="s1-questions-container" class="space-y-8 mb-8"></div>
        <div class="mt-10 text-center">
          <button id="s1-submit" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg md:text-xl font-bold shadow-md transition">完成第一階段</button>
        </div>
      </div>

      <div id="stage2" class="hidden">
        <h2 class="text-lg md:text-xl font-semibold mb-4 border-b pb-2">第二階段：例句填空</h2>
        <p class="text-gray-600 mb-4 text-sm md:text-base">請先點擊下方的空格，再從上方單字庫選擇單字填入。若要取消，可直接點擊空格內的單字。</p>
        <div class="mb-4 flex justify-between items-center">
          <span class="text-sm md:text-base font-medium">共 <span id="s2-total">10</span> 題</span>
        </div>
        <div id="s2-word-bank" class="sticky top-4 z-50 flex flex-wrap gap-1.5 md:gap-2 p-2 md:p-4 bg-purple-100/95 backdrop-blur-sm rounded-xl mb-6 border-2 border-dashed border-purple-400 min-h-[50px] md:min-h-[60px] shadow-lg transition-colors"></div>
        <div id="s2-questions-container" class="space-y-6 mb-6"></div>
        <div class="mt-8 text-center">
          <button id="s2-submit" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg md:text-xl font-bold shadow-md transition">完成第二階段</button>
        </div>
      </div>

      <div id="stage3" class="hidden">
        <h2 class="text-xl md:text-2xl font-semibold mb-6 border-b pb-3">第三階段：中翻英 (句子)</h2>
        <p class="text-gray-600 mb-6 text-base md:text-lg">請根據中文翻譯，拼寫出完整的英文句子（YLE Flyers：6～10 詞短句；不計較標點與大小寫；<strong>we'll</strong> 與 <strong>we will</strong> 皆可）。每題會顯示句型與時態提示；片語提示須答錯一次後才會出現。</p>
        <div class="mb-6 flex justify-between items-center">
          <span class="text-base md:text-lg font-medium">共 <span id="s3-total">10</span> 題</span>
        </div>
        <div id="s3-questions-container" class="space-y-8 mb-8"></div>
        <div class="mt-10 text-center">
          <button id="s3-submit" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg md:text-xl font-bold shadow-md transition">完成第三階段並看成績</button>
        </div>
      </div>

      <div id="result" class="hidden text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-8 text-green-600">測驗完成！</h2>
        <div class="bg-gray-50 p-5 md:p-6 rounded-2xl mb-8 text-left inline-block w-full">
          <p class="text-base md:text-xl mb-4 text-gray-600 border-b pb-3">受測者：<span id="display-name" class="font-bold text-gray-800"></span></p>
          <p class="text-base md:text-xl mb-6 text-gray-600 border-b pb-3">測驗耗時：<span id="display-time" class="font-bold text-gray-800"></span></p>
          <p class="text-base md:text-xl mb-4 flex justify-between"><span>第一階段得分：</span> <span id="score1" class="font-bold text-blue-600"></span></p>
          <p class="text-base md:text-xl mb-4 flex justify-between"><span>第二階段得分：</span> <span id="score2" class="font-bold text-purple-600"></span></p>
          <p class="text-base md:text-xl mb-4 flex justify-between"><span>第三階段得分：</span> <span id="score3" class="font-bold text-pink-600"></span></p>
          <hr class="my-6 border-gray-300" />
          <p class="text-xl md:text-2xl mb-4 flex justify-between font-bold"><span>總分：</span> <span id="score-total" class="text-red-500"></span></p>
        </div>
        <div class="mt-8 flex flex-col md:flex-row justify-center gap-4 md:gap-6">
          <button id="btn-review" class="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-lg md:text-xl font-bold shadow-md transition">查看錯題</button>
          <button onclick={() => location.reload()} class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg md:text-xl font-bold shadow-md transition">重新測驗</button>
        </div>
      </div>

      <div id="exam-insight-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl text-left">
          <h3 class="text-xl md:text-2xl font-bold text-indigo-700 mb-2 text-center">📋 本次測驗錯誤分析</h3>
          <p class="text-sm text-gray-500 mb-5 text-center">依你的作答整理常錯項目，方便課後複習</p>
          <div id="exam-insight-content" class="space-y-5 text-base md:text-lg text-gray-800"></div>
          <div class="mt-6 text-center">
            <button type="button" id="btn-close-exam-insight" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition">知道了</button>
          </div>
        </div>
      </div>

      <div id="review" class="hidden">
        <h2 class="text-xl md:text-2xl font-bold mb-6 text-center text-yellow-600">錯題回顧</h2>
        <div class="flex justify-center border-b-2 border-gray-200 mb-6 flex-wrap">
          <button id="tab-stage1" class="px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-blue-500 text-blue-600 -mb-[2px] transition-colors">第一階段：定義填空</button>
          <button id="tab-stage2" class="px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-transparent text-gray-500 hover:text-purple-500 -mb-[2px] transition-colors">第二階段：例句填空</button>
          <button id="tab-stage3" class="px-4 md:px-8 py-3 font-bold text-base md:text-lg border-b-4 border-transparent text-gray-500 hover:text-pink-500 -mb-[2px] transition-colors">第三階段：中翻英</button>
        </div>
        <div id="review-content" class="bg-white p-4 md:p-6 rounded-lg shadow-inner mb-8"></div>
        <div class="text-center flex justify-center">
          <button id="btn-back-to-result" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm text-lg md:text-xl">回上一頁</button>
        </div>
      </div>

      <div id="teacher-dashboard" class="hidden">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-red-600">👨‍🏫 教師專屬資料庫</h2>
          <button onclick={() => location.reload()} class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition">登出</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
            <h3 class="text-xl font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">📊 測驗漏斗與參與度</h3>
            <ul class="space-y-3 text-base md:text-lg text-gray-700">
              <li class="flex justify-between"><span>進入首頁並點擊開始：</span> <span id="td-starts" class="font-bold">0</span></li>
              <li class="flex justify-between"><span>完成第一階段：</span> <span id="td-s1-comp" class="font-bold">0</span></li>
              <li class="flex justify-between"><span>完成所有測驗：</span> <span id="td-all-comp" class="font-bold text-green-600">0</span></li>
              <li class="flex justify-between text-red-500 mt-2 pt-2 border-t border-blue-200"><span>中途跳出 (Abandonment)：</span> <span id="td-abandon" class="font-bold">0</span></li>
              <li class="flex justify-between text-indigo-600 mt-2 pt-2 border-t border-blue-200"><span>主動查榜總次數：</span> <span id="td-total-history" class="font-bold">0</span></li>
              <li class="flex justify-between text-purple-600"><span>主動檢討錯題總次數：</span> <span id="td-total-review" class="font-bold">0</span></li>
            </ul>
          </div>
          <div class="bg-red-50 p-6 rounded-2xl border-2 border-red-100">
            <h3 class="text-xl font-bold text-red-800 mb-4 border-b border-red-200 pb-2">🚨 錯誤類型與常錯單字</h3>
            <ul class="space-y-2 text-base md:text-lg text-gray-700 mb-4">
              <li class="flex justify-between"><span>未作答 (Blank)：</span> <span id="td-err-blank" class="font-bold text-gray-500">0</span></li>
              <li class="flex justify-between"><span>拼字錯誤 (Typo)：</span> <span id="td-err-typo" class="font-bold text-orange-500">0</span></li>
              <li class="flex justify-between"><span>語意選錯 (Wrong Choice)：</span> <span id="td-err-wrong" class="font-bold text-purple-500">0</span></li>
              <li class="flex justify-between"><span>句子拼寫錯誤 (Sentence Error)：</span> <span id="td-err-sentence" class="font-bold text-pink-500">0</span></li>
            </ul>
            <div>
              <span class="text-sm text-gray-600 block mb-2">最常拼錯的單字 (Typo Top 5)：</span>
              <div id="td-top-errors" class="flex flex-wrap gap-2 text-sm"></div>
            </div>
          </div>
          <div class="bg-green-50 p-6 rounded-2xl border-2 border-green-100 md:col-span-2">
            <h3 class="text-xl font-bold text-green-800 mb-4 border-b border-green-200 pb-2">⏱️ 測驗時間追蹤 (Time-on-Task)</h3>
            <div class="flex flex-col md:flex-row gap-4 justify-around text-center">
              <div class="bg-white p-4 rounded-xl shadow-sm flex-1">
                <div class="text-sm text-gray-500 mb-1">第一階段平均</div>
                <div class="text-2xl font-bold text-green-600" id="td-avg-s1">0s</div>
              </div>
              <div class="bg-white p-4 rounded-xl shadow-sm flex-1">
                <div class="text-sm text-gray-500 mb-1">第二階段平均</div>
                <div class="text-2xl font-bold text-green-600" id="td-avg-s2">0s</div>
              </div>
              <div class="bg-white p-4 rounded-xl shadow-sm flex-1">
                <div class="text-sm text-gray-500 mb-1">第三階段平均</div>
                <div class="text-2xl font-bold text-green-600" id="td-avg-s3">0s</div>
              </div>
              <div class="bg-white p-4 rounded-xl shadow-sm flex-1">
                <div class="text-sm text-gray-500 mb-1">總平均耗時</div>
                <div class="text-2xl font-bold text-green-600" id="td-avg-total">0s</div>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-4 text-center">💡 詳細的「每一題停留時間」請至歷史成績點擊「查看錯題」檢視。</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
          <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">🔥 使用者活躍度 (Retention)</h3>
          <div id="td-users" class="space-y-2 max-h-60 overflow-y-auto pr-2"></div>
        </div>
      </div>

      <div id="score-history" class="hidden">
        <h2 class="text-2xl md:text-3xl font-bold mb-8 text-center text-indigo-600">歷史成績查詢</h2>
        <div class="w-full mx-auto mb-6 flex justify-end">
          <select id="history-user-filter" class="px-3 py-1.5 border-2 border-indigo-200 rounded-lg text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">所有使用者</option>
          </select>
        </div>
        <div class="bg-white p-3 md:p-6 rounded-2xl shadow-sm mb-8 w-full mx-auto">
          <div id="history-content" class="space-y-6"></div>
          <div id="history-empty" class="hidden text-center text-gray-500 py-10 text-lg md:text-xl">目前還沒有任何測驗紀錄喔！</div>
        </div>
        <div class="text-center flex justify-center gap-6">
          <button id="btn-history-back" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm text-lg md:text-xl">回上一頁</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(html),
  :global(body) {
    overflow-anchor: none;
  }
</style>
