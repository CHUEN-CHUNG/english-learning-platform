import { loadCorrectionQuestions } from './question-banks';
import { BugQuestion, BugData } from './types';

// Game Constants
const INITIAL_HP = 3;
const TIME_LIMIT_MS = 25000;
const COMBO_MULTIPLIER = 10;
const BASE_SCORE = 100;

// State
let questions: BugQuestion[] = [];
let currentIndex = 0;
let hp = INITIAL_HP;
let score = 0;
let combo = 0;
let currentBug: BugData | null = null;
let currentQuestion: BugQuestion | null = null;
let isQuestionActive = false;

// Timer State
let timerInterval: number;
let timeRemainingMs = TIME_LIMIT_MS;
let lastTickTime = 0;

// DOM Elements
const hpDisplay = document.getElementById('hp-display') as HTMLDivElement;
const scoreDisplay = document.getElementById('score-display') as HTMLSpanElement;
const comboDisplay = document.getElementById('combo-display') as HTMLDivElement;
const comboCount = document.getElementById('combo-count') as HTMLSpanElement;
const timeBar = document.getElementById('time-bar') as HTMLDivElement;
const timeText = document.getElementById('time-text') as HTMLSpanElement;
const sentenceContainer = document.getElementById('sentence-container') as HTMLDivElement;
const correctionPanel = document.getElementById('correction-panel') as HTMLDivElement;
const optionsContainer = document.getElementById('options-container') as HTMLDivElement;
const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
const modalDesc = document.getElementById('modal-desc') as HTMLParagraphElement;
const modalIcon = document.getElementById('modal-icon') as HTMLDivElement;
const btnModalAction = document.getElementById('btn-modal-action') as HTMLButtonElement;
const feedbackMsg = document.getElementById('feedback-msg') as HTMLDivElement;
const btnBack = document.getElementById('btn-back') as HTMLButtonElement;

btnBack.addEventListener('click', () => {
    window.location.href = '../../../grammar-hub/index.html';
});

async function initGame() {
    // Determine topic from URL if any
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || '';

    questions = await loadCorrectionQuestions(topic);
    
    if (questions.length === 0) {
        sentenceContainer.innerHTML = '<span class="text-slate-500">找不到題庫，請確認 JSON 檔案是否存在。</span>';
        return;
    }

    hp = INITIAL_HP;
    score = 0;
    combo = 0;
    currentIndex = 0;
    
    updateHeader();
    loadQuestion(questions[currentIndex]);
}

function updateHeader() {
    hpDisplay.innerHTML = '❤️'.repeat(hp) + '🤍'.repeat(INITIAL_HP - hp);
    scoreDisplay.innerText = score.toString();
    
    if (combo >= 2) {
        comboDisplay.classList.remove('hidden');
        comboCount.innerText = combo.toString();
        comboDisplay.classList.add('animate-bounce');
        setTimeout(() => comboDisplay.classList.remove('animate-bounce'), 500);
    } else {
        comboDisplay.classList.add('hidden');
    }
}

function loadQuestion(q: BugQuestion) {
    currentQuestion = q;
    isQuestionActive = true;
    currentBug = q.bugs[0]; // Currently supporting 1 bug per question for MVP
    
    // Hide panel
    hideCorrectionPanel();
    
    // Render sentence
    sentenceContainer.innerHTML = '';
    q.tokens.forEach((tokenText, index) => {
        const span = document.createElement('span');
        span.className = 'token shadow-sm bg-white border border-slate-200';
        span.innerText = tokenText;
        span.dataset.index = index.toString();
        
        span.addEventListener('click', () => handleTokenClick(index, span));
        sentenceContainer.appendChild(span);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timeRemainingMs = TIME_LIMIT_MS;
    lastTickTime = performance.now();
    updateTimeUI();

    timerInterval = window.setInterval(() => {
        if (!isQuestionActive) {
            clearInterval(timerInterval);
            return;
        }

        const now = performance.now();
        const delta = now - lastTickTime;
        lastTickTime = now;
        timeRemainingMs -= delta;

        if (timeRemainingMs <= 0) {
            timeRemainingMs = 0;
            handleTimeout();
        }
        updateTimeUI();
    }, 50);
}

function updateTimeUI() {
    const percentage = Math.max(0, (timeRemainingMs / TIME_LIMIT_MS) * 100);
    timeBar.style.width = `${percentage}%`;
    timeText.innerText = `${Math.ceil(timeRemainingMs / 1000)}s`;

    if (percentage < 25) {
        timeBar.classList.replace('bg-blue-500', 'bg-red-500');
    } else if (percentage < 50) {
        timeBar.classList.replace('bg-blue-500', 'bg-orange-500');
    } else {
        timeBar.classList.replace('bg-red-500', 'bg-blue-500');
        timeBar.classList.replace('bg-orange-500', 'bg-blue-500');
    }
}

function handleTokenClick(index: number, tokenElement: HTMLSpanElement) {
    if (!isQuestionActive || !currentBug) return;

    const allTokens = sentenceContainer.querySelectorAll('.token');
    allTokens.forEach(el => el.classList.remove('selected'));
    
    if (index === currentBug.target_index) {
        // Hit!
        tokenElement.classList.add('selected');
        tokenElement.classList.add('ring-4', 'ring-blue-300');
        showFeedback('Caught a Bug! 🐛', 'text-blue-500');
        showCorrectionPanel();
    } else {
        // Miss!
        tokenElement.classList.add('miss');
        combo = 0;
        takeDamage();
        showFeedback('Miss! ❌', 'text-red-500');
        updateHeader();
        
        setTimeout(() => {
            tokenElement.classList.remove('miss');
        }, 500);
    }
}

function showCorrectionPanel() {
    if (!currentBug) return;
    
    optionsContainer.innerHTML = '';
    
    // Randomize options
    const shuffledOptions = [...currentBug.options].sort(() => Math.random() - 0.5);
    
    shuffledOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'bg-slate-100 hover:bg-slate-200 font-bold py-4 px-4 rounded-xl text-lg text-slate-700 transition transform hover:scale-[1.02] shadow-sm border border-slate-200';
        btn.innerText = opt;
        btn.addEventListener('click', () => handleOptionSelect(opt));
        optionsContainer.appendChild(btn);
    });

    correctionPanel.classList.remove('translate-y-full');
}

function hideCorrectionPanel() {
    correctionPanel.classList.add('translate-y-full');
}

function handleOptionSelect(selectedOption: string) {
    if (!currentBug || !isQuestionActive) return;
    
    isQuestionActive = false;
    clearInterval(timerInterval);
    hideCorrectionPanel();

    const selectedTokenElement = sentenceContainer.querySelector('.token.selected') as HTMLSpanElement;

    if (selectedOption === currentBug.correct_word) {
        // Correct Correction!
        score += BASE_SCORE + (combo * COMBO_MULTIPLIER);
        combo++;
        updateHeader();
        
        if (selectedTokenElement) {
            selectedTokenElement.classList.replace('bg-blue-500', 'bg-green-500');
            selectedTokenElement.classList.add('correct-hit');
            if (currentBug.correct_word === "") {
                selectedTokenElement.innerText = "❌ (刪除)";
                selectedTokenElement.classList.add('line-through', 'text-slate-400', 'bg-slate-100');
            } else {
                selectedTokenElement.innerText = currentBug.correct_word;
            }
        }
        
        showFeedback('Perfect! ✨', 'text-green-500');
        
        // Brief pause, then next question
        setTimeout(() => {
            nextQuestion();
        }, 1200);

    } else {
        // Wrong Correction
        combo = 0;
        takeDamage();
        updateHeader();
        
        if (selectedTokenElement) {
            selectedTokenElement.classList.replace('bg-blue-500', 'bg-red-500');
            selectedTokenElement.classList.add('miss');
        }

        showExplanationModal(false);
    }
}

function takeDamage() {
    hp--;
    // Screen shake effect
    document.body.classList.add('animate-[shake_0.4s_ease]');
    setTimeout(() => document.body.classList.remove('animate-[shake_0.4s_ease]'), 400);

    if (hp <= 0) {
        isQuestionActive = false;
        clearInterval(timerInterval);
        setTimeout(showGameOver, 500);
    }
}

function handleTimeout() {
    isQuestionActive = false;
    clearInterval(timerInterval);
    combo = 0;
    takeDamage();
    updateHeader();
    hideCorrectionPanel();
    
    if (hp > 0) {
        showExplanationModal(true);
    }
}

function showFeedback(text: string, colorClass: string) {
    feedbackMsg.innerText = text;
    feedbackMsg.className = `absolute top-1/4 left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl font-black drop-shadow-lg transition-all duration-300 pointer-events-none z-20 ${colorClass}`;
    feedbackMsg.style.opacity = '1';
    feedbackMsg.style.transform = 'translate(-50%, -20px) scale(1.1)';
    
    setTimeout(() => {
        feedbackMsg.style.opacity = '0';
        feedbackMsg.style.transform = 'translate(-50%, 0) scale(1)';
    }, 1000);
}

function showExplanationModal(isTimeout: boolean) {
    modalOverlay.classList.remove('hidden-panel');
    
    if (isTimeout) {
        modalIcon.innerText = '⏰';
        modalTitle.innerText = '時間到！';
        modalTitle.className = 'text-2xl font-black text-center text-orange-500 mb-2';
    } else {
        modalIcon.innerText = '💥';
        modalTitle.innerText = '改錯了！';
        modalTitle.className = 'text-2xl font-black text-center text-red-500 mb-2';
    }

    if (currentBug) {
        modalDesc.innerHTML = `<span class="block mb-4 text-slate-700 font-bold bg-slate-100 p-3 rounded-xl border border-slate-200">${currentBug.explanation}</span>`;
    }

    btnModalAction.innerText = '繼續挑戰';
    btnModalAction.onclick = () => {
        modalOverlay.classList.add('hidden-panel');
        nextQuestion();
    };
}

function showGameOver() {
    modalOverlay.classList.remove('hidden-panel');
    modalIcon.innerText = '💀';
    modalTitle.innerText = 'Game Over';
    modalTitle.className = 'text-3xl font-black text-center text-red-600 mb-2';
    
    modalDesc.innerHTML = `
        <span class="block text-2xl font-black text-slate-700 mb-2">最終分數: <span class="text-blue-600">${score}</span></span>
        快回去複習文法再來挑戰吧！
    `;

    btnModalAction.innerText = '重新開始';
    btnModalAction.onclick = () => {
        modalOverlay.classList.add('hidden-panel');
        initGame();
    };
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) {
        // Win!
        modalOverlay.classList.remove('hidden-panel');
        modalIcon.innerText = '🏆';
        modalTitle.innerText = '恭喜通關！';
        modalTitle.className = 'text-3xl font-black text-center text-green-600 mb-2';
        
        modalDesc.innerHTML = `
            <span class="block text-2xl font-black text-slate-700 mb-2">最終分數: <span class="text-blue-600">${score}</span></span>
            你抓到了所有的文法蟲！
        `;

        btnModalAction.innerText = '再玩一次';
        btnModalAction.onclick = () => {
            modalOverlay.classList.add('hidden-panel');
            initGame();
        };
        return;
    }
    
    loadQuestion(questions[currentIndex]);
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});