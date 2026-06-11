<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { readingProgress } from '$lib/stores/readingProgress.svelte';
  import '$lib/styles/reading-practice.scss';

  onMount(() => {
    readingProgress.init();

    // ----- game state -----
    let sentences: string[] = [];
    let questions: any[] = [];
    let starQuestions: any[] = [];
    let summaryData: any[] = [];
    let currentSentenceIndex = 0;
    let currentPosition = 0;
    let coins = 0;
    let interactionsInParagraph = 0;
    let totalParagraphs = 0;
    const TOTAL_TILES = 12;
    const startTime = Date.now();

    const cleanups: Array<() => void> = [];
    const on = (el: Element | null, ev: string, fn: EventListenerOrEventListenerObject) => {
      if (!el) return;
      el.addEventListener(ev, fn);
      cleanups.push(() => el.removeEventListener(ev, fn));
    };

    // ----- DOM elements -----
    const articleContent = document.getElementById('article-content')!;
    const board = document.getElementById('board')!;
    const diceBtn = document.getElementById('dice-btn') as HTMLButtonElement;
    const coinCount = document.getElementById('coin-count')!;

    const qModal = document.getElementById('question-modal')!;
    const qType = document.getElementById('q-type')!;
    const qText = document.getElementById('q-text')!;
    const qOptions = document.getElementById('q-options')!;
    const qFeedback = document.getElementById('q-feedback')!;
    const qNextBtn = document.getElementById('q-next-btn')!;
    const qSkipBtn = document.getElementById('q-skip-btn')!;
    const qCloseBtn = document.getElementById('q-close-btn')!;
    const finishModal = document.getElementById('finish-modal')!;

    function parseCSVRow(str: string) {
      const result: string[] = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < str.length; i++) {
        if (inQuote) {
          if (str[i] === '"') {
            if (i + 1 < str.length && str[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuote = false;
            }
          } else {
            cur += str[i];
          }
        } else {
          if (str[i] === '"') {
            inQuote = true;
          } else if (str[i] === ',') {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += str[i];
          }
        }
      }
      result.push(cur.trim());
      return result;
    }

    async function loadData() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const unitParam = urlParams.get('unit') || '1';
        const paraParamRaw = urlParams.get('para') || '1';
        const paraParam = parseInt(paraParamRaw) || 1;

        const paragraphSelector = document.getElementById('paragraph-selector') as HTMLSelectElement;
        const isHTML = (res: Response) => res.headers.get('content-type')?.includes('text/html');

        const t = new Date().getTime();
        let articleRes = await fetch(`${base}/content/articles/YLE-${unitParam}/YLE-${unitParam}-Article.md?t=${t}`);
        if (!articleRes.ok || isHTML(articleRes)) {
          articleRes = await fetch(`${base}/content/articles/YLE-${unitParam}/YLE-${unitParam}.md?t=${t}`);
        }
        if (!articleRes.ok || isHTML(articleRes)) throw new Error('Failed to load article');

        const articleText = await articleRes.text();

        const titleMatch = articleText.match(/^#\s+(.*)/m);
        const title = titleMatch ? titleMatch[1] : `Reading Unit ${unitParam}`;
        const titleEl = document.getElementById('article-title');
        if (titleEl) titleEl.textContent = `Story: ${title}`;

        const paragraphs = articleText.split('\n\n').filter((p) => p.trim().length > 0 && !p.startsWith('#'));
        totalParagraphs = paragraphs.length;

        if (paragraphSelector) {
          paragraphSelector.innerHTML = '';
          paragraphs.forEach((_, idx) => {
            const option = document.createElement('option');
            option.value = (idx + 1).toString();
            option.textContent = `Paragraph ${idx + 1}`;
            paragraphSelector.appendChild(option);
          });

          const summaryOption = document.createElement('option');
          summaryOption.value = 'summary';
          summaryOption.textContent = 'Unit Summary (文章摘要填空)';
          paragraphSelector.appendChild(summaryOption);

          const modeParam = urlParams.get('mode') || (urlParams.get('para') === 'summary' ? 'summary' : null);
          if (modeParam === 'summary') {
            paragraphSelector.value = 'summary';
          } else {
            paragraphSelector.value = paraParam.toString();
          }

          on(paragraphSelector, 'change', (e) => {
            const val = (e.target as HTMLSelectElement).value;
            if (val === 'summary') {
              window.location.href = `?unit=${unitParam}&mode=summary`;
            } else {
              window.location.href = `?unit=${unitParam}&para=${val}`;
            }
          });
        }

        const paragraphIndex = paraParam - 1;
        const currentParagraphText =
          paragraphs[paragraphIndex >= 0 && paragraphIndex < paragraphs.length ? paragraphIndex : 0];

        if (currentParagraphText.includes('---')) {
          sentences = currentParagraphText
            .split('---')
            .map((s) => s.trim().replace(/\n/g, '<br>'))
            .filter((s) => s.length > 0);
        } else if (currentParagraphText.includes('\n')) {
          sentences = currentParagraphText
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        } else {
          sentences = currentParagraphText.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [
            currentParagraphText
          ];
        }

        let qaRes = await fetch(`${base}/content/reading-qa/YLE-${unitParam}-ReadingQA.csv?t=${t}`);
        if (!qaRes.ok || isHTML(qaRes)) {
          qaRes = await fetch(`${base}/content/reading-qa/YLE-${unitParam}-QA.csv?t=${t}`);
        }
        if (!qaRes.ok || isHTML(qaRes)) throw new Error('Failed to load questions');
        const qaText = await qaRes.text();
        const lines = qaText.split('\n').filter((line) => line.trim().length > 0);

        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVRow(lines[i]);
          if (row.length >= 9) {
            if (row[1] === paraParam.toString() || row[1].toLowerCase() === 'all') {
              questions.push({
                id: row[0],
                paragraph: row[1],
                type: row[2],
                text: row[3],
                options: [row[4], row[5], row[6], row[7]].filter((o) => o && o !== ''),
                answer: row[8],
                explanation: row[9] || ''
              });
            }
          }
        }

        try {
          const starRes = await fetch(`${base}/content/reading-qa/YLE-${unitParam}-StarQA.csv?t=${t}`);
          if (starRes.ok && !isHTML(starRes)) {
            const starText = await starRes.text();
            const starLines = starText.split('\n').filter((line) => line.trim().length > 0);
            for (let i = 1; i < starLines.length; i++) {
              const row = parseCSVRow(starLines[i]);
              if (row.length >= 4) {
                if (row[1] === paraParam.toString() || row[1].toLowerCase() === 'all') {
                  starQuestions.push({
                    id: row[0],
                    paragraph: row[1],
                    type: row[2],
                    commandEn: row[3],
                    commandZh: row[4] || ''
                  });
                }
              }
            }
          }
        } catch (e) {
          console.log('No star questions found for this unit.');
        }

        try {
          const summaryRes = await fetch(`${base}/content/reading-qa/YLE-${unitParam}-SummaryQA.csv?t=${t}`);
          if (summaryRes.ok && !isHTML(summaryRes)) {
            const summaryText = await summaryRes.text();
            const summaryLines = summaryText.split('\n').filter((line) => line.trim().length > 0);
            for (let i = 1; i < summaryLines.length; i++) {
              const row = parseCSVRow(summaryLines[i]);
              if (row.length >= 3) {
                summaryData.push({
                  paragraph: parseInt(row[0]),
                  summary: row[1],
                  words: row[2]
                    .split(',')
                    .map((w) => w.trim())
                    .filter((w) => w.length > 0)
                });
              }
            }
          }
        } catch (e) {
          console.log('No summary questions found for this unit.');
        }

        initArticle();
        initBoard();

        const finalModeParam =
          urlParams.get('mode') || (urlParams.get('para') === 'summary' ? 'summary' : null);
        if (finalModeParam === 'summary') {
          if (summaryData && summaryData.length > 0) {
            document.querySelector('.game-area')!.classList.add('hidden');
            initSummaryChallenge();
            summaryArea!.classList.remove('hidden');
            summaryArea!.classList.add('flex');
          } else {
            alert('此單元尚無摘要挑戰資料！');
          }
        }
      } catch (error) {
        console.error('載入資料失敗:', error);
        articleContent.innerHTML = `<p style="color:red; padding: 20px;">載入失敗：<br>${error}</p>`;
      }
    }

    function initArticle() {
      articleContent.innerHTML = '';
      sentences.forEach((text, index) => {
        const div = document.createElement('div');
        div.className = `sentence ${index === 0 ? 'active' : ''}`;
        div.id = `sentence-${index}`;
        div.innerHTML = text;
        articleContent.appendChild(div);
      });
    }

    function initBoard() {
      board.innerHTML = '<div id="player-token" class="player-token">🚶</div>';
      const radius = 150;
      const center = 150;

      const tileTypes = Array(TOTAL_TILES).fill('question');
      let starsPlaced = 0;
      while (starsPlaced < 3) {
        const idx = Math.floor(Math.random() * TOTAL_TILES);
        if (tileTypes[idx] === 'question') {
          tileTypes[idx] = 'star';
          starsPlaced++;
        }
      }

      for (let i = 0; i < TOTAL_TILES; i++) {
        const angle = (i / TOTAL_TILES) * (2 * Math.PI) - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        const tile = document.createElement('div');
        tile.className = 'tile';

        if (tileTypes[i] === 'question') {
          tile.classList.add('type-q');
          tile.textContent = '?';
          tile.dataset.type = 'question';
        } else {
          tile.classList.add('type-star');
          tile.textContent = '⭐';
          tile.dataset.type = 'star';
        }

        tile.style.left = `${x}px`;
        tile.style.top = `${y}px`;
        board.appendChild(tile);
      }

      const newToken = document.getElementById('player-token')!;
      updatePlayerPosition(newToken);
    }

    function updatePlayerPosition(tokenElement: HTMLElement) {
      const radius = 150;
      const center = 150;
      const angle = (currentPosition / TOTAL_TILES) * (2 * Math.PI) - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      tokenElement.style.left = `${x}px`;
      tokenElement.style.top = `${y}px`;
    }

    const diceImages = ['⚀', '⚁', '⚂'];

    on(diceBtn, 'click', () => {
      diceBtn.disabled = true;
      const roll = Math.floor(Math.random() * 3) + 1;
      let rolls = 0;
      const interval = setInterval(() => {
        const randomFace = Math.floor(Math.random() * 3);
        diceBtn.textContent = diceImages[randomFace];
        rolls++;
        if (rolls > 10) {
          clearInterval(interval);
          diceBtn.textContent = diceImages[roll - 1];
          movePlayer(roll);
        }
      }, 50);
    });

    function movePlayer(steps: number) {
      currentPosition = (currentPosition + steps) % TOTAL_TILES;
      const token = document.getElementById('player-token')!;
      updatePlayerPosition(token);
      setTimeout(() => {
        triggerTileEvent();
      }, 600);
    }

    function triggerTileEvent() {
      interactionsInParagraph++;
      const tiles = document.querySelectorAll('.tile');
      const currentTile = tiles[currentPosition] as HTMLElement;
      const tileType = currentTile.dataset.type;

      if (tileType === 'question') {
        if (questions.length > 0) {
          showQuestion();
        } else if (starQuestions.length > 0) {
          showStarQuestion();
        } else {
          addCoins(3);
          advanceSentence();
        }
      } else if (tileType === 'star') {
        if (starQuestions.length > 0) {
          showStarQuestion();
        } else if (questions.length > 0) {
          showQuestion();
        } else {
          addCoins(3);
          advanceSentence();
        }
      } else {
        addCoins(3);
        advanceSentence();
      }
    }

    function showStarQuestion() {
      const q = starQuestions.shift();
      if (!q) return;

      qType.textContent = 'Action Time! ⭐';
      qType.style.display = 'inline-block';
      qType.style.fontSize = '1.3rem';
      qText.textContent = q.commandEn;
      qOptions.innerHTML = '';
      qFeedback.classList.add('hidden');
      qNextBtn.classList.add('hidden');
      qSkipBtn.classList.add('hidden');

      const didItBtn = document.createElement('button');
      didItBtn.className = 'action-btn';
      didItBtn.style.backgroundColor = '#fbc02d';
      didItBtn.style.color = '#fff';
      didItBtn.style.border = 'none';
      didItBtn.style.fontSize = '1.3rem';
      didItBtn.style.padding = '15px 30px';
      didItBtn.textContent = 'I did it! (我做到了)';

      didItBtn.onclick = () => {
        qFeedback.classList.remove('hidden');
        qFeedback.textContent = 'Great job! +3 Coins ⭐';
        qFeedback.className = 'feedback success';
        addCoins(3);
        didItBtn.classList.add('hidden');
        qNextBtn.classList.remove('hidden');
      };

      qOptions.appendChild(didItBtn);
      qModal.classList.remove('hidden');
    }

    function addCoins(amount: number) {
      coins += amount;
      coinCount.textContent = coins.toString();
    }

    function showQuestion() {
      const q = questions.shift();
      if (!q) return;

      qType.style.display = 'none';
      qText.textContent = q.text;
      qOptions.innerHTML = '';
      qFeedback.classList.add('hidden');
      qNextBtn.classList.add('hidden');
      qSkipBtn.classList.remove('hidden');

      q.options.forEach((opt: string) => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(btn, opt === q.answer, q.explanation);
        qOptions.appendChild(btn);
      });

      qModal.classList.remove('hidden');
    }

    function handleAnswer(btn: HTMLButtonElement, isCorrect: boolean, explanation: string) {
      Array.from(qOptions.children).forEach((child) => ((child as HTMLButtonElement).disabled = true));

      qFeedback.classList.remove('hidden');
      if (isCorrect) {
        btn.classList.add('correct');
        qFeedback.textContent = 'Correct! +3 Coins 🪙';
        qFeedback.className = 'feedback success';
        addCoins(3);
      } else {
        btn.classList.add('wrong');
        qFeedback.textContent = `Incorrect. ${explanation}`;
        qFeedback.className = 'feedback error';
      }

      qNextBtn.classList.remove('hidden');
      qSkipBtn.classList.add('hidden');
    }

    on(qNextBtn, 'click', () => {
      qModal.classList.add('hidden');
      advanceSentence();
    });

    function skipQuestion() {
      qModal.classList.add('hidden');
      advanceSentence();
    }

    on(qSkipBtn, 'click', skipQuestion);
    on(qCloseBtn, 'click', skipQuestion);

    function advanceSentence() {
      const currentDiv = document.getElementById(`sentence-${currentSentenceIndex}`);
      if (currentDiv) {
        currentDiv.classList.remove('active');
        currentDiv.classList.add('completed');
      }

      currentSentenceIndex++;

      if (currentSentenceIndex < sentences.length) {
        const nextDiv = document.getElementById(`sentence-${currentSentenceIndex}`);
        if (nextDiv) {
          nextDiv.classList.add('active');
          nextDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        diceBtn.disabled = false;
        diceBtn.textContent = '🎲';
      } else {
        document.getElementById('final-coins')!.textContent = coins.toString();

        const nextParaBtn = document.getElementById('next-para-btn');
        const summaryChallengeBtn = document.getElementById('summary-challenge-btn');
        const urlParams = new URLSearchParams(window.location.search);
        const unitParam = urlParams.get('unit') || '1';
        const unitNumber = unitParam.replace('unit', '');
        const paraParam = parseInt(urlParams.get('para') || '1');

        if (nextParaBtn && summaryChallengeBtn) {
          if (paraParam >= totalParagraphs) {
            (nextParaBtn as HTMLElement).style.display = 'none';
            if (summaryData && summaryData.length > 0) {
              summaryChallengeBtn.classList.remove('hidden');
              (summaryChallengeBtn as HTMLElement).style.display = 'inline-block';
            }
          } else {
            (nextParaBtn as HTMLElement).style.display = 'inline-block';
            (summaryChallengeBtn as HTMLElement).style.display = 'none';
          }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        const fileLabel = `YLE-${unitNumber} (Para ${paraParam})`;

        readingProgress.saveReadingGameResult({
          gameType: 'Reading',
          unit: unitNumber,
          file: fileLabel,
          duration: duration,
          score: coins,
          total: 0,
          totalPercent: 100
        });

        finishModal.classList.remove('hidden');
      }
    }

    const nextParaBtn = document.getElementById('next-para-btn');
    const backHubBtn = document.getElementById('back-hub-btn');

    on(nextParaBtn, 'click', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const unitParam = urlParams.get('unit') || '1';
      const paraParam = parseInt(urlParams.get('para') || '1');
      window.location.href = `?unit=${unitParam}&para=${paraParam + 1}`;
    });

    on(backHubBtn, 'click', () => {
      window.location.href = `${base}/reading-hub`;
    });

    // ----- Unit Summary Challenge -----
    const summaryArea = document.getElementById('summary-area');
    const summaryChallengeBtn = document.getElementById('summary-challenge-btn');
    const summaryWordBank = document.getElementById('summary-word-bank');
    const summarySentences = document.getElementById('summary-sentences');
    const summaryFeedback = document.getElementById('summary-feedback');
    const summarySubmitBtn = document.getElementById('summary-submit-btn');
    const summaryHubBtn = document.getElementById('summary-hub-btn');

    let selectedSummaryZone: HTMLElement | null = null;
    let selectedSummaryWord: HTMLElement | null = null;
    let summaryBaseWords: string[] = [];

    on(summaryChallengeBtn, 'click', () => {
      finishModal.classList.add('hidden');
      document.querySelector('.game-area')!.classList.add('hidden');
      initSummaryChallenge();
      summaryArea!.classList.remove('hidden');
      summaryArea!.classList.add('flex');
    });

    function initSummaryChallenge() {
      summaryWordBank!.innerHTML = '';
      summarySentences!.innerHTML = '';
      summaryBaseWords = [];

      const wordsToPlace: { displayWord: string; baseWord: string; id: string }[] = [];
      let blankIndex = 0;

      summaryData.forEach((paraData) => {
        const div = document.createElement('div');
        div.className = 'bg-purple-50 p-4 rounded-xl';

        let summaryText = paraData.summary;
        paraData.words.forEach((word: string) => {
          summaryBaseWords.push(word);
          const blankHtml = `<span class="summary-click-zone inline-flex items-center justify-center min-w-[80px] h-[32px] bg-white border-2 border-purple-300 rounded-lg mx-1 align-bottom cursor-pointer hover:bg-gray-100" data-index="${blankIndex}" data-baseword="${word}"></span>`;
          summaryText = summaryText.replace(`{${word}}`, blankHtml);
          wordsToPlace.push({ displayWord: word, baseWord: word, id: `sum-word-${blankIndex}` });
          blankIndex++;
        });

        div.innerHTML = `
          <div class="flex items-start">
            <span class="text-purple-600 font-bold text-xl mr-3">Para ${paraData.paragraph}.</span>
            <p class="text-lg leading-loose">${summaryText}</p>
          </div>
        `;
        summarySentences!.appendChild(div);
      });

      wordsToPlace.sort(() => Math.random() - 0.5);

      wordsToPlace.forEach((item) => {
        const wordEl = document.createElement('div');
        wordEl.id = item.id;
        wordEl.className =
          'summary-clickable-word inline-flex items-center justify-center bg-white px-3 py-1.5 rounded-lg shadow border-2 border-purple-300 cursor-pointer text-lg font-medium text-purple-700 hover:bg-purple-50 transition-all';
        wordEl.textContent = item.displayWord;
        wordEl.dataset.originalWord = item.displayWord;
        wordEl.dataset.baseWord = item.baseWord;
        wordEl.addEventListener('click', handleSummaryWordClick);
        summaryWordBank!.appendChild(wordEl);
      });

      document.querySelectorAll('.summary-click-zone').forEach((zone) => {
        zone.addEventListener('click', handleSummaryZoneClick);
      });
    }

    function handleSummaryWordClick(e: Event) {
      const el = e.currentTarget as HTMLElement;

      if (el.parentElement !== summaryWordBank) {
        returnSummaryWordToBank(el);
        return;
      }

      if (selectedSummaryZone) {
        placeSummaryWordInZone(el, selectedSummaryZone);
      } else {
        if (selectedSummaryWord === el) {
          el.classList.remove('ring-4', 'ring-purple-500');
          selectedSummaryWord = null;
        } else {
          if (selectedSummaryWord) {
            selectedSummaryWord.classList.remove('ring-4', 'ring-purple-500');
          }
          el.classList.add('ring-4', 'ring-purple-500');
          selectedSummaryWord = el;
        }
      }
    }

    function handleSummaryZoneClick(e: Event) {
      const zone = e.currentTarget as HTMLElement;

      if (selectedSummaryWord) {
        if (zone.children.length > 0) {
          returnSummaryWordToBank(zone.children[0] as HTMLElement);
        }
        placeSummaryWordInZone(selectedSummaryWord, zone);
        return;
      }

      if (zone.children.length > 0) {
        returnSummaryWordToBank(zone.children[0] as HTMLElement);
        return;
      }

      if (selectedSummaryZone === zone) {
        zone.classList.remove('bg-gray-200');
        zone.classList.add('bg-white');
        selectedSummaryZone = null;
      } else {
        if (selectedSummaryZone) {
          selectedSummaryZone.classList.remove('bg-gray-200');
          selectedSummaryZone.classList.add('bg-white');
        }
        zone.classList.remove('bg-white');
        zone.classList.add('bg-gray-200');
        selectedSummaryZone = zone;
      }
    }

    function placeSummaryWordInZone(wordEl: HTMLElement, zoneEl: HTMLElement) {
      if (zoneEl.children.length > 0) {
        returnSummaryWordToBank(zoneEl.children[0] as HTMLElement);
      }

      zoneEl.appendChild(wordEl);

      wordEl.classList.remove(
        'shadow',
        'border-2',
        'px-3',
        'py-1.5',
        'rounded-lg',
        'border-purple-300',
        'ring-4',
        'ring-purple-500'
      );
      wordEl.classList.add('w-full', 'h-full', 'bg-transparent');

      zoneEl.classList.remove('bg-gray-200');
      zoneEl.classList.add('bg-white');
      selectedSummaryZone = null;
      selectedSummaryWord = null;
    }

    function returnSummaryWordToBank(el: HTMLElement) {
      el.classList.add('shadow', 'border-2', 'px-3', 'py-1.5', 'rounded-lg', 'border-purple-300');
      el.classList.remove('w-full', 'h-full', 'bg-transparent', 'ring-4', 'ring-purple-500');
      summaryWordBank!.appendChild(el);
    }

    on(summarySubmitBtn, 'click', () => {
      let score = 0;
      const total = summaryBaseWords.length;
      let allFilled = true;

      document.querySelectorAll('.summary-click-zone').forEach((zone) => {
        const el = zone as HTMLElement;
        const correctWord = el.dataset.baseword;
        if (el.children.length > 0) {
          const child = el.children[0] as HTMLElement;
          const userWord = child.dataset.baseWord;
          if (userWord === correctWord) {
            score++;
            el.classList.remove('border-purple-300', 'border-red-500');
            el.classList.add('border-green-500', 'bg-green-100');
          } else {
            el.classList.remove('border-purple-300', 'border-green-500');
            el.classList.add('border-red-500', 'bg-red-100');
          }
        } else {
          allFilled = false;
          el.classList.remove('border-purple-300');
          el.classList.add('border-red-500');
        }
      });

      if (!allFilled) {
        alert('還有空格未填寫喔！');
        return;
      }

      summaryFeedback!.classList.remove('hidden');
      summaryFeedback!.className = `feedback ${score === total ? 'success' : 'error'} mb-4 block`;
      summaryFeedback!.textContent = `答對了 ${score} / ${total} 題！`;

      if (score === total) {
        (summarySubmitBtn as HTMLElement).style.display = 'none';
        summaryHubBtn!.classList.remove('hidden');
        (summaryHubBtn as HTMLElement).style.display = 'block';
      }
    });

    on(summaryHubBtn, 'click', () => {
      window.location.href = `${base}/reading-hub`;
    });

    loadData();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  });
</script>

<svelte:head>
  <title>Reading Explorer</title>
</svelte:head>

<div class="rp-root">
  <div class="reading-container h-full flex flex-col">
    <header class="header shrink-0">
      <div class="header-info">
        <h1>Reading Explorer</h1>
        <div class="unit-selector-container" style="margin-top: 10px;">
          <select
            id="paragraph-selector"
            style="padding: 5px 10px; font-size: 16px; border-radius: 5px; border: 1px solid #ccc; margin-left: 10px;"
          ></select>
        </div>
      </div>
      <div class="stats">
        <div class="stat-box">Coins: <span id="coin-count">0</span></div>
      </div>
    </header>

    <main class="game-area flex-1 min-h-0">
      <section class="article-panel">
        <h2 class="panel-title" id="article-title">Story: Loading...</h2>
        <div id="article-content" class="article-content"></div>
      </section>

      <section class="board-panel">
        <div class="dice-area">
          <button id="dice-btn" class="dice-btn" title="Roll Dice">🎲</button>
        </div>

        <div class="board-wrapper">
          <div class="board" id="board">
            <div id="player-token" class="player-token">🚶</div>
          </div>
        </div>
      </section>
    </main>

    <div id="question-modal" class="modal hidden">
      <div class="modal-content question-content relative">
        <button
          id="q-close-btn"
          class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
          aria-label="Close">&times;</button
        >
        <span class="type-badge" id="q-type" style="display: none;"></span>
        <h3 id="q-text">Question Text Here?</h3>
        <div id="q-options" class="options-container"></div>
        <p id="q-feedback" class="feedback hidden"></p>
        <div class="flex justify-center gap-4 mt-6">
          <button id="q-skip-btn" class="action-btn !bg-gray-400 hover:!bg-gray-500">Skip Question</button>
          <button id="q-next-btn" class="action-btn hidden">Continue Adventure</button>
        </div>
      </div>
    </div>

    <div id="finish-modal" class="modal hidden">
      <div class="modal-content finish-content">
        <h2>🎉 Paragraph Completed!</h2>
        <p>You have read all the sentences and earned <span id="final-coins">0</span> coins!</p>
        <div class="flex justify-center gap-4 mt-6">
          <button id="next-para-btn" class="action-btn">Continue to Next Paragraph</button>
          <button
            id="summary-challenge-btn"
            class="action-btn hidden !bg-purple-600 hover:!bg-purple-700 text-white font-bold"
            >Unit Summary Challenge</button
          >
          <button id="back-hub-btn" class="action-btn !bg-gray-400 hover:!bg-gray-500">Back to Reading Hub</button>
        </div>
      </div>
    </div>

    <main
      id="summary-area"
      class="hidden flex-1 min-h-0 flex-col bg-white p-6 md:p-10 overflow-hidden"
    >
      <h2 class="text-3xl font-bold mb-6 text-indigo-600 text-center">📝 Unit Summary Challenge</h2>
      <p class="text-gray-600 mb-6 text-center text-lg">
        請將上方單字填入對應的空格中，完成各段落的文章摘要！<br /><span class="text-sm"
          >(先點擊空格，再點選單字填入；點擊已填入的空格可將單字退回)</span
        >
      </p>

      <div
        id="summary-word-bank"
        class="flex flex-wrap gap-3 p-6 bg-purple-100 rounded-xl mb-8 border-2 border-dashed border-purple-400 min-h-[80px] shadow-sm justify-center shrink-0"
      ></div>

      <div
        id="summary-sentences"
        class="text-left space-y-8 mb-8 text-xl leading-loose flex-1 overflow-y-auto px-4"
      ></div>

      <div id="summary-feedback" class="feedback hidden mb-6 shrink-0"></div>

      <div class="flex justify-center gap-6 mt-4 shrink-0">
        <button
          id="summary-submit-btn"
          class="action-btn !bg-green-600 hover:!bg-green-700 !text-white px-10 py-4 text-xl rounded-xl"
          >Submit (送出答案)</button
        >
        <button
          id="summary-hub-btn"
          class="action-btn hidden !bg-gray-500 hover:!bg-gray-600 !text-white px-10 py-4 text-xl rounded-xl"
          >Back to Reading Hub</button
        >
      </div>
    </main>

    <a
      href="{base}/reading-hub"
      class="fixed top-6 right-6 flex items-center gap-2 px-5 py-2.5 bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#ddd] rounded-full text-[#333] font-bold no-underline transition-all shadow-sm z-50 text-lg hover:-translate-y-0.5 hover:shadow-md"
    >
      🏠 回閱讀大廳
    </a>
  </div>
</div>
