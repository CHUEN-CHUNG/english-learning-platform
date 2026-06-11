<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import '$lib/styles/matching-game.scss';

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

  onMount(() => {
    const ARTICLE_PARAGRAPH_THRESHOLD = 21;
    const PARAGRAPHS_PER_GAME_PAGE = 2;

    let quizData: QuizItem[] = [];
    let activeConnections: { fromId: string; toId: string; type: 'synonym-word' | 'word-antonym'; page: number }[] = [];
    let pageTimers: Record<number, number> = {};
    let pagesList: number[] = [];
    let currentPage = 1;

    let selectedSynonym: HTMLElement | null = null;
    let selectedWord: HTMLElement | null = null;
    let selectedAntonym: HTMLElement | null = null;
    let score = 0;
    let timeLeft = 300;
    let timerInterval: number | null = null;
    const flipTimers: Record<string, number> = {};

    function navigateReadingLobby(): void {
      window.location.href = `${base}/reading-hub`;
    }

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
        curPara != null && curPara !== '' && !Number.isNaN(parseInt(curPara, 10)) ? parseInt(curPara, 10) : null;
      if (curN == null || Number.isNaN(curN)) {
        window.location.href = `${base}/matching-game?unit=${u}&para=${numericOptions[0]}`;
        return;
      }
      const next = numericOptions.find((n) => n > curN);
      if (next !== undefined) {
        window.location.href = `${base}/matching-game?unit=${u}&para=${next}`;
        return;
      }
      navigateReadingLobby();
    }

    function syncTimerToAllPages(): void {
      for (const p of pagesList) pageTimers[p] = timeLeft;
    }

    function applyGamePageFromColumnHeuristic(items: QuizItem[], forcePair: boolean | null = null): void {
      if (items.length === 0) return;
      const U = [...new Set(items.map((i) => i.gamePage))].sort((a, b) => a - b);
      if (U.length <= 1) return;
      const first = U[0];
      const usePairing = forcePair === true || (forcePair !== false && first >= ARTICLE_PARAGRAPH_THRESHOLD);
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

    function splitArticleMdIntoBlocks(md: string): string[] {
      return md
        .replace(/\r\n/g, '\n')
        .split(/\n\s*\n+/)
        .map((b) => b.trim())
        .filter(Boolean);
    }

    function dropSingleLineLeadingH1(blocks: string[]): string[] {
      if (blocks.length === 0) return blocks;
      const first = blocks[0].trim();
      if (first.split('\n').length === 1 && /^#\s+\S/.test(first)) return blocks.slice(1);
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

    function firstParagraphIndexForWord(word: string, paragraphs: string[]): number {
      for (let i = 0; i < paragraphs.length; i += 1) {
        if (wordExistsAsTokenInText(word, paragraphs[i]!)) return i;
      }
      return -1;
    }

    function applyGamePageFromArticleMarkdown(items: QuizItem[], articleParagraphs: string[], forcePair: boolean | null): void {
      if (items.length === 0 || articleParagraphs.length === 0) return;
      const usePairing = forcePair !== false;
      for (const item of items) {
        const idx0 = firstParagraphIndexForWord(item.word, articleParagraphs);
        const para1Based = idx0 < 0 ? 1 : idx0 + 1;
        if (usePairing) item.gamePage = Math.floor((para1Based - 1) / PARAGRAPHS_PER_GAME_PAGE) + 1;
        else item.gamePage = para1Based;
      }
    }

    function parseCsvLineToParts(line: string): string[] {
      const parts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j]!;
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          parts.push(currentPart);
          currentPart = '';
        } else currentPart += char;
      }
      parts.push(currentPart);
      return parts;
    }

    function stripUtf8Bom(s: string): string {
      return s.replace(/^\uFEFF/, '');
    }

    function normalizeDictHeader(raw: string): string {
      return stripUtf8Bom(raw).trim().toLowerCase().replace(/\s+/g, ' ');
    }

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

      if (idxWord === undefined || idxDef === undefined || idxSyn1 === undefined || idxAnt1 === undefined || idxPara === undefined) {
        console.warn('Dictionary CSV: missing required columns.');
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
          gamePage
        });
      }
      return items;
    }

    function parseCSV(csv: string): QuizItem[] {
      const lines = csv.trim().split('\n');
      const items: QuizItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCsvLineToParts(line);
        if (parts.length < 12) continue;

        const id = parts[0];
        const word = parts[1];
        const engExplanation = parts[3];
        const syn1En = parts[4];
        const syn2En = parts[6];
        const ant1En = parts[8];
        const ant2En = parts[10];

        const synonyms: string[] = [];
        if (syn1En) synonyms.push(syn1En);
        if (syn2En) synonyms.push(syn2En);

        const antonyms: string[] = [];
        if (ant1En) antonyms.push(ant1En);
        if (ant2En) antonyms.push(ant2En);

        const gamePageStr = parts.length > 18 ? parts[18] : null;
        let gamePage = 1;
        if (gamePageStr && gamePageStr.trim() !== '' && !isNaN(parseInt(gamePageStr))) {
          gamePage = parseInt(gamePageStr);
        } else {
          gamePage = Math.ceil((items.length + 1) / 4) || 1;
        }

        items.push({
          id,
          word,
          engExplanation,
          synonyms: synonyms.length > 0 ? synonyms : ['No synonyms'],
          antonyms: antonyms.length > 0 ? antonyms : ['No Antonyms'],
          isEmptySynonym: synonyms.length === 0,
          isEmptyAntonym: antonyms.length === 0,
          gamePage
        });
      }
      return items;
    }

    function shuffle<T>(array: T[]): T[] {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    }

    function createCard(
      id: string,
      content: string | string[],
      type: 'synonym' | 'word' | 'antonym',
      isEmpty = false,
      page = 1,
      engExplanation?: string
    ): HTMLDivElement {
      const card = document.createElement('div');
      card.className = 'word-card';
      card.dataset.id = id;
      card.dataset.type = type;
      card.dataset.page = page.toString();
      if (isEmpty) card.dataset.empty = 'true';

      if (type === 'word') {
        card.classList.add('flip-container');
        const flipper = document.createElement('div');
        flipper.className = 'flipper';

        const front = document.createElement('div');
        front.className = 'front';

        const img = document.createElement('img');
        const keyword = encodeURIComponent(content as string);
        img.src = `https://image.pollinations.ai/prompt/${keyword}%20illustration?width=160&height=140&nologo=true`;
        img.alt = content as string;
        img.className = 'word-image';
        img.onerror = () => {
          img.onerror = null;
          img.src = `https://loremflickr.com/160/140/${keyword}`;
        };

        const wordText = document.createElement('div');
        wordText.className = 'line word-text';
        wordText.textContent = content as string;

        front.appendChild(img);
        front.appendChild(wordText);

        const back = document.createElement('div');
        back.className = 'back';
        const explanationText = document.createElement('div');
        explanationText.className = 'explanation-text';
        explanationText.textContent = engExplanation || '';
        back.appendChild(explanationText);

        flipper.appendChild(front);
        flipper.appendChild(back);
        card.appendChild(flipper);
      } else if (Array.isArray(content)) {
        content.forEach((line) => {
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

    function updateScore(points: number, x: number, y: number) {
      score += points;
      const scoreEl = document.getElementById('score');
      if (scoreEl) scoreEl.textContent = score.toString();
      const container = document.getElementById('floating-labels-container');
      if (container) {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-score';
        floatEl.textContent = `+${points}`;
        floatEl.style.left = `${x}px`;
        floatEl.style.top = `${y}px`;
        container.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1000);
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
        setTimeout(() => xEl.remove(), 500);
      }
    }

    function formatTime(seconds: number): string {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
      const timerEl = document.getElementById('timer');
      if (timerEl) timerEl.textContent = formatTime(timeLeft);
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

      const urlParams = new URLSearchParams(window.location.search);
      const unitParam = urlParams.get('unit') || '1';
      const unitNumber = unitParam.replace('unit', '');
      const paraParam = urlParams.get('para');
      const fileLabel = paraParam ? `YLE-${unitNumber} (Para ${paraParam})` : `YLE-${unitNumber}`;
      const duration = 300 - timeLeft;

      readingProgress.saveReadingGameResult({
        gameType: 'Matching',
        unit: unitNumber,
        file: fileLabel,
        duration,
        score,
        total: 0,
        totalPercent: score > 0 ? 100 : 0
      });
    }

    function isWordEmptySynonym(id: string): boolean {
      const item = quizData.find((q) => q.id === id);
      return item ? item.isEmptySynonym : false;
    }

    function isWordEmptyAntonym(id: string): boolean {
      const item = quizData.find((q) => q.id === id);
      return item ? item.isEmptyAntonym : false;
    }

    function isWordFullyMatched(id: string): boolean {
      const hasSynonymMatch = activeConnections.some((c) => c.toId === id && c.type === 'synonym-word');
      const hasAntonymMatch = activeConnections.some((c) => c.fromId === id && c.type === 'word-antonym');
      return !!(hasSynonymMatch && hasAntonymMatch);
    }

    function drawConnection(el1: HTMLElement, el2: HTMLElement, status: 'correct' | 'wrong' | 'normal' = 'normal') {
      const svg = document.getElementById('connections-layer') as unknown as SVGSVGElement;
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      const isEl1Left = rect1.left < rect2.left;
      const leftEl = isEl1Left ? el1 : el2;
      const rightEl = isEl1Left ? el2 : el1;

      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();

      const x1 = leftRect.right - svgRect.left;
      const y1 = leftRect.top + leftRect.height / 2 - svgRect.top;
      const x2 = rightRect.left - svgRect.left;
      const y2 = rightRect.top + rightRect.height / 2 - svgRect.top;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const cx = (x1 + x2) / 2;
      const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
      path.setAttribute('d', d);
      path.classList.add(status);

      if (status === 'correct') {
        path.dataset.from = leftEl.dataset.id;
        path.dataset.to = rightEl.dataset.id;
        path.dataset.type = leftEl.dataset.type + '-' + rightEl.dataset.type;
      } else if (status === 'wrong') {
        path.classList.add('temp-wrong');
      }

      svg.appendChild(path);
      return { cx, cy: (y1 + y2) / 2 };
    }

    function drawAllConnections() {
      const svg = document.getElementById('connections-layer') as unknown as SVGSVGElement;
      svg.innerHTML = '';
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
        if (leftEl && rightEl) drawConnection(leftEl, rightEl, 'correct');
      });
    }

    function checkGameComplete() {
      let allPagesDone = true;
      pagesList.forEach((p) => {
        const pageCards = document.querySelectorAll(`.word-card[data-page="${p}"]`);
        const pageMatched = Array.from(pageCards).every((card) => card.classList.contains('matched'));
        if (!pageMatched && pageTimers[p] > 0) allPagesDone = false;
      });
      if (allPagesDone) setTimeout(() => endGame(), 500);
    }

    function checkMatch() {
      if (selectedSynonym && selectedWord) {
        const isMatch =
          selectedSynonym.dataset.id === selectedWord.dataset.id ||
          (selectedSynonym.dataset.empty === 'true' && isWordEmptySynonym(selectedWord.dataset.id!));

        if (isMatch) {
          selectedSynonym.classList.add('matched');
          selectedWord.classList.add('matched');
          const connPage = parseInt(selectedWord.dataset.page || selectedSynonym.dataset.page || String(currentPage), 10);
          activeConnections.push({ fromId: selectedSynonym.dataset.id!, toId: selectedWord.dataset.id!, type: 'synonym-word', page: connPage });
          const { cx, cy } = drawConnection(selectedSynonym, selectedWord, 'correct');
          updateScore(0.5, cx, cy);
          if (!isWordFullyMatched(selectedWord.dataset.id!)) {
            selectedWord.classList.remove('matched');
          } else {
            selectedWord.classList.remove('selected');
            selectedWord = null;
          }
          selectedSynonym.classList.remove('selected');
          selectedSynonym = null;
        } else {
          const { cx, cy } = drawConnection(selectedSynonym, selectedWord, 'wrong');
          showWrongX(cx, cy);
          setTimeout(() => {
            if (selectedSynonym) selectedSynonym.classList.remove('selected');
            selectedSynonym = null;
            drawAllConnections();
          }, 500);
        }
      }

      if (selectedWord && selectedAntonym) {
        const isMatch =
          selectedWord.dataset.id === selectedAntonym.dataset.id ||
          (selectedAntonym.dataset.empty === 'true' && isWordEmptyAntonym(selectedWord.dataset.id!));

        if (isMatch) {
          selectedWord.classList.add('matched');
          selectedAntonym.classList.add('matched');
          const connPage = parseInt(selectedWord.dataset.page || selectedAntonym.dataset.page || String(currentPage), 10);
          activeConnections.push({ fromId: selectedWord.dataset.id!, toId: selectedAntonym.dataset.id!, type: 'word-antonym', page: connPage });
          const { cx, cy } = drawConnection(selectedWord, selectedAntonym, 'correct');
          updateScore(0.5, cx, cy);
          if (!isWordFullyMatched(selectedWord.dataset.id!)) {
            selectedWord.classList.remove('matched');
          } else {
            selectedWord.classList.remove('selected');
            selectedWord = null;
          }
          selectedAntonym.classList.remove('selected');
          selectedAntonym = null;
        } else {
          const { cx, cy } = drawConnection(selectedWord, selectedAntonym, 'wrong');
          showWrongX(cx, cy);
          setTimeout(() => {
            if (selectedAntonym) selectedAntonym.classList.remove('selected');
            selectedAntonym = null;
            drawAllConnections();
          }, 500);
        }
      }

      checkGameComplete();
    }

    function setupInteractions() {
      const cards = document.querySelectorAll('.word-card');
      cards.forEach((card) => {
        card.addEventListener('click', (e) => {
          if (timeLeft <= 0) return;
          const target = e.currentTarget as HTMLElement;
          if (target.classList.contains('matched')) return;

          const type = target.dataset.type;
          const id = target.dataset.id!;

          if (type === 'synonym') {
            if (selectedSynonym) selectedSynonym.classList.remove('selected');
            selectedSynonym = target;
            target.classList.add('selected');
          } else if (type === 'word') {
            document.querySelectorAll('.word-card[data-type="word"].selected').forEach((el) => {
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
              target.classList.remove('flipped');
              if (flipTimers[id]) {
                clearTimeout(flipTimers[id]);
                delete flipTimers[id];
              }
              selectedWord = target;
              target.classList.add('selected');
            } else {
              target.classList.add('flipped');
              target.classList.add('selected');
              selectedWord = target;
              if (flipTimers[id]) clearTimeout(flipTimers[id]);
              flipTimers[id] = window.setTimeout(() => {
                target.classList.remove('flipped');
                if (selectedWord === target) target.classList.add('selected');
                delete flipTimers[id];
              }, 3000);
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

      const btnAdd = document.getElementById('btn-add-time');
      const btnMinus = document.getElementById('btn-minus-time');
      const btnNextParagraph = document.getElementById('btn-next-paragraph');
      const btnBackLobby = document.getElementById('btn-back-lobby');

      const allPagesFullyMatched = () =>
        pagesList.every((p) =>
          Array.from(document.querySelectorAll(`.word-card[data-page="${p}"]`)).every((card) => card.classList.contains('matched'))
        );

      btnAdd?.addEventListener('click', () => {
        if (timeLeft <= 0 && allPagesFullyMatched()) return;
        timeLeft += 30;
        syncTimerToAllPages();
        updateTimerDisplay();
      });

      btnMinus?.addEventListener('click', () => {
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

      btnNextParagraph?.addEventListener('click', () => navigateNextParagraph());
      btnBackLobby?.addEventListener('click', () => navigateReadingLobby());
    }

    function updatePageVisibility() {
      document.querySelectorAll('.word-card').forEach((card) => {
        (card as HTMLElement).style.display = 'flex';
      });
      requestAnimationFrame(() => drawAllConnections());
    }

    function continueInitGame(csvContentRaw: string, unitNumber: string, urlParams: URLSearchParams, readingMd: string | null) {
      let csvContent = csvContentRaw;
      if (!csvContent) {
        console.error('No CSV files found!');
        return;
      }
      csvContent = stripUtf8Bom(csvContent);

      const title = `YLE-${unitNumber}-Matching`;
      document.title = title;
      const h1 = document.querySelector('.mg-root .header h1');
      if (h1) h1.textContent = title;

      let useDictionaryFormat = isDictionaryCsvContent(csvContent);

      let allData: QuizItem[];
      if (useDictionaryFormat) {
        allData = parseDictionaryCSV(csvContent, unitNumber);
        if (allData.length === 0) {
          useDictionaryFormat = false;
          allData = parseCSV(csvContent);
        }
      } else {
        allData = parseCSV(csvContent);
      }

      const paraParam = urlParams.get('para');
      let filteredData: QuizItem[] = allData;

      const pairParam = urlParams.get('pair');
      const forcePair: boolean | null =
        pairParam === '0' || pairParam === 'false' ? false : pairParam === '1' || pairParam === 'true' ? true : null;

      const articleBlocks = readingMd ? dropSingleLineLeadingH1(splitArticleMdIntoBlocks(readingMd)) : [];

      if (!useDictionaryFormat) {
        if (articleBlocks.length > 0) applyGamePageFromArticleMarkdown(allData, articleBlocks, forcePair);
        else applyGamePageFromColumnHeuristic(allData, forcePair);
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
        if (paraData.length > 0) filteredData = paraData;
      }

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
            curPara != null && curPara !== '' && !Number.isNaN(parseInt(curPara, 10)) ? parseInt(curPara, 10) : null;
          paragraphSelector.value = curN != null && paras.includes(curN) ? String(curN) : '';
          paragraphSelector.disabled = false;
          paragraphSelector.onchange = (e) => {
            const v = (e.target as HTMLSelectElement).value;
            const u = unitNumber;
            window.location.href = v ? `${base}/matching-game?unit=${u}&para=${encodeURIComponent(v)}` : `${base}/matching-game?unit=${u}`;
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

      synonymsContainer.innerHTML = '';
      wordsContainer.innerHTML = '';
      antonymsContainer.innerHTML = '';

      pagesList = [...new Set(quizData.map((q) => q.gamePage))].sort((a, b) => a - b);
      if (pagesList.length === 0) pagesList = [1];

      function renderPageData(data: QuizItem[], pageNum: number) {
        const words = data.map((item) => ({ id: item.id, content: item.word, engExplanation: item.engExplanation }));
        const synonyms = data.map((item) => ({ id: item.id, content: item.synonyms, isEmpty: item.isEmptySynonym }));
        const antonyms = data.map((item) => ({ id: item.id, content: item.antonyms, isEmpty: item.isEmptyAntonym }));

        let shuffledSynonyms = shuffle(synonyms);
        let shuffledAntonyms = shuffle(antonyms);

        while (shuffledSynonyms.some((item, index) => item.id === words[index]?.id) && shuffledSynonyms.length > 1) {
          shuffledSynonyms = shuffle(synonyms);
        }
        while (shuffledAntonyms.some((item, index) => item.id === words[index]?.id) && shuffledAntonyms.length > 1) {
          shuffledAntonyms = shuffle(antonyms);
        }

        shuffledSynonyms.forEach((item) => {
          synonymsContainer!.appendChild(createCard(item.id, item.content, 'synonym', item.isEmpty, pageNum));
        });
        words.forEach((item) => {
          wordsContainer!.appendChild(createCard(item.id, item.content, 'word', false, pageNum, item.engExplanation));
        });
        shuffledAntonyms.forEach((item) => {
          antonymsContainer!.appendChild(createCard(item.id, item.content, 'antonym', item.isEmpty, pageNum));
        });
      }

      pagesList.forEach((pageNum) => {
        const pageData = quizData.filter((q) => q.gamePage === pageNum);
        renderPageData(pageData, pageNum);
        pageTimers[pageNum] = 300;
      });

      currentPage = pagesList[0]!;
      timeLeft = pageTimers[currentPage]!;
      syncTimerToAllPages();
      updatePageVisibility();
      setupInteractions();
      startTimer();
    }

    async function initGame() {
      const urlParams = new URLSearchParams(window.location.search);
      const unitParam = urlParams.get('unit') || '1';
      const unitNumber = unitParam.replace('unit', '');

      let csvContent = '';
      const t = new Date().getTime();
      try {
        const res = await fetch(`${base}/content/vocabulary/YLE-${unitNumber}/YLE-${unitNumber}-Dictionary.csv?t=${t}`);
        if (res.ok) {
          const text = await res.text();
          if (!text.trim().toLowerCase().startsWith('<!doctype html>')) csvContent = text;
        }
      } catch (err) {
        console.warn('Dictionary fetch failed:', err);
      }

      let readingMd: string | null = null;
      try {
        const res = await fetch(`${base}/content/articles/YLE-${unitNumber}/YLE-${unitNumber}-Article.md`);
        if (res.ok) {
          const text = await res.text();
          if (!text.trim().toLowerCase().startsWith('<!doctype html>')) readingMd = text;
        }
      } catch {
        readingMd = null;
      }

      continueInitGame(csvContent, unitNumber, urlParams, readingMd);
    }

    void initGame();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      Object.values(flipTimers).forEach((id) => clearTimeout(id));
      window.removeEventListener('resize', drawAllConnections);
    };
  });
</script>

<svelte:head>
  <title>同義詞反義詞配對遊戲</title>
</svelte:head>

<div class="mg-root">
  <div id="app">
    <header class="header">
      <div class="header-top-row" style="justify-content: center;">
        <h1>YLE2</h1>
      </div>
      <div class="unit-selector-container" style="margin: 0 20px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <label for="paragraph-selector" style="font-size: 14px; white-space: nowrap;">段落</label>
        <select id="paragraph-selector" style="padding: 5px 10px; font-size: 16px; border-radius: 5px;">
          <option value="">（載入後更新）</option>
        </select>
      </div>
      <div class="game-stats">
        <div class="stat-box time-box">
          <span class="label">Time:</span>
          <span id="timer" class="value">05:00</span>
          <button id="btn-minus-time" class="time-btn">- 30s</button>
          <button id="btn-add-time" class="time-btn">+ 30s</button>
        </div>
        <div class="stat-box">
          <span class="label">Score:</span>
          <span id="score" class="value">0</span>
        </div>
      </div>
    </header>

    <main class="game-container">
      <svg id="connections-layer" class="connections-layer"></svg>
      <div id="floating-labels-container" class="floating-labels-container"></div>

      <div class="columns-wrapper">
        <div class="column" id="col-synonyms">
          <div class="column-header">Synonyms</div>
          <div class="items-container" id="synonyms-container"></div>
        </div>

        <div class="column" id="col-words">
          <div class="column-header">Word</div>
          <div class="items-container" id="words-container"></div>
        </div>

        <div class="column" id="col-antonyms">
          <div class="column-header">Antonyms</div>
          <div class="items-container" id="antonyms-container"></div>
        </div>
      </div>
    </main>

    <div id="game-over-modal" class="modal hidden">
      <div class="modal-content">
        <h2>Congratulations!</h2>
        <p>Time's up or you finished!</p>
        <div class="final-score">Final Score: <span id="final-score-value">0</span></div>
        <div class="modal-actions">
          <button type="button" id="btn-next-paragraph" class="btn btn-modal-secondary">Next Paragraph</button>
          <button type="button" id="btn-back-lobby" class="btn">Back to Reading Lobby</button>
        </div>
      </div>
    </div>

    <a
      href="{base}/reading-hub"
      class="fixed top-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#ddd] rounded-full text-[#333] font-bold no-underline transition-all shadow-sm z-50 text-lg hover:-translate-y-0.5 hover:shadow-md"
    >
      🏠 回閱讀大廳
    </a>
  </div>
</div>
