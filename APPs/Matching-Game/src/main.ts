import '../../../shared/styles/style.scss';
// @ts-ignore
import { ProgressTracker } from '../../../shared/utils/ProgressTracker.js';

/** 與閱讀大廳（reading-hub）相對路徑；結算彈窗「回大廳」與標題列「回閱讀大廳」連結共用 */
const READING_LOBBY_HREF = '../../apps/reading-hub/index.html';

function navigateReadingLobby(): void {
  window.location.href = READING_LOBBY_HREF;
}

/**
 * 下一題庫段落：依網址 `para` 與段落選單之數字選項往後；已於最後一段則回閱讀大廳。
 * 未帶 `para`（全文章）時導向第一段練習。
 */
function navigateNextParagraph(): void {
  const params = new URLSearchParams(window.location.search);
  let u = params.get('unit') || '1';
  u = u.replace(/^unit/i, '');
  const sel = document.getElementById('paragraph-selector') as HTMLSelectElement | null;
  const numericOptions = sel
    ? Array.from(sel.options)
        .map((o) => parseInt(o.value, 10))
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b)
    : [];
  if (numericOptions.length === 0) {
    navigateReadingLobby();
    return;
  }
  const curPara = params.get('para');
  const curN =
    curPara != null && curPara !== '' && !Number.isNaN(parseInt(curPara, 10))
      ? parseInt(curPara, 10)
      : null;
  if (curN == null || Number.isNaN(curN)) {
    window.location.href = `?unit=${u}&para=${numericOptions[0]}`;
    return;
  }
  const next = numericOptions.find((n) => n > curN);
  if (next !== undefined) {
    window.location.href = `?unit=${u}&para=${next}`;
    return;
  }
  navigateReadingLobby();
}

function syncTimerToAllPages(): void {
  for (const p of pagesList) {
    pageTimers[p] = timeLeft;
  }
}

// Dynamically import all matching CSV files in the vocabulary directory
const csvModules = import.meta.glob('../../../content/vocabulary/**/*.csv', { query: '?raw', import: 'default', eager: true });

// 閱讀文章（.md）：僅舊版題庫用於依空行分段推導遊戲頁。Dictionary 題庫以 CSV `Para` 為分頁依據，不套用文章推導。
const readingMdModules = import.meta.glob('../../../content/Article/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

interface QuizItem {
  id: string;
  word: string;
  engExplanation: string;
  synonyms: string[];
  antonyms: string[];
  isEmptySynonym: boolean;
  isEmptyAntonym: boolean;
  gamePage: number;
}

/**
 * CSV 第 19 欄多為「全文段落序號」（例如 21、22…75），與遊戲分頁不同。
 * 若直接當成 gamePage，會產生 50+ 顆分頁按鈕。
 * 當偵測到段落編號從文章較後段開始（>= ARTICLE_PARAGRAPH_THRESHOLD）時，
 * 依 PRD「兩段一遊戲頁」合併，並重編成連續頁 1,2,3…
 */
/** 段落序號 ≥ 此值時視為「全文段落編號」（如 21、22…），依兩段一遊戲頁合併；1～20 仍按每段重編為連續頁、不強制兩兩併 */
const ARTICLE_PARAGRAPH_THRESHOLD = 21;
const PARAGRAPHS_PER_GAME_PAGE = 2;

/**
 * 將欄位中的「段落序號」轉成遊戲頁碼，避免 21~75 變 55 個分頁按鈕。
 * - 偵測為文章段落序時：兩兩併一頁
 * - 其餘：各不重複值依序重編成 1..N（不強制兩兩併，保留「一段一頁」的短單元）
 */
function applyGamePageFromColumnHeuristic(items: QuizItem[], forcePair: boolean | null = null): void {
  if (items.length === 0) return;
  const U = [...new Set(items.map((i) => i.gamePage))].sort((a, b) => a - b);
  if (U.length <= 1) return;
  const first = U[0];
  const usePairing =
    forcePair === true || (forcePair !== false && first >= ARTICLE_PARAGRAPH_THRESHOLD);
  const map: Record<number, number> = {};
  if (usePairing) {
    U.forEach((p, idx) => {
      map[p] = Math.floor(idx / PARAGRAPHS_PER_GAME_PAGE) + 1;
    });
  } else {
    U.forEach((p, idx) => {
      map[p] = idx + 1;
    });
  }
  items.forEach((i) => {
    i.gamePage = map[i.gamePage] ?? i.gamePage;
  });
}

function fileBaseName(key: string): string {
  const s = key.replace(/\\/g, '/');
  const seg = s.split('/');
  return seg[seg.length - 1] ?? key;
}

/**
 * 依單元編號在 glob 結果中選題庫檔：**Dictionary 優先**，其次 Bryan、最後 `YLE-n.csv`。
 * 先比對檔名（避免路徑字串誤判），再以路徑 contains 作寬鬆備援。
 */
/** 從 vocabulary glob 鍵名推導可用的 YLE 單元編號（如 1、2、3） */
function discoverYleUnitNumbers(modules: Record<string, unknown>): string[] {
  const seen = new Set<string>();
  for (const k of Object.keys(modules)) {
    const m = fileBaseName(k).match(/^YLE-(\d+)/i);
    if (m) seen.add(m[1]!);
  }
  return [...seen].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

function findVocabularyCsvKeyForUnit(modules: Record<string, unknown>, unitNumber: string): string | undefined {
  const keys = Object.keys(modules);
  const byBase = (base: string) => keys.find((k) => fileBaseName(k) === base);
  const n = unitNumber;
  return (
    byBase(`YLE-${n}-Dictionary.csv`) ??
    byBase(`YLE-${n}-Bryan.csv`) ??
    byBase(`YLE-${n}.csv`) ??
    keys.find((k) => k.replace(/\\/g, '/').includes(`YLE-${n}-Dictionary.csv`)) ??
    keys.find((k) => k.replace(/\\/g, '/').includes(`YLE-${n}-Bryan.csv`)) ??
    keys.find((k) => k.replace(/\\/g, '/').includes(`YLE-${n}.csv`))
  );
}

/**
 * 依單元編號尋找對應的閱讀用 .md（如 YLE-1.md 或 YLE-2-Article.md）
 */
function findReadingMdKeyForUnit(modules: Record<string, string>, unitNumber: string): string | null {
  const keys = Object.keys(modules);
  const a = keys.find((k) => fileBaseName(k) === `YLE-${unitNumber}.md`);
  if (a) return a;
  const b = keys.find((k) => fileBaseName(k) === `YLE-${unitNumber}-Article.md`);
  if (b) return b;
  return keys.find((k) => k.replace(/\\/g, '/').includes(`Article/YLE-${unitNumber}/`) && k.endsWith('.md')) ?? null;
}

/**
 * 依 .md 內容分段：一個或連續多個空行＝下一段
 */
function splitArticleMdIntoBlocks(md: string): string[] {
  return md
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/**
 * 若首段僅有單行 Markdown 標題（# …），不計入敘事段落
 */
function dropSingleLineLeadingH1(blocks: string[]): string[] {
  if (blocks.length === 0) return blocks;
  const first = blocks[0].trim();
  if (first.split('\n').length === 1 && /^#\s+\S/.test(first)) {
    return blocks.slice(1);
  }
  return blocks;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordExistsAsTokenInText(word: string, text: string): boolean {
  const w = word.trim();
  if (!w) return false;
  const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
  return re.test(text);
}

/** 0-based 段序；未出現則 -1 */
function firstParagraphIndexForWord(word: string, paragraphs: string[]): number {
  for (let i = 0; i < paragraphs.length; i += 1) {
    if (wordExistsAsTokenInText(word, paragraphs[i]!)) {
      return i;
    }
  }
  return -1;
}

/**
 * 以閱讀文分段決定遊戲頁。段落序為 1-based；未在文中出現的單字置於第 1 段所屬頁。
 * forcePair: false 時依「一段＝一遊戲頁」；其餘（含 null）為「兩段＝一遊戲頁」(PARAGRAPHS_PER_GAME_PAGE)。
 */
function applyGamePageFromArticleMarkdown(
  items: QuizItem[],
  articleParagraphs: string[],
  forcePair: boolean | null
): void {
  if (items.length === 0 || articleParagraphs.length === 0) return;
  const usePairing = forcePair !== false;
  for (const item of items) {
    const idx0 = firstParagraphIndexForWord(item.word, articleParagraphs);
    const para1Based = idx0 < 0 ? 1 : idx0 + 1;
    if (usePairing) {
      item.gamePage = Math.floor((para1Based - 1) / PARAGRAPHS_PER_GAME_PAGE) + 1;
    } else {
      item.gamePage = para1Based;
    }
  }
}

/** 含引號逗號之 CSV 列解析 */
function parseCsvLineToParts(line: string): string[] {
  const parts: string[] = [];
  let currentPart = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    const char = line[j]!;
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(currentPart);
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  parts.push(currentPart);
  return parts;
}

/** 檔案開頭 UTF-8 BOM（與 normalizeDictHeader 內單欄 BOM 一併處理） */
function stripUtf8Bom(s: string): string {
  return s.replace(/^\uFEFF/, '');
}

function normalizeDictHeader(raw: string): string {
  return stripUtf8Bom(raw).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Para 欄可為單一數字或 "8, 9, 13"；取最小段號作為遊戲頁（Matching-Game-Rule §6.1）
 */
function minParagraphFromParaCell(cell: string | undefined): number {
  if (!cell || !cell.trim()) return 1;
  const s = cell.trim().replace(/^["']|["']$/g, '');
  const nums = s
    .split(/[,，\s]+/)
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return 1;
  return Math.min(...nums);
}

function isDictionaryCsvContent(csv: string): boolean {
  const t = csv.trim();
  if (!t) return false;
  const firstLine = t.split(/\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return false;
  const headerParts = parseCsvLineToParts(firstLine);
  const col: Record<string, number> = {};
  headerParts.forEach((raw, i) => {
    col[normalizeDictHeader(raw)] = i;
  });
  return (
    col['word'] !== undefined &&
    col['definition'] !== undefined &&
    col['synonym-english 1'] !== undefined &&
    col['antonym-english 1'] !== undefined &&
    col['para'] !== undefined
  );
}

/**
 * `YLE-n-Dictionary.csv`：表頭含 Word、Definition、Synonym/Antonym-English 1/2、Para。
 * `gamePage` = Para 儲存格內各段號之最小值。
 */
function parseDictionaryCSV(csv: string, unitNumber: string): QuizItem[] {
  const lines = csv.trim().split(/\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerParts = parseCsvLineToParts(lines[0]!);
  const col: Record<string, number> = {};
  headerParts.forEach((raw, i) => {
    col[normalizeDictHeader(raw)] = i;
  });

  const idxWord = col['word'];
  const idxDef = col['definition'];
  const idxSyn1 = col['synonym-english 1'];
  const idxAnt1 = col['antonym-english 1'];
  const idxSyn2 = col['synonym-english 2'];
  const idxAnt2 = col['antonym-english 2'];
  const idxPara = col['para'];

  if (
    idxWord === undefined ||
    idxDef === undefined ||
    idxSyn1 === undefined ||
    idxAnt1 === undefined ||
    idxPara === undefined
  ) {
    console.warn(
      'Dictionary CSV: missing required columns (Word, Definition, Synonym-English 1, Antonym-English 1, Para).'
    );
    return [];
  }

  const items: QuizItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const parts = parseCsvLineToParts(line);
    if (parts.length <= Math.max(idxWord, idxPara, idxDef, idxSyn1, idxAnt1)) continue;

    const word = (parts[idxWord] ?? '').trim();
    if (!word) continue;

    const engExplanation = (parts[idxDef] ?? '').trim();
    const synonyms: string[] = [];
    const s1 = (parts[idxSyn1] ?? '').trim();
    const s2 = idxSyn2 !== undefined ? (parts[idxSyn2] ?? '').trim() : '';
    if (s1) synonyms.push(s1);
    if (s2) synonyms.push(s2);

    const antonyms: string[] = [];
    const a1 = (parts[idxAnt1] ?? '').trim();
    const a2 = idxAnt2 !== undefined ? (parts[idxAnt2] ?? '').trim() : '';
    if (a1) antonyms.push(a1);
    if (a2) antonyms.push(a2);

    const gamePage = minParagraphFromParaCell(parts[idxPara]);

    const hadSyn = s1.length > 0 || s2.length > 0;
    const hadAnt = a1.length > 0 || a2.length > 0;

    items.push({
      id: `d-${unitNumber}-${i}`,
      word,
      engExplanation,
      synonyms: hadSyn ? synonyms : ['No synonyms'],
      antonyms: hadAnt ? antonyms : ['No Antonyms'],
      isEmptySynonym: !hadSyn,
      isEmptyAntonym: !hadAnt,
      gamePage,
    });
  }
  return items;
}

function parseCSV(csv: string): QuizItem[] {
  const lines = csv.trim().split('\n');
  const items: QuizItem[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCsvLineToParts(line);
    
    if (parts.length < 12) continue;
    
    const id = parts[0];
    const wordEn = parts[1];
    const engExplanation = parts[3];
    
    const syn1En = parts[4];
    const syn2En = parts[6];
    
    const ant1En = parts[8];
    const ant2En = parts[10];
    
    const word = wordEn;
    
    const synonyms: string[] = [];
    if (syn1En) synonyms.push(syn1En);
    if (syn2En) synonyms.push(syn2En);
    
    const antonyms: string[] = [];
    if (ant1En) antonyms.push(ant1En);
    if (ant2En) antonyms.push(ant2En);

    // Parse game page (index 18 for column 19, or fallback to auto-grouping)
    const gamePageStr = parts.length > 18 ? parts[18] : null;
    let gamePage = 1;
    
    // Check if gamePageStr is a valid number and not empty
    if (gamePageStr && gamePageStr.trim() !== '' && !isNaN(parseInt(gamePageStr))) {
      gamePage = parseInt(gamePageStr);
    } else {
      // Fallback: group every 4 items into a page (since 10 is too many for a matching game)
      gamePage = Math.ceil((items.length + 1) / 4) || 1;
    }
    
    items.push({
      id,
      word,
      engExplanation,
      synonyms: synonyms.length > 0 ? synonyms : ["No synonyms"],
      antonyms: antonyms.length > 0 ? antonyms : ["No Antonyms"],
      isEmptySynonym: synonyms.length === 0,
      isEmptyAntonym: antonyms.length === 0,
      gamePage
    });
  }
  
  return items;
}

let quizData: QuizItem[] = [];
let activeConnections: { fromId: string, toId: string, type: 'synonym-word' | 'word-antonym', page: number }[] = [];
let pageTimers: Record<number, number> = {};
let pagesList: number[] = [];

// Fisher-Yates Shuffle algorithm
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Render a word card
function createCard(id: string, content: string | string[], type: 'synonym' | 'word' | 'antonym', isEmpty: boolean = false, page: number = 1, engExplanation?: string): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'word-card';
  card.dataset.id = id;
  card.dataset.type = type;
  card.dataset.page = page.toString();
  if (isEmpty) {
    card.dataset.empty = 'true';
  }

  if (type === 'word') {
    card.classList.add('flip-container');
    const flipper = document.createElement('div');
    flipper.className = 'flipper';

    // Front side
    const front = document.createElement('div');
    front.className = 'front';
    
    const img = document.createElement('img');
    const keyword = encodeURIComponent(content as string);
    // 使用 pollinations.ai 生成圖片，若失敗則降級使用 loremflickr
    img.src = `https://image.pollinations.ai/prompt/${keyword}%20illustration?width=160&height=140&nologo=true`;
    img.alt = content as string;
    img.className = 'word-image';
    img.onerror = () => {
      img.onerror = null; // 避免無限迴圈
      img.src = `https://loremflickr.com/160/140/${keyword}`;
    };
    
    const wordText = document.createElement('div');
    wordText.className = 'line word-text';
    wordText.textContent = content as string;
    
    front.appendChild(img);
    front.appendChild(wordText);

    // Back side
    const back = document.createElement('div');
    back.className = 'back';
    const explanationText = document.createElement('div');
    explanationText.className = 'explanation-text';
    explanationText.textContent = engExplanation || '';
    back.appendChild(explanationText);

    flipper.appendChild(front);
    flipper.appendChild(back);
    card.appendChild(flipper);
  } else {
    if (Array.isArray(content)) {
      content.forEach(line => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'line';
        lineDiv.textContent = line;
        card.appendChild(lineDiv);
      });
    } else {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'line';
      lineDiv.textContent = content;
      card.appendChild(lineDiv);
    }
  }

  // Add connection points for drawing lines
  if (type === 'synonym') {
    const point = document.createElement('div');
    point.className = 'connection-point';
    card.appendChild(point);
  } else if (type === 'word') {
    const pointLeft = document.createElement('div');
    pointLeft.className = 'connection-point left';
    const pointRight = document.createElement('div');
    pointRight.className = 'connection-point right';
    card.appendChild(pointLeft);
    card.appendChild(pointRight);
  } else if (type === 'antonym') {
    const point = document.createElement('div');
    point.className = 'connection-point';
    card.appendChild(point);
  }

  return card;
}

// Initialize game
function initGame() {
  // Parse URL parameter for unit
  const urlParams = new URLSearchParams(window.location.search);
  const unitParam = urlParams.get('unit') || '1';
  let unitNumber = unitParam.replace('unit', '');
  console.log(`Current unit: ${unitParam}`); // For future data fetching/filtering

  // Determine which CSV file to load based on unit
  const targetFileKey = findVocabularyCsvKeyForUnit(csvModules, unitNumber);
  
  let csvContent = '';
  if (targetFileKey && csvModules[targetFileKey]) {
    csvContent = csvModules[targetFileKey] as string;
  } else {
    console.warn(`Could not find CSV for ${unitParam}, falling back to the first available CSV.`);
    const fallback = Object.keys(csvModules)[0];
    if (fallback) {
      csvContent = csvModules[fallback] as string;
    }
  }

  // 強制覆蓋：使用 fetch 動態載入 Dictionary CSV，避免 Vite 打包快取舊資料
  const t = new Date().getTime();
  fetch(`../../content/vocabulary/YLE-${unitNumber}/YLE-${unitNumber}-Dictionary.csv?t=${t}`)
    .then(res => {
      if (!res.ok) throw new Error('Fetch failed');
      return res.text();
    })
    .then(text => {
      const isHTML = text.trim().toLowerCase().startsWith('<!doctype html>');
      if (!isHTML) {
        csvContent = text;
      }
      continueInitGame(csvContent, unitNumber, urlParams, targetFileKey);
    })
    .catch(err => {
      console.warn('Dynamic fetch failed, using bundled CSV:', err);
      continueInitGame(csvContent, unitNumber, urlParams, targetFileKey);
    });
}

function continueInitGame(csvContent: string, unitNumber: string, urlParams: URLSearchParams, targetFileKey: string | undefined) {
  if (!csvContent) {
    console.error("No CSV files found!");
    return;
  }

  csvContent = stripUtf8Bom(csvContent);

  // Update title based on unit
  const title = `YLE-${unitNumber}-Matching`;
  document.title = title;
  const h1 = document.querySelector('.header h1');
  if (h1) h1.textContent = title;

  let useDictionaryFormat =
    (!!targetFileKey && fileBaseName(targetFileKey).toLowerCase().endsWith('-dictionary.csv')) ||
    isDictionaryCsvContent(csvContent);

  let allData: QuizItem[];
  if (useDictionaryFormat) {
    allData = parseDictionaryCSV(csvContent, unitNumber);
    if (allData.length === 0) {
      console.warn('Dictionary format detected but parse yielded no rows; using legacy parser.');
      useDictionaryFormat = false;
      allData = parseCSV(csvContent);
    }
  } else {
    allData = parseCSV(csvContent);
  }

  const paraParam = urlParams.get('para');
  let filteredData: QuizItem[] = allData;

  // ?pair=0：一段一遊戲頁；?pair=1 或未帶參：舊題庫走欄位啟發式／文章分段併頁（Dictionary 題庫不使用 pair）
  const pairParam = urlParams.get('pair');
  const forcePair: boolean | null =
    pairParam === '0' || pairParam === 'false' ? false : pairParam === '1' || pairParam === 'true' ? true : null;

  const readingMdKey = findReadingMdKeyForUnit(readingMdModules as Record<string, string>, unitNumber);
  const readingMd = readingMdKey ? (readingMdModules[readingMdKey] as string) : null;
  const articleBlocks = readingMd ? dropSingleLineLeadingH1(splitArticleMdIntoBlocks(readingMd)) : [];

  if (!useDictionaryFormat) {
    if (articleBlocks.length > 0) {
      applyGamePageFromArticleMarkdown(allData, articleBlocks, forcePair);
    } else {
      applyGamePageFromColumnHeuristic(allData, forcePair);
    }
  }

  if (paraParam && !isNaN(parseInt(paraParam, 10))) {
    const targetPara = parseInt(paraParam, 10);
    const paraData = useDictionaryFormat
      ? allData.filter((item) => item.gamePage === targetPara)
      : allData.filter((item) => {
          const idx0 = firstParagraphIndexForWord(item.word, articleBlocks);
          const para1Based = idx0 < 0 ? 1 : idx0 + 1;
          return para1Based === targetPara;
        });

    if (paraData.length === 0) {
      console.warn(`No words found for paragraph ${targetPara}, showing all words instead.`);
    } else {
      filteredData = paraData;
    }
  }
  
  // Do not shuffle filteredData to preserve paragraph order, but we can shuffle within rendering if needed
  quizData = filteredData;
  activeConnections = [];
  pageTimers = {};

  const paragraphSelector = document.getElementById('paragraph-selector') as HTMLSelectElement | null;
  if (paragraphSelector) {
    if (useDictionaryFormat && allData.length > 0) {
      const paras = [...new Set(allData.map((q) => q.gamePage))].sort((a, b) => a - b);
      const optAll = document.createElement('option');
      optAll.value = '';
      optAll.textContent = '全部段落';
      paragraphSelector.replaceChildren(
        optAll,
        ...paras.map((p) => {
          const o = document.createElement('option');
          o.value = String(p);
          o.textContent = `第 ${p} 段`;
          return o;
        })
      );
      const curPara = urlParams.get('para');
      const curN =
        curPara != null && curPara !== '' && !Number.isNaN(parseInt(curPara, 10))
          ? parseInt(curPara, 10)
          : null;
      paragraphSelector.value = curN != null && paras.includes(curN) ? String(curN) : '';
      paragraphSelector.disabled = false;
      paragraphSelector.onchange = (e) => {
        const v = (e.target as HTMLSelectElement).value;
        const u = unitNumber;
        window.location.href = v ? `?unit=${u}&para=${encodeURIComponent(v)}` : `?unit=${u}`;
      };
    } else {
      paragraphSelector.replaceChildren();
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = '段落（Dictionary 專用）';
      ph.disabled = true;
      paragraphSelector.appendChild(ph);
      paragraphSelector.value = '';
      paragraphSelector.disabled = true;
      paragraphSelector.onchange = null;
    }
  }

  const synonymsContainer = document.getElementById('synonyms-container');
  const wordsContainer = document.getElementById('words-container');
  const antonymsContainer = document.getElementById('antonyms-container');

  if (!synonymsContainer || !wordsContainer || !antonymsContainer) return;

  // Clear containers
  synonymsContainer.innerHTML = '';
  wordsContainer.innerHTML = '';
  antonymsContainer.innerHTML = '';

  // Get unique pages
  pagesList = [...new Set(quizData.map(q => q.gamePage))].sort((a, b) => a - b);
  if (pagesList.length === 0) pagesList = [1];

  function renderPageData(data: QuizItem[], pageNum: number) {
    // Shuffle the words within the page so they aren't completely predictable, or keep original order.
    // The PRD says "左右兩側選項順序需隨機打亂", so middle column can stay in original order or be shuffled.
    // Let's keep the middle column in original order to match the paragraph flow.
    const words = data.map(item => ({ id: item.id, content: item.word, engExplanation: item.engExplanation }));
    const synonyms = data.map(item => ({ id: item.id, content: item.synonyms, isEmpty: item.isEmptySynonym }));
    const antonyms = data.map(item => ({ id: item.id, content: item.antonyms, isEmpty: item.isEmptyAntonym }));

    // Shuffle synonyms and antonyms independently
    let shuffledSynonyms = shuffle(synonyms);
    let shuffledAntonyms = shuffle(antonyms);

    // Ensure they don't align perfectly with words
    while (shuffledSynonyms.some((item, index) => item.id === words[index]?.id) && shuffledSynonyms.length > 1) {
      shuffledSynonyms = shuffle(synonyms);
    }
    while (shuffledAntonyms.some((item, index) => item.id === words[index]?.id) && shuffledAntonyms.length > 1) {
      shuffledAntonyms = shuffle(antonyms);
    }

    // Render cards
    shuffledSynonyms.forEach(item => {
      synonymsContainer!.appendChild(createCard(item.id, item.content, 'synonym', item.isEmpty, pageNum));
    });

    words.forEach(item => {
      wordsContainer!.appendChild(createCard(item.id, item.content, 'word', false, pageNum, item.engExplanation));
    });

    shuffledAntonyms.forEach(item => {
      antonymsContainer!.appendChild(createCard(item.id, item.content, 'antonym', item.isEmpty, pageNum));
    });
  }

  pagesList.forEach(pageNum => {
    const pageData = quizData.filter(q => q.gamePage === pageNum);
    renderPageData(pageData, pageNum);
    pageTimers[pageNum] = 300; // 5 minutes per page（多頁時共用同一倒數，見 syncTimerToAllPages）
  });

  currentPage = pagesList[0]!;
  timeLeft = pageTimers[currentPage]!;
  syncTimerToAllPages();
  updatePageVisibility();

  setupInteractions();
  startTimer();
}

let currentPage = 1;

function updatePageVisibility() {
  // 已移除底部分頁按鈕：所有遊戲頁字卡同時顯示，倒數計時全單元共用
  document.querySelectorAll('.word-card').forEach((card) => {
    (card as HTMLElement).style.display = 'flex';
  });

  requestAnimationFrame(() => {
    drawAllConnections();
  });
}

// Interaction logic
let selectedSynonym: HTMLElement | null = null;
let selectedWord: HTMLElement | null = null;
let selectedAntonym: HTMLElement | null = null;
let score = 0;
let timeLeft = 300; // 5 minutes
let timerInterval: number | null = null;

function updateScore(points: number, x: number, y: number) {
  score += points;
  const scoreEl = document.getElementById('score');
  if (scoreEl) {
    scoreEl.textContent = score.toString();
  }

  // Show floating score
  const container = document.getElementById('floating-labels-container');
  if (container) {
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-score';
    floatEl.textContent = `+${points}`;
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    container.appendChild(floatEl);
    
    setTimeout(() => {
      floatEl.remove();
    }, 1000);
  }
}

function showWrongX(x: number, y: number) {
  const container = document.getElementById('floating-labels-container');
  if (container) {
    const xEl = document.createElement('div');
    xEl.className = 'wrong-x';
    xEl.textContent = 'x';
    xEl.style.left = `${x}px`;
    xEl.style.top = `${y}px`;
    container.appendChild(xEl);
    
    setTimeout(() => {
      xEl.remove();
    }, 500);
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('timer');
  if (timerEl) {
    timerEl.textContent = formatTime(timeLeft);
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  updateTimerDisplay();
  
  timerInterval = window.setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      syncTimerToAllPages();
      if (timeLeft <= 0) {
        timeLeft = 0;
        pagesList.forEach((p) => {
          pageTimers[p] = 0;
        });
        alert("Time's up!");
        checkGameComplete();
      }
      updateTimerDisplay();
    }
  }, 1000);
}

function endGame() {
  if (timerInterval) clearInterval(timerInterval);
  
  const modal = document.getElementById('game-over-modal');
  const finalScoreEl = document.getElementById('final-score-value');
  
  if (modal && finalScoreEl) {
    finalScoreEl.textContent = score.toString();
    modal.classList.remove('hidden');
  }

  // 儲存成績到 ProgressTracker
  const urlParams = new URLSearchParams(window.location.search);
  const unitParam = urlParams.get('unit') || '1';
  const unitNumber = unitParam.replace('unit', '');
  const paraParam = urlParams.get('para');
  const fileLabel = paraParam ? `YLE-${unitNumber} (Para ${paraParam})` : `YLE-${unitNumber}`;
  
  const duration = 300 - timeLeft; // 預設 300 秒
  
  ProgressTracker.saveReadingGameResult({
    gameType: 'Matching',
    unit: unitNumber,
    file: fileLabel,
    duration: duration,
    score: score,
    total: 0, // Matching game doesn't have a strict total score yet
    totalPercent: score > 0 ? 100 : 0 // Placeholder
  });
}

let flipTimers: { [id: string]: number } = {};

function setupInteractions() {
  const cards = document.querySelectorAll('.word-card');

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (timeLeft <= 0) return; // Cannot interact if time is up for this page
      
      const target = e.currentTarget as HTMLElement;
      if (target.classList.contains('matched')) return;

      const type = target.dataset.type;
      const id = target.dataset.id!;
      
      if (type === 'synonym') {
        if (selectedSynonym) selectedSynonym.classList.remove('selected');
        selectedSynonym = target;
        target.classList.add('selected');
      } else if (type === 'word') {
        // Remove selected class and flipped state from ANY PREVIOUSLY selected word globally
        // This ensures absolutely no two white borders exist at the same time
        document.querySelectorAll('.word-card[data-type="word"].selected').forEach(el => {
          if (el !== target) {
            el.classList.remove('selected');
            el.classList.remove('flipped');
            const prevId = (el as HTMLElement).dataset.id!;
            if (flipTimers[prevId]) {
              clearTimeout(flipTimers[prevId]);
              delete flipTimers[prevId];
            }
          }
        });

        if (target.classList.contains('flipped')) {
          // If already flipped, click again to flip back early and keep selected
          target.classList.remove('flipped');
          if (flipTimers[id]) {
            clearTimeout(flipTimers[id]);
            delete flipTimers[id];
          }
          selectedWord = target;
          target.classList.add('selected');
        } else {
          // If not flipped, flip it to show explanation
          target.classList.add('flipped');
          
          // Add selected class to THIS target immediately upon click (shows white border)
          target.classList.add('selected');
          
          // Update selectedWord reference to the new one
          selectedWord = target;
          
          if (flipTimers[id]) {
            clearTimeout(flipTimers[id]);
          }
          
          flipTimers[id] = window.setTimeout(() => {
            target.classList.remove('flipped');
            // Ensure we only keep 'selected' if this is STILL the selectedWord
            if (selectedWord === target) {
              target.classList.add('selected');
            }
            delete flipTimers[id];
            // We do not call checkMatch here anymore, because the user can match 
            // while it's flipped or after it's flipped back.
          }, 3000);
          
          // Now we allow matching immediately after clicking the word!
          checkMatch();
          return;
        }
      } else if (type === 'antonym') {
        if (selectedAntonym) selectedAntonym.classList.remove('selected');
        selectedAntonym = target;
        target.classList.add('selected');
      }

      checkMatch();
    });
  });

  window.addEventListener('resize', drawAllConnections);
  
  // Setup buttons
  const btnAdd = document.getElementById('btn-add-time');
  const btnMinus = document.getElementById('btn-minus-time');
  const btnNextParagraph = document.getElementById('btn-next-paragraph');
  const btnBackLobby = document.getElementById('btn-back-lobby');

  const allPagesFullyMatched = () =>
    pagesList.every((p) =>
      Array.from(document.querySelectorAll(`.word-card[data-page="${p}"]`)).every((card) =>
        card.classList.contains('matched')
      )
    );

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      if (timeLeft <= 0 && allPagesFullyMatched()) {
        return;
      }
      timeLeft += 30;
      syncTimerToAllPages();
      updateTimerDisplay();
    });
  }

  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      timeLeft -= 30;
      if (timeLeft <= 0) {
        timeLeft = 0;
        pagesList.forEach((p) => {
          pageTimers[p] = 0;
        });
        alert("Time's up!");
        checkGameComplete();
      }
      syncTimerToAllPages();
      updateTimerDisplay();
    });
  }

  if (btnNextParagraph) {
    btnNextParagraph.addEventListener('click', () => {
      navigateNextParagraph();
    });
  }
  if (btnBackLobby) {
    btnBackLobby.addEventListener('click', () => {
      navigateReadingLobby();
    });
  }
}

function checkMatch() {
  if (selectedSynonym && selectedWord) {
    const isMatch = selectedSynonym.dataset.id === selectedWord.dataset.id || 
                    (selectedSynonym.dataset.empty === 'true' && isWordEmptySynonym(selectedWord.dataset.id!));
                    
    if (isMatch) {
      // Match!
      selectedSynonym.classList.add('matched');
      selectedWord.classList.add('matched');

      const connPage = parseInt(
        selectedWord.dataset.page || selectedSynonym.dataset.page || String(currentPage),
        10
      );

      activeConnections.push({
        fromId: selectedSynonym.dataset.id!,
        toId: selectedWord.dataset.id!,
        type: 'synonym-word',
        page: connPage
      });
      
      const { cx, cy } = drawConnection(selectedSynonym, selectedWord, 'correct');
      updateScore(0.5, cx, cy);
      
      // Keep word selected if it still needs an antonym
      if (!isWordFullyMatched(selectedWord.dataset.id!)) {
        selectedWord.classList.remove('matched');
      } else {
        selectedWord.classList.remove('selected');
        selectedWord = null;
      }
      
      selectedSynonym.classList.remove('selected');
      selectedSynonym = null;
    } else {
      // Wrong match
      const { cx, cy } = drawConnection(selectedSynonym, selectedWord, 'wrong');
      showWrongX(cx, cy);
      setTimeout(() => {
        if (selectedSynonym) selectedSynonym.classList.remove('selected');
        // Do not remove selectedWord class, keep it selected
        selectedSynonym = null;
        // Do not nullify selectedWord
        drawAllConnections(); // Clear wrong lines
      }, 500);
    }
  }

  if (selectedWord && selectedAntonym) {
    const isMatch = selectedWord.dataset.id === selectedAntonym.dataset.id || 
                    (selectedAntonym.dataset.empty === 'true' && isWordEmptyAntonym(selectedWord.dataset.id!));
                    
    if (isMatch) {
      // Match!
      selectedWord.classList.add('matched');
      selectedAntonym.classList.add('matched');

      const connPage = parseInt(
        selectedWord.dataset.page || selectedAntonym.dataset.page || String(currentPage),
        10
      );

      activeConnections.push({
        fromId: selectedWord.dataset.id!,
        toId: selectedAntonym.dataset.id!,
        type: 'word-antonym',
        page: connPage
      });
      
      const { cx, cy } = drawConnection(selectedWord, selectedAntonym, 'correct');
      updateScore(0.5, cx, cy);
      
      // Keep word selected if it still needs a synonym
      if (!isWordFullyMatched(selectedWord.dataset.id!)) {
        selectedWord.classList.remove('matched');
      } else {
        selectedWord.classList.remove('selected');
        selectedWord = null;
      }
      
      selectedAntonym.classList.remove('selected');
      selectedAntonym = null;
    } else {
      // Wrong match
      const { cx, cy } = drawConnection(selectedWord, selectedAntonym, 'wrong');
      showWrongX(cx, cy);
      setTimeout(() => {
        // Do not remove selectedWord class, keep it selected
        if (selectedAntonym) selectedAntonym.classList.remove('selected');
        // Do not nullify selectedWord
        selectedAntonym = null;
        drawAllConnections(); // Clear wrong lines
      }, 500);
    }
  }

  checkGameComplete();
}

function isWordEmptySynonym(id: string): boolean {
  const item = quizData.find(q => q.id === id);
  return item ? item.isEmptySynonym : false;
}

function isWordEmptyAntonym(id: string): boolean {
  const item = quizData.find(q => q.id === id);
  return item ? item.isEmptyAntonym : false;
}

function isWordFullyMatched(id: string): boolean {
  const hasSynonymMatch = activeConnections.some(c => c.toId === id && c.type === 'synonym-word');
  const hasAntonymMatch = activeConnections.some(c => c.fromId === id && c.type === 'word-antonym');
  
  return !!(hasSynonymMatch && hasAntonymMatch);
}

function drawConnection(el1: HTMLElement, el2: HTMLElement, status: 'correct' | 'wrong' | 'normal' = 'normal') {
  const svg = document.getElementById('connections-layer') as unknown as SVGSVGElement;
  
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();

  // Determine which is left and right
  const isEl1Left = rect1.left < rect2.left;
  const leftEl = isEl1Left ? el1 : el2;
  const rightEl = isEl1Left ? el2 : el1;

  const leftRect = leftEl.getBoundingClientRect();
  const rightRect = rightEl.getBoundingClientRect();

  const x1 = leftRect.right - svgRect.left;
  const y1 = leftRect.top + leftRect.height / 2 - svgRect.top;
  const x2 = rightRect.left - svgRect.left;
  const y2 = rightRect.top + rightRect.height / 2 - svgRect.top;

  // Create SVG path
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  // Bezier curve
  const cx = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  
  path.setAttribute('d', d);
  path.classList.add(status);
  
  // Add data attributes to identify the path
  if (status === 'correct') {
    path.dataset.from = leftEl.dataset.id;
    path.dataset.to = rightEl.dataset.id;
    path.dataset.type = leftEl.dataset.type + '-' + rightEl.dataset.type;
  } else if (status === 'wrong') {
    path.classList.add('temp-wrong');
  }

  svg.appendChild(path);
  
  return { cx: cx, cy: (y1 + y2) / 2 };
}

function drawAllConnections() {
  const svg = document.getElementById('connections-layer') as unknown as SVGSVGElement;
  svg.innerHTML = ''; // Clear all paths
  
  activeConnections.forEach((conn) => {
    let leftEl: HTMLElement | null = null;
    let rightEl: HTMLElement | null = null;

    if (conn.type === 'synonym-word') {
      leftEl = document.querySelector(`.word-card[data-type="synonym"][data-id="${conn.fromId}"]`);
      rightEl = document.querySelector(`.word-card[data-type="word"][data-id="${conn.toId}"]`);
    } else if (conn.type === 'word-antonym') {
      leftEl = document.querySelector(`.word-card[data-type="word"][data-id="${conn.fromId}"]`);
      rightEl = document.querySelector(`.word-card[data-type="antonym"][data-id="${conn.toId}"]`);
    }

    if (leftEl && rightEl) {
      drawConnection(leftEl, rightEl, 'correct');
    }
  });
}

function checkGameComplete() {
  // Check if all pages are either fully matched or timed out
  let allPagesDone = true;
  pagesList.forEach(p => {
    const pageCards = document.querySelectorAll(`.word-card[data-page="${p}"]`);
    const pageMatched = Array.from(pageCards).every(card => card.classList.contains('matched'));
    if (!pageMatched && pageTimers[p] > 0) {
      allPagesDone = false;
    }
  });

  if (allPagesDone) {
    setTimeout(() => {
      endGame();
    }, 500);
  }
}

document.addEventListener('DOMContentLoaded', initGame);
