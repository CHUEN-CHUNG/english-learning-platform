// @ts-ignore
import { ProgressTracker } from '../../../shared/utils/ProgressTracker.js';

// 遊戲狀態
let sentences: string[] = [];
let questions: any[] = [];
let starQuestions: any[] = [];
let summaryData: any[] = [];
let currentSentenceIndex = 0;
let currentPosition = 0; // 0 到 11 (共12格)
let coins = 0;
let interactionsInParagraph = 0; // 記錄目前段落進行了幾次互動
let totalParagraphs = 0;
const TOTAL_TILES = 12;
let startTime = Date.now();

// DOM 元素
const articleContent = document.getElementById('article-content')!;
const board = document.getElementById('board')!;
const playerToken = document.getElementById('player-token')!;
const diceBtn = document.getElementById('dice-btn') as HTMLButtonElement;
const coinCount = document.getElementById('coin-count')!;

// Modal 元素
const qModal = document.getElementById('question-modal')!;
const qType = document.getElementById('q-type')!;
const qText = document.getElementById('q-text')!;
const qOptions = document.getElementById('q-options')!;
const qFeedback = document.getElementById('q-feedback')!;
const qNextBtn = document.getElementById('q-next-btn')!;
const qSkipBtn = document.getElementById('q-skip-btn')!;
const qCloseBtn = document.getElementById('q-close-btn')!;
const finishModal = document.getElementById('finish-modal')!;

// 簡單的 CSV 解析器 (處理引號內的逗號)
function parseCSVRow(str: string) {
  const result = [];
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

// 1. 載入資料 (文章與題庫)
async function loadData() {
  try {
    // 解析 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const unitParam = urlParams.get('unit') || '1';
    // 統一使用 'para' 參數，與 Matching Game 保持一致
    const paraParamRaw = urlParams.get('para') || '1';
    const paraParam = parseInt(paraParamRaw) || 1;

    const paragraphSelector = document.getElementById('paragraph-selector') as HTMLSelectElement;

    // 檢查回應是否為 HTML (避免 Vite dev server 將 404 導向 index.html)
    const isHTML = (res: Response) => res.headers.get('content-type')?.includes('text/html');

    // 載入文章 (加入時間戳避免瀏覽器快取舊資料)
    const t = new Date().getTime();
    let articleRes = await fetch(`../../content/Article/YLE-${unitParam}/YLE-${unitParam}-Article.md?t=${t}`);
    if (!articleRes.ok || isHTML(articleRes)) {
      articleRes = await fetch(`../../content/Article/YLE-${unitParam}/YLE-${unitParam}.md?t=${t}`);
    }
    if (!articleRes.ok || isHTML(articleRes)) throw new Error('Failed to load article');
    
    const articleText = await articleRes.text();
    
    // 提取標題 (Markdown 第一行的 # 標題)
    const titleMatch = articleText.match(/^#\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : `Reading Unit ${unitParam}`;
    const titleEl = document.getElementById('article-title');
    if (titleEl) titleEl.textContent = `Story: ${title}`;

    // 切分段落
    const paragraphs = articleText.split('\n\n').filter(p => p.trim().length > 0 && !p.startsWith('#'));
    totalParagraphs = paragraphs.length;
    
    // 初始化段落選單
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
      
      paragraphSelector.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        if (val === 'summary') {
          window.location.href = `?unit=${unitParam}&mode=summary`;
        } else {
          window.location.href = `?unit=${unitParam}&para=${val}`;
        }
      });
    }

    // 取得當前段落內容並切分成句子
    const paragraphIndex = paraParam - 1;
    const currentParagraphText = paragraphs[paragraphIndex >= 0 && paragraphIndex < paragraphs.length ? paragraphIndex : 0];
    
    // 新的斷句邏輯：
    // 1. 如果段落中有 '---' (分隔線)，就以 '---' 作為骰子進度的切分，並將區塊內的換行轉為 <br>
    if (currentParagraphText.includes('---')) {
      sentences = currentParagraphText.split('---').map(s => s.trim().replace(/\n/g, '<br>')).filter(s => s.length > 0);
    } 
    // 2. 如果沒有 '---' 但有手動換行 (\n)，就以換行符號作為切分依據
    else if (currentParagraphText.includes('\n')) {
      sentences = currentParagraphText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    } 
    // 3. 如果都沒有，退回原本的自動標點符號斷句
    else {
      sentences = currentParagraphText.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [currentParagraphText];
    }

    // 載入題庫 (加入時間戳避免快取)
    let qaRes = await fetch(`../../content/ReadingQA/YLE-${unitParam}-ReadingQA.csv?t=${t}`);
    if (!qaRes.ok || isHTML(qaRes)) {
      qaRes = await fetch(`../../content/ReadingQA/YLE-${unitParam}-QA.csv?t=${t}`);
    }
    if (!qaRes.ok || isHTML(qaRes)) throw new Error('Failed to load questions');
    const qaText = await qaRes.text();
    const lines = qaText.split('\n').filter(line => line.trim().length > 0);
    
    // 解析 CSV (跳過標頭)
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length >= 9) {
        // 只保留對應當前段落，或 'All' 的題目
        if (row[1] === paraParam.toString() || row[1].toLowerCase() === 'all') {
          questions.push({
            id: row[0],
            paragraph: row[1],
            type: row[2],
            text: row[3],
            options: [row[4], row[5], row[6], row[7]].filter(o => o && o !== ''), // 過濾掉空選項
            answer: row[8],
            explanation: row[9] || ''
          });
        }
      }
    }

    // 載入星星題庫 (Star QA)
    try {
      let starRes = await fetch(`../../content/ReadingQA/YLE-${unitParam}-StarQA.csv?t=${t}`);
      if (starRes.ok && !isHTML(starRes)) {
        const starText = await starRes.text();
        const starLines = starText.split('\n').filter(line => line.trim().length > 0);
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
      console.log("No star questions found for this unit.");
    }

    // 載入 Summary QA
    try {
      const summaryRes = await fetch(`../../content/ReadingQA/YLE-${unitParam}-SummaryQA.csv?t=${t}`);
      if (summaryRes.ok && !isHTML(summaryRes)) {
        const summaryText = await summaryRes.text();
        const summaryLines = summaryText.split('\n').filter(line => line.trim().length > 0);
        for (let i = 1; i < summaryLines.length; i++) {
          const row = parseCSVRow(summaryLines[i]);
          if (row.length >= 3) {
            summaryData.push({
              paragraph: parseInt(row[0]),
              summary: row[1],
              words: row[2].split(',').map(w => w.trim()).filter(w => w.length > 0)
            });
          }
        }
      }
    } catch (e) {
      console.log("No summary questions found for this unit.");
    }

    initArticle();
    initBoard();

    // 如果模式是 summary，直接開啟 summary 挑戰畫面
    const finalModeParam = urlParams.get('mode') || (urlParams.get('para') === 'summary' ? 'summary' : null);
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
    console.error("載入資料失敗:", error);
    articleContent.innerHTML = `<p style="color:red; padding: 20px;">載入失敗：<br>${error}</p>`;
  }
}

// 2. 初始化文章句子
function initArticle() {
  articleContent.innerHTML = '';
  sentences.forEach((text, index) => {
    const div = document.createElement('div');
    div.className = `sentence ${index === 0 ? 'active' : ''}`;
    div.id = `sentence-${index}`;
    div.innerHTML = text; // 改用 innerHTML 以支援 <br> 換行標籤
    articleContent.appendChild(div);
  });
}

// 3. 初始化環狀地圖 (12格)
function initBoard() {
  board.innerHTML = '<div id="player-token" class="player-token">🚶</div>';
  const radius = 150; // 軌道半徑
  const center = 150; // 中心點 (300/2)

  // 保證至少 2 個星星格 (這裡設定為 3 個以確保容易踩到)
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
    const angle = (i / TOTAL_TILES) * (2 * Math.PI) - (Math.PI / 2); // 從正上方開始
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
  
  // 重新抓取 playerToken 因為 board.innerHTML 被重置了
  const newToken = document.getElementById('player-token')!;
  updatePlayerPosition(newToken);
}

// 更新玩家棋子位置
function updatePlayerPosition(tokenElement: HTMLElement) {
  const radius = 150;
  const center = 150;
  const angle = (currentPosition / TOTAL_TILES) * (2 * Math.PI) - (Math.PI / 2);
  const x = center + radius * Math.cos(angle);
  const y = center + radius * Math.sin(angle);

  tokenElement.style.left = `${x}px`;
  tokenElement.style.top = `${y}px`;
}

// 4. 擲骰子邏輯
const diceImages = ['⚀', '⚁', '⚂']; // 骰子 1-3 點的圖片/Emoji

diceBtn.addEventListener('click', () => {
  diceBtn.disabled = true;
  
  // 產生 1~3 點
  const roll = Math.floor(Math.random() * 3) + 1;
  
  // 骰子動畫效果
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

// 移動玩家
function movePlayer(steps: number) {
  currentPosition = (currentPosition + steps) % TOTAL_TILES;
  const token = document.getElementById('player-token')!;
  updatePlayerPosition(token);

  // 等待移動動畫結束後觸發事件
  setTimeout(() => {
    triggerTileEvent();
  }, 600);
}

// 觸發格子事件
function triggerTileEvent() {
  interactionsInParagraph++; // 增加該段落的互動次數

  const tiles = document.querySelectorAll('.tile');
  const currentTile = tiles[currentPosition] as HTMLElement;
  let tileType = currentTile.dataset.type;
  
  if (tileType === 'question') {
    if (questions.length > 0) {
      showQuestion();
    } else if (starQuestions.length > 0) {
      // 如果閱讀題沒了，但還有星星題，就降級成星星題
      showStarQuestion();
    } else {
      addCoins(3);
      advanceSentence();
    }
  } else if (tileType === 'star') {
    if (starQuestions.length > 0) {
      showStarQuestion();
    } else if (questions.length > 0) {
      // 如果星星題沒了，但還有閱讀題，就轉成閱讀題
      showQuestion();
    } else {
      addCoins(3);
      advanceSentence();
    }
  } else {
    // 安全格或金幣格
    addCoins(3);
    advanceSentence();
  }
}

// 顯示星星互動題
function showStarQuestion() {
  // 循序取出第一題，並從陣列中移除 (保證不重複且照順序)
  const q = starQuestions.shift();
  if (!q) return;

  qType.textContent = 'Action Time! ⭐';
  qType.style.display = 'inline-block';
  qType.style.fontSize = '1.3rem';
  qText.textContent = q.commandEn;
  qOptions.innerHTML = '';
  qFeedback.classList.add('hidden');
  qNextBtn.classList.add('hidden');
  qSkipBtn.classList.add('hidden'); // 星星題不顯示 Skip，因為只是做動作

  // 建立「我做到了」按鈕
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
    qFeedback.textContent = "Great job! +3 Coins ⭐";
    qFeedback.className = "feedback success";
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

// 5. 顯示題目
function showQuestion() {
  // 循序取出第一題，並從陣列中移除 (保證不重複且照順序)
  const q = questions.shift();
  if (!q) return;
  
  // 一般閱讀題不顯示題型標籤
  qType.style.display = 'none';
  qText.textContent = q.text;
  qOptions.innerHTML = '';
  qFeedback.classList.add('hidden');
  qNextBtn.classList.add('hidden');
  qSkipBtn.classList.remove('hidden'); // 顯示 skip 按鈕

  q.options.forEach((opt: string) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(btn, opt === q.answer, q.explanation);
    qOptions.appendChild(btn);
  });

  qModal.classList.remove('hidden');
}

// 處理答題
function handleAnswer(btn: HTMLButtonElement, isCorrect: boolean, explanation: string) {
  // 禁用所有按鈕
  Array.from(qOptions.children).forEach(child => (child as HTMLButtonElement).disabled = true);

  qFeedback.classList.remove('hidden');
  if (isCorrect) {
    btn.classList.add('correct');
    qFeedback.textContent = "Correct! +3 Coins 🪙";
    qFeedback.className = "feedback success";
    addCoins(3);
  } else {
    btn.classList.add('wrong');
    qFeedback.textContent = `Incorrect. ${explanation}`;
    qFeedback.className = "feedback error";
  }

  qNextBtn.classList.remove('hidden');
  qSkipBtn.classList.add('hidden'); // 答題後隱藏 skip 按鈕
}

// 題目結束，進入下一句
qNextBtn.addEventListener('click', async () => {
  qModal.classList.add('hidden');
  await advanceSentence();
});

// 跳過題目或關閉對話框
async function skipQuestion() {
  qModal.classList.add('hidden');
  // 跳過不給分，但依然推進句子，且該題目並未從 questions 陣列中移除，後續仍有機會抽到
  await advanceSentence();
}

qSkipBtn.addEventListener('click', skipQuestion);
qCloseBtn.addEventListener('click', skipQuestion);

// 6. 推進文章句子
async function advanceSentence() {
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
      // 自動捲動到該句
      nextDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    diceBtn.disabled = false;
    diceBtn.textContent = '🎲';
  } else {
    // 文章讀完，顯示結束畫面
    document.getElementById('final-coins')!.textContent = coins.toString();
    
    const nextParaBtn = document.getElementById('next-para-btn');
    const summaryChallengeBtn = document.getElementById('summary-challenge-btn');
    const urlParams = new URLSearchParams(window.location.search);
    const unitParam = urlParams.get('unit') || '1';
    const unitNumber = unitParam.replace('unit', '');
    const paraParam = parseInt(urlParams.get('para') || '1');
    
    if (nextParaBtn && summaryChallengeBtn) {
      if (paraParam >= totalParagraphs) {
        nextParaBtn.style.display = 'none'; // 最後一段隱藏下一段按鈕
        if (summaryData && summaryData.length > 0) {
          summaryChallengeBtn.classList.remove('hidden');
          summaryChallengeBtn.style.display = 'inline-block';
        }
      } else {
        nextParaBtn.style.display = 'inline-block';
        summaryChallengeBtn.style.display = 'none';
      }
    }
    
    // 儲存成績到 ProgressTracker
    const duration = Math.round((Date.now() - startTime) / 1000);
    const fileLabel = `YLE-${unitNumber} (Para ${paraParam})`;
    
    await ProgressTracker.saveReadingGameResult({
      gameType: 'Reading',
      unit: unitNumber,
      file: fileLabel,
      duration: duration,
      score: coins, // Use coins as score
      total: 0,
      totalPercent: 100
    });

    finishModal.classList.remove('hidden');
  }
}

// 綁定結束彈窗按鈕事件
const nextParaBtn = document.getElementById('next-para-btn');
const backHubBtn = document.getElementById('back-hub-btn');

if (nextParaBtn) {
  nextParaBtn.addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const unitParam = urlParams.get('unit') || '1';
    const paraParam = parseInt(urlParams.get('para') || '1');
    window.location.href = `?unit=${unitParam}&para=${paraParam + 1}`;
  });
}

if (backHubBtn) {
  backHubBtn.addEventListener('click', () => {
    window.location.href = '../reading-hub/index.html';
  });
}

// 啟動遊戲
loadData();

// --- Unit Summary Challenge Logic ---
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

if (summaryChallengeBtn) {
  summaryChallengeBtn.addEventListener('click', () => {
    finishModal.classList.add('hidden');
    document.querySelector('.game-area')!.classList.add('hidden');
    initSummaryChallenge();
    summaryArea!.classList.remove('hidden');
    summaryArea!.classList.add('flex');
  });
}

function initSummaryChallenge() {
  summaryWordBank!.innerHTML = '';
  summarySentences!.innerHTML = '';
  summaryBaseWords = [];
  
  // 收集所有填空單字
  const wordsToPlace: { displayWord: string, baseWord: string, id: string }[] = [];
  let blankIndex = 0;

  summaryData.forEach((paraData, index) => {
    const div = document.createElement('div');
    div.className = 'bg-purple-50 p-4 rounded-xl';
    
    let summaryText = paraData.summary;
    paraData.words.forEach((word: string) => {
      summaryBaseWords.push(word);
      const isStart = false; // 簡化處理，不特別處理大寫
      
      const blankHtml = `<span class="summary-click-zone inline-flex items-center justify-center min-w-[80px] h-[32px] bg-white border-2 border-purple-300 rounded-lg mx-1 align-bottom cursor-pointer hover:bg-gray-100" data-index="${blankIndex}" data-baseword="${word}"></span>`;
      
      // 替換 {word} 為空格
      summaryText = summaryText.replace(`{${word}}`, blankHtml);
      
      wordsToPlace.push({
        displayWord: word,
        baseWord: word,
        id: `sum-word-${blankIndex}`
      });
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

  // 打亂單字庫
  wordsToPlace.sort(() => Math.random() - 0.5);

  wordsToPlace.forEach(item => {
    const wordEl = document.createElement('div');
    wordEl.id = item.id;
    wordEl.className = 'summary-clickable-word inline-flex items-center justify-center bg-white px-3 py-1.5 rounded-lg shadow border-2 border-purple-300 cursor-pointer text-lg font-medium text-purple-700 hover:bg-purple-50 transition-all';
    wordEl.textContent = item.displayWord;
    wordEl.dataset.originalWord = item.displayWord;
    wordEl.dataset.baseWord = item.baseWord;
    
    wordEl.addEventListener('click', handleSummaryWordClick);
    summaryWordBank!.appendChild(wordEl);
  });

  // 綁定空格點擊事件
  document.querySelectorAll('.summary-click-zone').forEach(zone => {
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
  
  wordEl.classList.remove('shadow', 'border-2', 'px-3', 'py-1.5', 'rounded-lg', 'border-purple-300', 'ring-4', 'ring-purple-500');
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

if (summarySubmitBtn) {
  summarySubmitBtn.addEventListener('click', () => {
    let score = 0;
    const total = summaryBaseWords.length;
    let allFilled = true;

    document.querySelectorAll('.summary-click-zone').forEach(zone => {
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
      summarySubmitBtn.style.display = 'none';
      summaryHubBtn!.classList.remove('hidden');
      summaryHubBtn!.style.display = 'block';
    }
  });
}

if (summaryHubBtn) {
  summaryHubBtn.addEventListener('click', () => {
    window.location.href = '../reading-hub/index.html';
  });
}
