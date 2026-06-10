// shared/game-core/GrammarScoreboard.ts
import type { GameSessionData, QuestionStat } from "./GrammarDataTracker";

interface ScoreboardOptions {
  onRestart: () => void;
  onHome: () => void;
  gameContainerId?: string; // The ID of the main game area to hide when showing the scoreboard
}

let scoreboardOptions: ScoreboardOptions;
let currentSessionData: GameSessionData | null = null;
let currentUserName: string = "";

// Inject UI elements
function injectUI() {
  if (document.getElementById("grammar-scoreboard-root")) return;

  const root = document.createElement("div");
  root.id = "grammar-scoreboard-root";
  
  // HTML Template for Result, Review, History, and FAB
  root.innerHTML = `
    <!-- Floating Action Button for Score History -->
    <button id="btn-fab-query-score" class="fixed bottom-8 right-8 w-24 h-24 md:w-28 md:h-28 bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] flex-col items-center justify-center transition-transform hover:scale-110 z-50 flex group border border-sky-300/50 backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 md:h-10 md:w-10 mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-sm md:text-lg font-bold tracking-wider text-center leading-tight drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">History<br>Score</span>
    </button>

    <!-- The overlay to hold our screens -->
    <div id="gs-overlay" class="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-40 overflow-y-auto hidden flex-col items-center py-10 px-4 md:px-10">
      
      <!-- Result Screen -->
      <div id="gs-result" class="hidden w-full max-w-3xl bg-slate-800/90 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)] border border-sky-500/30 p-8 md:p-12 text-center mt-10">
          <h2 class="text-3xl md:text-4xl font-bold mb-8 text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">🎉 Quiz Complete!</h2>
          
          <div class="bg-slate-900/80 p-6 md:p-8 rounded-2xl mb-8 text-left inline-block w-full border border-slate-700">
              <p class="text-lg md:text-xl mb-4 text-sky-200/80 border-b border-slate-700 pb-3">Player: <span id="gs-display-name" class="font-bold text-sky-100"></span></p>
              <p class="text-lg md:text-xl mb-6 text-sky-200/80 border-b border-slate-700 pb-3">Time: <span id="gs-display-time" class="font-bold text-sky-100"></span></p>
              <p class="text-xl md:text-2xl mb-4 flex justify-between font-bold text-sky-200"><span>Score:</span> <span id="gs-score-total" class="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"></span></p>
          </div>
          
          <div class="mt-8 flex flex-col md:flex-row justify-center gap-4 md:gap-6">
              <button id="gs-btn-review" class="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] md:w-auto">Review Mistakes</button>
              <button id="gs-btn-restart" class="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(14,165,233,0.4)] md:w-auto">Play Again</button>
              <button id="gs-btn-home" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-sky-100 font-bold rounded-xl transition-colors border border-sky-500/30 md:w-auto">🏠 Back to Hub</button>
          </div>
      </div>

      <!-- Review Screen -->
      <div id="gs-review" class="hidden w-full max-w-4xl bg-slate-800/90 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-amber-500/30 p-6 md:p-10 mt-10">
          <h2 class="text-2xl md:text-3xl font-bold mb-8 text-center text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">Mistake Review</h2>
          
          <div id="gs-review-content" class="bg-slate-900/80 p-2 md:p-6 rounded-lg mb-8 border border-slate-700">
              <!-- 錯題內容將動態生成 -->
          </div>
          
          <div class="text-center flex justify-center">
              <button id="gs-btn-back-to-result" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-sky-100 font-bold rounded-xl transition-colors border border-sky-500/30 md:w-auto">Back</button>
          </div>
      </div>

      <!-- History Screen -->
      <div id="gs-history" class="hidden w-full max-w-5xl bg-slate-800/90 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)] border border-sky-500/30 p-6 md:p-10 mt-10">
          <h2 class="text-2xl md:text-3xl font-bold mb-8 text-center text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">Score History</h2>
          
          <div class="mb-6 flex justify-end">
              <select id="gs-history-user-filter" class="px-4 py-2 border border-sky-500/50 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-sky-400 bg-slate-900 text-sky-100 font-bold">
                  <option value="all">All players</option>
              </select>
          </div>

          <div class="bg-slate-900/80 p-4 md:p-6 rounded-2xl shadow-inner mb-8 border border-slate-700">
              <div id="gs-history-content" class="space-y-4">
                  <!-- 歷史成績將動態生成 -->
              </div>
              <div id="gs-history-empty" class="hidden text-center text-sky-200/50 py-10 text-lg md:text-xl font-bold">
                  No quiz records yet!
              </div>
          </div>
          
          <div class="text-center flex justify-center">
              <button id="gs-btn-history-back" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-sky-100 font-bold rounded-xl transition-colors border border-sky-500/30 md:w-auto">Close</button>
          </div>
      </div>

    </div>
  `;
  document.body.appendChild(root);

  // Bind events
  document.getElementById("btn-fab-query-score")?.addEventListener("click", () => {
    showHistory();
  });

  document.getElementById("gs-btn-restart")?.addEventListener("click", () => {
    hideOverlay();
    scoreboardOptions.onRestart();
  });

  document.getElementById("gs-btn-home")?.addEventListener("click", () => {
    scoreboardOptions.onHome();
  });

  document.getElementById("gs-btn-review")?.addEventListener("click", () => {
    if (currentSessionData) {
      renderReview(currentSessionData);
      document.getElementById("gs-result")?.classList.add("hidden");
      document.getElementById("gs-history")?.classList.add("hidden");
      document.getElementById("gs-review")?.classList.remove("hidden");
      window.scrollTo(0, 0);
    }
  });

  document.getElementById("gs-btn-back-to-result")?.addEventListener("click", () => {
    document.getElementById("gs-review")?.classList.add("hidden");
    // If we came from history, we might want to go back to history. 
    // For simplicity, we just show result if currentSessionData is for the current game, else history.
    if (document.getElementById("gs-result")?.dataset.source === "history") {
        document.getElementById("gs-history")?.classList.remove("hidden");
    } else {
        document.getElementById("gs-result")?.classList.remove("hidden");
    }
    window.scrollTo(0, 0);
  });

  document.getElementById("gs-btn-history-back")?.addEventListener("click", () => {
    document.getElementById("gs-history")?.classList.add("hidden");
    if (currentSessionData) {
        document.getElementById("gs-result")?.classList.remove("hidden");
    } else {
        hideOverlay();
    }
  });

  document.getElementById("gs-history-user-filter")?.addEventListener("change", () => {
    renderHistoryContent();
  });
}

function hideOverlay() {
  document.getElementById("gs-overlay")?.classList.add("hidden");
  document.getElementById("gs-result")?.classList.add("hidden");
  document.getElementById("gs-review")?.classList.add("hidden");
  document.getElementById("gs-history")?.classList.add("hidden");
  document.getElementById("gs-result")!.dataset.source = "";
  
  if (scoreboardOptions.gameContainerId) {
      document.getElementById(scoreboardOptions.gameContainerId)?.classList.remove("hidden");
  }
}

function showOverlay() {
  document.getElementById("gs-overlay")?.classList.remove("hidden");
  document.getElementById("gs-overlay")?.classList.add("flex");
  
  if (scoreboardOptions.gameContainerId) {
      document.getElementById(scoreboardOptions.gameContainerId)?.classList.add("hidden");
  }
}

export function initScoreboard(options: ScoreboardOptions) {
  scoreboardOptions = options;
  injectUI();
}

export function showResult(sessionData: GameSessionData, userName: string) {
  currentSessionData = sessionData;
  currentUserName = userName;

  document.getElementById("gs-display-name")!.textContent = userName;
  
  const minutes = Math.floor(sessionData.duration / 60);
  const seconds = sessionData.duration % 60;
  document.getElementById("gs-display-time")!.textContent = `${minutes} min ${seconds} sec`;
  
  const percent = Math.round((sessionData.score / sessionData.totalQuestions) * 100) || 0;
  document.getElementById("gs-score-total")!.textContent = `${sessionData.score} / ${sessionData.totalQuestions} (${percent}%)`;

  document.getElementById("gs-result")!.dataset.source = "result";

  showOverlay();
  document.getElementById("gs-result")?.classList.remove("hidden");
  document.getElementById("gs-review")?.classList.add("hidden");
  document.getElementById("gs-history")?.classList.add("hidden");
  window.scrollTo(0, 0);
}

export function showHistory() {
  showOverlay();
  document.getElementById("gs-result")?.classList.add("hidden");
  document.getElementById("gs-review")?.classList.add("hidden");
  document.getElementById("gs-history")?.classList.remove("hidden");
  
  updateHistoryFilterOptions();
  renderHistoryContent();
  window.scrollTo(0, 0);
}

function updateHistoryFilterOptions() {
  const allData = JSON.parse(localStorage.getItem("grammar_platform_data") || "{}");
  const filterSelect = document.getElementById("gs-history-user-filter") as HTMLSelectElement;
  if (!filterSelect) return;
  
  const currentValue = filterSelect.value;
  filterSelect.innerHTML = '<option value="all">All players</option>';
  
  const uniqueUsers = Object.keys(allData);
  uniqueUsers.forEach(u => {
      const option = document.createElement("option");
      option.value = u;
      option.textContent = u;
      filterSelect.appendChild(option);
  });
  
  if (currentValue && (currentValue === "all" || uniqueUsers.includes(currentValue))) {
      filterSelect.value = currentValue;
  }
}

function renderHistoryContent() {
  const allData = JSON.parse(localStorage.getItem("grammar_platform_data") || "{}");
  const filterSelect = document.getElementById("gs-history-user-filter") as HTMLSelectElement;
  const selectedUser = filterSelect?.value || "all";
  
  let historyList: any[] = [];
  
  if (selectedUser === "all") {
      for (const [user, data] of Object.entries(allData)) {
          const uData = data as any;
          if (uData.history) {
              uData.history.forEach((record: any, index: number) => {
                  historyList.push({ userName: user, originalIndex: index, ...record });
              });
          }
      }
      // Sort by date (we assume date format is parsable or just fallback to string sort which might not be perfect, but date is "MM/DD/YYYY, HH:MM:SS" from toLocaleString)
      // Actually, standard string sort on "zh-TW" might be buggy, let's reverse array as heuristic since we unshift
      historyList.reverse(); 
  } else {
      if (allData[selectedUser] && allData[selectedUser].history) {
          historyList = allData[selectedUser].history.map((record: any, index: number) => ({
              userName: selectedUser,
              originalIndex: index,
              ...record
          }));
      }
  }

  const historyContent = document.getElementById("gs-history-content")!;
  const historyEmpty = document.getElementById("gs-history-empty")!;

  if (historyList.length === 0) {
      historyContent.innerHTML = "";
      historyEmpty.classList.remove("hidden");
  } else {
      historyEmpty.classList.add("hidden");
      let html = "";
      historyList.forEach((record) => {
          const percent = Math.round((record.score / record.totalQuestions) * 100) || 0;
          const isGood = percent >= 80;
          const isWarn = percent >= 60 && percent < 80;
          const scoreColor = isGood ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : (isWarn ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]');

          const minutes = Math.floor(record.duration / 60);
          const seconds = record.duration % 60;
          
          html += `
              <div class="p-4 bg-slate-800/80 border border-sky-500/30 rounded-xl shadow-sm hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] transition">
                  <div class="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                      <div class="flex items-center gap-2">
                          <span class="font-bold text-sky-300 text-lg">${record.userName}</span>
                          <span class="bg-sky-900/50 text-sky-200 border border-sky-500/30 text-xs px-2 py-1 rounded-md font-bold">${record.gameType}</span>
                      </div>
                      <span class="text-xs text-sky-200/50">${record.date}</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-sky-100">
                      <div><span class="font-bold text-sky-200/70">Unit:</span> ${record.unit.replace(/-/g, ' ')}</div>
                      <div><span class="font-bold text-sky-200/70">Time:</span> ${minutes} min ${seconds} sec</div>
                      <div class="col-span-1 md:col-span-2 mt-1">
                          <div class="flex justify-between items-center bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                              <span class="font-bold text-sky-200 text-lg">Score</span>
                              <span class="text-xl font-bold ${scoreColor}">
                                  ${record.score} / ${record.totalQuestions} (${percent}%)
                              </span>
                          </div>
                      </div>
                  </div>
                  ${record.stats && record.stats.length > 0 ? `
                  <div class="mt-4 text-right">
                      <button onclick="window.grammarShowHistoryReview('${record.userName}', ${record.originalIndex})" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_10px_rgba(245,158,11,0.4)]">Review mistakes</button>
                  </div>
                  ` : ''}
              </div>
          `;
      });
      historyContent.innerHTML = html;
  }
}

// Make it global so the inline onclick works
(window as any).grammarShowHistoryReview = function(targetUser: string, idx: number) {
  const allData = JSON.parse(localStorage.getItem("grammar_platform_data") || "{}");
  if (!allData[targetUser] || !allData[targetUser].history) return;
  
  const record = allData[targetUser].history[idx];
  if (!record || !record.stats) return;

  renderReview(record);
  document.getElementById("gs-result")!.dataset.source = "history";
  document.getElementById("gs-history")?.classList.add("hidden");
  document.getElementById("gs-result")?.classList.add("hidden");
  document.getElementById("gs-review")?.classList.remove("hidden");
  window.scrollTo(0, 0);
};

function renderReview(sessionData: GameSessionData) {
  const reviewContent = document.getElementById("gs-review-content")!;
  let html = "";
  
  sessionData.stats.forEach((stat: QuestionStat, i: number) => {
      const colorClass = stat.isCorrect ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-red-900/30 border-red-500/50';
      const textClass = stat.isCorrect ? 'text-emerald-400' : 'text-red-400';
      const timeStr = stat.timeMs ? (stat.timeMs / 1000).toFixed(1) + 's' : '--';
      
      let detailsHtml = "";
      if (sessionData.gameType === "MultipleChoice") {
          detailsHtml = `
              <p class="text-lg mb-2"><span class="font-bold text-sky-200/70">Question:</span> <span class="text-sky-100">${stat.text || "No record"}</span></p>
              ${!stat.isCorrect ? `<p class="text-md text-red-400 mt-2 font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">❌ Wrong option tapped (${stat.wrongClicks || 0} miss${(stat.wrongClicks || 0) === 1 ? "" : "es"})</p>` : `<p class="text-md text-emerald-400 mt-2 font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">✅ Correct!</p>`}
          `;
      } else if (sessionData.gameType === "Unscramble") {
          detailsHtml = `
              <p class="text-lg mb-2"><span class="font-bold text-sky-200/70">Answer:</span> <span class="text-sky-100">${stat.targetSentence || "No record"}</span></p>
              ${!stat.isCorrect ? `<p class="text-md text-red-400 mt-2 font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">❌ Wrong order (${stat.wrongSubmits || 0} wrong submit${(stat.wrongSubmits || 0) === 1 ? "" : "s"})</p>` : `<p class="text-md text-emerald-400 mt-2 font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">✅ Built correctly!</p>`}
          `;
      } else {
          detailsHtml = `
              <p class="text-lg mb-2"><span class="font-bold text-sky-200/70">Content:</span> <span class="text-sky-100">${stat.targetSentence || stat.text || "No record"}</span></p>
              ${!stat.isCorrect ? `<p class="text-md text-red-400 mt-2 font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">❌ Incorrect</p>` : `<p class="text-md text-emerald-400 mt-2 font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">✅ Correct!</p>`}
          `;
      }

      html += `
          <div class="mb-4 p-4 md:p-6 rounded-xl border-2 ${colorClass} relative shadow-[0_0_15px_rgba(0,0,0,0.3)]">
              <span class="absolute top-4 right-4 text-xs md:text-sm bg-slate-800 px-2 py-1 rounded shadow-sm text-sky-200/70 border border-slate-600">⏱️ ${timeStr}</span>
              <div class="flex items-start gap-2 mb-2 pr-16">
                  <span class="font-bold text-sky-300 text-lg drop-shadow-[0_0_5px_rgba(125,211,252,0.5)]">Q${i+1}.</span>
                  <span class="bg-slate-800 text-sky-200/80 text-xs px-2 py-1 rounded font-bold border border-slate-600">${stat.grammarPoint.replace(/_/g, ' ')}</span>
              </div>
              ${detailsHtml}
          </div>
      `;
  });
  
  reviewContent.innerHTML = html;
}
