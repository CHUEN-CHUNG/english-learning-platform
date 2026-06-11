<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { GrammarDataTracker } from '$lib/game-core/GrammarDataTracker';
  import { CASES, type CaseData, type Tense } from '$lib/game-core/dialogue-roleplay-cases';
  import { playEnterGameSfx } from '$lib/utils/audio';
  import { speakEnglish } from '$lib/utils/english-tts';
  import { user } from '$lib/stores/user.svelte';
  import Scoreboard from '$lib/components/game/Scoreboard.svelte';
  import TeacherDashboard from '$lib/components/game/TeacherDashboard.svelte';
  import '$lib/styles/dialogue-roleplay.scss';

  const HUB_RETURN = `${base}/grammar-hub`;
  const tracker = new GrammarDataTracker('Dialogue Roleplay');

  let userName = $state('');
  let score = $state(0);
  let titleClickCount = $state(0);

  function bgmUrl(u: string): string {
    return `${base}/audio/dialogue/${u.split('/').pop()}`;
  }

  function goHome() {
    void goto(HUB_RETURN);
  }
  let restartFn: () => void = () => {};

  onMount(() => {
    user.init();
    if (!user.current) {
      alert('Please log in from the Grammar Hub first!');
      void goto(HUB_RETURN);
      return;
    }
    userName = user.current;
    tracker.setUserName(userName);

    // ── DOM refs ──
    const menuScreen = document.getElementById('menu-screen')!;
    const introScreen = document.getElementById('intro-screen')!;
    const phase1Screen = document.getElementById('phase1-screen')!;
    const transitionScreen = document.getElementById('transition-screen')!;
    const transitionText = document.getElementById('transition-text')!;
    const btnProceedPhase2 = document.getElementById('btn-proceed-phase2')!;
    const phase2Screen = document.getElementById('phase2-screen')!;
    const successModal = document.getElementById('success-modal')!;
    const modalStampContainer = document.getElementById('modal-stamp-container')!;
    const caseList = document.getElementById('case-list')!;
    const introText = document.getElementById('intro-text')!;
    const btnStartInvestigation = document.getElementById('btn-start-investigation')!;
    const taskPrompt = document.getElementById('task-prompt')!;
    const subStepHint = document.getElementById('sub-step-hint')!;
    const verbHintsArea = document.getElementById('verb-hints')!;
    const userInput = document.getElementById('user-input') as HTMLInputElement;
    const npcDialogue = document.querySelector('#npc-dialogue p') as HTMLElement;

    // ── State ──
    const cases = CASES;
    let currentCase: CaseData | null = null;
    let currentTenseIndex = 0;
    let currentStep: 'verb' | 'time' = 'verb';
    let isTransitioning = false;
    let screenHistory: HTMLElement[] = [];
    let bgm: HTMLAudioElement | null = null;
    let answered_verb_forms: string[] = [];
    let answered_time_forms: string[] = [];
    let currentQuestionMistakes = 0;
    let pendingCase: CaseData | null = null;
    let reportInputs: { inputs: HTMLInputElement[]; targets: string[]; is_dual_form: boolean }[] = [];

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => { timeouts.push(setTimeout(fn, ms)); };

    function setScore(v: number) { score = v; }

    function normalizeString(str: string) { return str.replace(/\s+/g, ' ').trim(); }

    function playTTS(text: string = npcDialogue.innerText) {
      if (!('speechSynthesis' in window)) {
        alert('Your browser does not support text-to-speech.');
        return;
      }
      speakEnglish(text, { rate: 0.95 });
    }

    function navigateTo(screenEl: HTMLElement, isBack = false) {
      menuScreen.style.display = 'none';
      introScreen.style.display = 'none';
      phase1Screen.style.display = 'none';
      transitionScreen.style.display = 'none';
      phase2Screen.style.display = 'none';

      screenEl.style.display = 'block';
      if (screenEl === introScreen || screenEl === transitionScreen) screenEl.style.display = 'flex';

      if (!isBack) screenHistory.push(screenEl);

      const btnGoBack = document.getElementById('btn-go-back')!;
      const btnMenu = document.getElementById('btn-menu')!;
      if (screenHistory.length > 1 && screenEl !== menuScreen) {
        btnGoBack.style.display = 'inline-block';
        btnMenu.style.display = 'inline-block';
      } else {
        btnGoBack.style.display = 'none';
        btnMenu.style.display = 'none';
      }
    }

    function goBack() {
      if (screenHistory.length > 1) {
        screenHistory.pop();
        navigateTo(screenHistory[screenHistory.length - 1], true);
      }
    }

    function goMenu() {
      screenHistory = [];
      if (bgm) { bgm.pause(); bgm.currentTime = 0; }
      renderMenu();
    }

    function renderMenu() {
      screenHistory = [];
      navigateTo(menuScreen);
      caseList.innerHTML = '';
      cases.forEach((caseData) => {
        const btn = document.createElement('button');
        btn.className = 'px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md';
        btn.style.margin = '10px';
        btn.innerText = `[${caseData.Mode}] Case ${caseData.Case_ID}`;
        btn.addEventListener('click', () => promptNameForCase(caseData));
        caseList.appendChild(btn);
      });
    }

    function promptNameForCase(caseData: CaseData) {
      pendingCase = caseData;
      tracker.setUnitName('Dialogue Roleplay - Case ' + pendingCase.Case_ID);
      startIntro(pendingCase);
    }

    function startIntro(caseData: CaseData) {
      tracker.startGame();
      currentCase = caseData;
      currentTenseIndex = 0;
      currentStep = 'verb';
      isTransitioning = false;
      answered_verb_forms = [];
      answered_time_forms = [];

      if (bgm) bgm.pause();
      bgm = new Audio(bgmUrl(caseData.BGM_URL));
      bgm.loop = true;
      bgm.volume = 0.2;
      bgm.play().catch(() => {});

      navigateTo(introScreen);
      introText.innerText = '';
      btnStartInvestigation.style.display = 'none';
      document.getElementById('suspect-profile')!.style.display = 'none';

      const text = caseData.Intro_Story;
      let i = 0;
      const speed = 30;
      npcDialogue.innerText = 'I am ready for your questions. (Waiting...)';

      const typeWriter = () => {
        if (i < text.length) {
          introText.innerHTML += text.charAt(i);
          i++;
          later(typeWriter, speed);
        } else {
          (document.getElementById('intro-silhouette') as HTMLImageElement).src = caseData.Image_URL;
          (document.querySelector('#intro-pronoun span') as HTMLElement).innerText = caseData.Pronoun;
          document.getElementById('suspect-profile')!.style.display = 'block';
          btnStartInvestigation.style.display = 'inline-block';
        }
      };
      typeWriter();
    }

    function enterPhase1() {
      playEnterGameSfx();
      navigateTo(phase1Screen);
      (document.getElementById('npc-image') as HTMLImageElement).src = currentCase!.Image_URL;
      renderPhase1Step();
    }

    function renderPhase1Step() {
      const currentTense = currentCase!.tenses[currentTenseIndex];

      if (currentStep === 'verb') {
        currentQuestionMistakes = 0;
        tracker.startQuestion(currentTense.name, currentTense.statement, currentTense.is_dual_form);
      }

      for (let i = 1; i <= 4; i++) {
        const node = document.getElementById(`tense-${i}`)!;
        node.className = 'tense-node' + (i === currentTenseIndex + 1 ? ' active' : '');
        const tenseName = currentCase!.tenses[i - 1].name;
        const isLocked = i > currentTenseIndex ? '🔒' : '✅';
        node.innerText = `${i}. ${tenseName} ${isLocked}`;
      }

      taskPrompt.innerText = `Task: Investigate clues for the ${currentTense.name} tense`;
      userInput.value = '';
      userInput.focus();

      verbHintsArea.innerHTML = '';
      let choices: string[] = [];
      if (currentStep === 'verb') {
        choices = currentTense.verb_choices.map((c) => c.verb);
      } else {
        choices = [...currentTense.time_choices];
      }
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      choices.forEach((text) => {
        const hint = document.createElement('div');
        hint.className = 'hint-card';
        hint.innerText = text;
        verbHintsArea.appendChild(hint);
      });

      const clueContainer = document.getElementById('clue-container')!;
      const clueText = document.getElementById('clue-text')!;

      if (currentStep === 'verb') {
        clueContainer.style.display = 'none';
        clueContainer.classList.remove('stamp-animation');
        subStepHint.innerText = `[Step 1] Ask about the 'Action'. Use the verbs above to type a complete question.`;
        if (!npcDialogue.innerText.startsWith('No,') && !npcDialogue.innerText.startsWith('Yes,')) {
          const text = 'I am ready for your questions.';
          npcDialogue.innerText = text + ' (Waiting...)';
          playTTS(text);
        }
      } else if (currentStep === 'time') {
        subStepHint.innerText = `[Step 2] Ask about the 'Time/Frequency'. Use the hints and clues above to type a complete question.`;
        clueContainer.style.display = 'inline-block';
        clueText.innerText = currentTense.object_clue;
        clueContainer.classList.remove('stamp-animation');
        void clueContainer.offsetWidth;
        clueContainer.classList.add('stamp-animation');
      }
    }

    function checkAnswer() {
      if (isTransitioning) return;
      const currentTense = currentCase!.tenses[currentTenseIndex];
      const userText = normalizeString(userInput.value);

      if (currentStep === 'verb') {
        let matchedChoice: Tense['verb_choices'][number] | null = null;
        let matchedQuestion: string | null = null;

        if (currentTense.is_dual_form) {
          currentTense.verb_choices.forEach((c) => {
            c.questions?.forEach((q) => {
              if (normalizeString(q) === userText) { matchedChoice = c; matchedQuestion = normalizeString(q); }
            });
          });
        } else {
          matchedChoice = currentTense.verb_choices.find((c) => normalizeString(c.question ?? '') === userText) ?? null;
        }

        if (matchedChoice) {
          const choice = matchedChoice as Tense['verb_choices'][number];
          if (choice.isCorrect) {
            if (currentTense.is_dual_form) {
              if (matchedQuestion && !answered_verb_forms.includes(matchedQuestion)) answered_verb_forms.push(matchedQuestion);
              if (answered_verb_forms.length < 2) {
                const reply = "Good! Now ask me the same question using another future form ('will' or 'be going to').";
                npcDialogue.innerText = reply;
                playTTS(reply);
                userInput.value = '';
                return;
              }
              answered_verb_forms = [];
            }
            npcDialogue.innerText = choice.npcReply;
            playTTS(choice.npcReply);
            setScore(score + 10);
            currentStep = 'time';
            userInput.value = '';
            renderPhase1Step();
          } else {
            currentQuestionMistakes++;
            tracker.updateCurrentQuestionStat({ wrongSubmits: currentQuestionMistakes });
            npcDialogue.innerText = choice.npcReply;
            playTTS(choice.npcReply);
            userInput.value = '';
            verbHintsArea.querySelectorAll('.hint-card').forEach((card) => {
              if ((card as HTMLElement).innerText === choice.verb) card.remove();
            });
          }
        } else {
          currentQuestionMistakes++;
          tracker.updateCurrentQuestionStat({ wrongSubmits: currentQuestionMistakes });
          npcDialogue.innerText = "I don't understand your question. Try again.";
          playTTS("I don't understand your question. Try again.");
        }
      } else {
        let isCorrectTime = false;
        const matchedTimeQuestion = userText;

        if (currentTense.is_dual_form) {
          if (currentTense.correct_time_questions!.map((q) => normalizeString(q)).includes(userText)) isCorrectTime = true;
        } else if (userText === normalizeString(currentTense.time_target)) {
          isCorrectTime = true;
        }

        if (isCorrectTime) {
          if (currentTense.is_dual_form) {
            if (!answered_time_forms.includes(matchedTimeQuestion)) answered_time_forms.push(matchedTimeQuestion);
            if (answered_time_forms.length < 2) {
              const reply = 'Yes! Now ask the same question using the other future form.';
              npcDialogue.innerText = reply;
              playTTS(reply);
              userInput.value = '';
              return;
            }
            answered_time_forms = [];
          }

          isTransitioning = true;
          userInput.value = '';
          const npcResponse = 'Yes, exactly at that time.';
          npcDialogue.innerText = npcResponse;
          playTTS(npcResponse);
          setScore(score + 10);
          tracker.endQuestion(true);

          later(() => {
            isTransitioning = false;
            currentTenseIndex++;
            if (currentTenseIndex >= currentCase!.tenses.length) {
              showTransition();
            } else {
              currentStep = 'verb';
              npcDialogue.innerText = 'I am ready for your questions. (Waiting...)';
              renderPhase1Step();
            }
          }, 1500);
        } else {
          const objectClue = normalizeString(currentTense.object_clue);
          const correctTimeHint = normalizeString(currentTense.time_choices[0]);
          currentQuestionMistakes++;
          tracker.updateCurrentQuestionStat({ wrongSubmits: currentQuestionMistakes });

          if (!userText.includes(objectClue)) {
            npcDialogue.innerText = `Wait, you forgot to mention the clue: ${currentTense.object_clue}!`;
            playTTS('Wait, you forgot to mention the clue.');
          } else if (userText.includes(correctTimeHint)) {
            npcDialogue.innerText = 'The time is right, but your sentence structure is wrong. Check your grammar!';
            playTTS('The time is right, but your sentence structure is wrong.');
          } else {
            npcDialogue.innerText = "No, that's not the right time.";
            playTTS("No, that's not the right time.");
            userInput.value = '';
            verbHintsArea.querySelectorAll('.hint-card').forEach((card) => {
              const cardText = normalizeString((card as HTMLElement).innerText);
              if (userText.includes(cardText) && cardText !== correctTimeHint) card.remove();
            });
          }
        }
      }
    }

    function showTransition() {
      navigateTo(transitionScreen);
      transitionText.innerText = '';
      btnProceedPhase2.style.display = 'none';

      if (bgm) bgm.pause();
      bgm = new Audio(bgmUrl(currentCase!.Phase2_BGM_URL));
      bgm.loop = true;
      bgm.volume = 0.2;
      bgm.play().catch(() => {});

      const text = currentCase!.Mode === 'Detective'
        ? 'All clues have been collected! Please summarize the clues into a complete report and give it to the police to arrest the suspect.'
        : 'All clues have been collected! Please summarize the clues into a complete scientific report to publish your news.';

      let i = 0;
      const speed = 30;
      const typeWriter = () => {
        if (i < text.length) {
          transitionText.innerHTML += text.charAt(i);
          i++;
          later(typeWriter, speed);
        } else {
          btnProceedPhase2.style.display = 'inline-block';
        }
      };
      typeWriter();
    }

    function enterPhase2() {
      if (screenHistory.length === 0 || screenHistory[screenHistory.length - 1] !== phase2Screen) {
        navigateTo(phase2Screen);
      }

      if (!bgm || bgm.paused) {
        if (bgm) bgm.pause();
        bgm = new Audio(bgmUrl(currentCase!.Phase2_BGM_URL));
        bgm.loop = true;
        bgm.volume = 0.2;
        bgm.play().catch(() => {});
      }

      const reportContent = document.getElementById('report-content')!;
      reportContent.innerHTML = '';
      reportInputs = [];

      currentCase!.tenses.forEach((tense, index) => {
        const row = document.createElement('div');
        row.className = 'report-row';

        const label = document.createElement('div');
        label.className = 'tense-label';
        label.innerText = `[ Clue ${index + 1}: ${tense.name} ]`;

        const correctVerb = tense.verb_choices.find((c) => c.isCorrect)!.verb;
        const correctTime = tense.time_choices[0];
        const objectClue = tense.object_clue;

        const hint = document.createElement('div');
        hint.className = 'report-hint';
        hint.innerHTML = `<span>Subject: <b>${currentCase!.Pronoun}</b></span> &nbsp;|&nbsp; <span>Verb: <b>${correctVerb}</b></span> &nbsp;|&nbsp; <span>Object: <b>${objectClue}</b></span> &nbsp;|&nbsp; <span>Time: <b>${correctTime}</b></span>`;

        row.appendChild(label);
        row.appendChild(hint);

        if (tense.is_dual_form) {
          const input1 = document.createElement('input');
          input1.type = 'text'; input1.className = 'report-input'; input1.style.marginBottom = '10px';
          input1.placeholder = 'Type the complete statement here (Form 1)...'; input1.autocomplete = 'off';
          const input2 = document.createElement('input');
          input2.type = 'text'; input2.className = 'report-input';
          input2.placeholder = 'Type the complete statement here (Form 2)...'; input2.autocomplete = 'off';
          row.appendChild(input1); row.appendChild(input2);
          reportInputs.push({ inputs: [input1, input2], targets: [tense.statement, tense.statement_2!], is_dual_form: true });
        } else {
          const input = document.createElement('input');
          input.type = 'text'; input.className = 'report-input';
          input.placeholder = 'Type the complete statement here...'; input.autocomplete = 'off';
          row.appendChild(input);
          reportInputs.push({ inputs: [input], targets: [tense.statement], is_dual_form: false });
        }
        reportContent.appendChild(row);
      });

      document.getElementById('btn-submit-report')!.style.display = 'inline-block';
      document.getElementById('btn-finish')!.style.display = 'none';
    }

    function checkReport() {
      let allCorrect = true;
      reportInputs.forEach((item) => {
        if (item.is_dual_form) {
          const u1 = normalizeString(item.inputs[0].value);
          const u2 = normalizeString(item.inputs[1].value);
          const t1 = normalizeString(item.targets[0]);
          const t2 = normalizeString(item.targets[1]);
          const isMatch = (u1 === t1 && u2 === t2) || (u1 === t2 && u2 === t1);
          if (isMatch) {
            item.inputs[0].style.borderColor = 'green'; item.inputs[0].style.backgroundColor = '#e8f5e9';
            item.inputs[1].style.borderColor = 'green'; item.inputs[1].style.backgroundColor = '#e8f5e9';
          } else {
            allCorrect = false;
            item.inputs[0].style.borderColor = 'red'; item.inputs[0].style.backgroundColor = '#ffebee';
            item.inputs[1].style.borderColor = 'red'; item.inputs[1].style.backgroundColor = '#ffebee';
          }
        } else {
          const u1 = normalizeString(item.inputs[0].value);
          const t1 = normalizeString(item.targets[0]);
          if (u1 === t1) {
            item.inputs[0].style.borderColor = 'green'; item.inputs[0].style.backgroundColor = '#e8f5e9';
          } else {
            allCorrect = false;
            item.inputs[0].style.borderColor = 'red'; item.inputs[0].style.backgroundColor = '#ffebee';
          }
        }
      });

      if (allCorrect) {
        tracker.endGame('completed', score, 3, currentCase!.tenses.length);
        if (bgm) bgm.pause();
        document.getElementById('btn-submit-report')!.style.display = 'none';
        successModal.style.display = 'flex';
        modalStampContainer.innerHTML = '';

        const stampSound = new Audio(`${base}/audio/dialogue/rubber_stamp.mp3`);
        stampSound.play().catch(() => {});

        const stamp = document.createElement('div');
        stamp.className = 'clue-box stamp-animation';
        stamp.style.backgroundColor = 'rgba(255,255,255,0.9)';
        stamp.style.margin = '0 auto 20px auto';
        stamp.innerHTML = `<span style="font-size: 4rem; color: #dc3545; font-weight: bold; border: 8px solid #dc3545; padding: 15px 30px; display: inline-block;">CASE CLOSED</span>`;
        modalStampContainer.appendChild(stamp);
      } else {
        alert('There are grammar or spelling errors in your report. Please check the sentences highlighted in red and try again!');
      }
    }

    function exitGame() {
      if (bgm) { bgm.pause(); bgm.currentTime = 0; }
      renderMenu();
    }

    // ── Wire up controls ──
    document.getElementById('btn-go-back')!.addEventListener('click', goBack);
    document.getElementById('btn-menu')!.addEventListener('click', goMenu);
    document.getElementById('btn-exit')!.addEventListener('click', goHome);
    document.getElementById('btn-check')!.addEventListener('click', checkAnswer);
    document.getElementById('btn-tts')!.addEventListener('click', () => playTTS());
    btnStartInvestigation.addEventListener('click', enterPhase1);
    btnProceedPhase2.addEventListener('click', enterPhase2);
    document.getElementById('btn-submit-report')!.addEventListener('click', checkReport);
    document.getElementById('btn-finish')!.addEventListener('click', exitGame);
    document.getElementById('btn-play-again')!.addEventListener('click', () => {
      successModal.style.display = 'none';
      startIntro(currentCase!);
    });
    document.getElementById('btn-modal-menu')!.addEventListener('click', () => {
      successModal.style.display = 'none';
      goMenu();
    });
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });

    restartFn = () => { if (currentCase) startIntro(currentCase); else renderMenu(); };

    renderMenu();

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      if (bgm) { bgm.pause(); bgm = null; }
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    };
  });
</script>

<svelte:head>
  <title>Time-Traveling Detective &amp; Reporter</title>
</svelte:head>

<div class="dr-root">
  <div id="app">
    <header class="game-header">
      <div class="header-left">
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <h2 class="cursor-pointer select-none" onclick={() => titleClickCount++}>Dialogue Roleplay</h2>
      </div>
      <div class="header-right">
        <div id="score-board">🌟 Clue Points: <span id="score">{score}</span></div>
        <button id="btn-go-back" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2" style="display:none;">Go Back</button>
        <button id="btn-menu" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2" style="display:none;">Case Menu</button>
        <button id="btn-exit" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2">Back to Hub</button>
      </div>
    </header>

    <main id="game-board">
      <section id="menu-screen">
        <h3>Please select a case to investigate or a topic to report:</h3>
        <div id="case-list" class="grid-container"></div>
      </section>

      <section id="intro-screen" style="display:none;" class="detective-theme">
        <div class="typewriter-container">
          <!-- svelte-ignore a11y_missing_content -->
          <h3 id="intro-text"></h3>
          <div id="suspect-profile" style="display:none; margin-top: 20px;">
            <img id="intro-silhouette" src="" alt="Suspect Silhouette" class="silhouette-img" />
            <p id="intro-pronoun" class="pronoun-tag">Target Pronoun: <span></span></p>
          </div>
          <button id="btn-start-investigation" class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md mt-3" style="display:none;">Start Investigation</button>
        </div>
      </section>

      <section id="phase1-screen" style="display:none;" class="detective-theme">
        <div id="tense-tracker" class="tracker-bar">
          <div class="tense-node active" id="tense-1">1. Past 🔒</div>
          <div class="tense-node" id="tense-2">2. Present 🔒</div>
          <div class="tense-node" id="tense-3">3. Continuous 🔒</div>
          <div class="tense-node" id="tense-4">4. Future 🔒</div>
        </div>

        <div class="task-instruction">
          <h3 id="task-prompt" class="prompt-text">Loading Task Prompt...</h3>
          <p id="sub-step-hint" class="sub-hint"></p>
        </div>

        <div id="npc-area">
          <img id="npc-image" src="" alt="NPC" class="npc-avatar" />
          <div class="speech-bubble" id="npc-dialogue">
            <p>Hello! What do you want to ask?</p>
            <button id="btn-tts" class="btn-icon">🔊</button>
          </div>
        </div>

        <div id="prompt-area" class="corkboard">
          <div id="clue-container" class="clue-box" style="display:none;">
            <span class="clue-label">🔎 Object Clue Found: </span>
            <span id="clue-text"></span>
          </div>

          <div id="verb-hints" class="verb-hints"></div>

          <div class="input-container">
            <input type="text" id="user-input" class="typewriter-input" placeholder="Type your sentence here..." autocomplete="off" />
          </div>

          <div class="action-bar mt-4">
            <button id="btn-check" class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md">Submit Question</button>
          </div>
        </div>
      </section>

      <section id="transition-screen" style="display:none;" class="detective-theme">
        <div class="typewriter-container" style="text-align: center;">
          <h2 style="color: #d32f2f;">All Clues Collected!</h2>
          <p id="transition-text" style="font-size: 1.2rem; margin: 20px 0; font-family: 'Special Elite', monospace;"></p>
          <button id="btn-proceed-phase2" class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md mt-3" style="display:none;">Write Report</button>
        </div>
      </section>

      <section id="phase2-screen" style="display:none;" class="detective-theme">
        <div class="case-file">
          <h3 class="report-title">📝 Case Report Summary</h3>
          <p style="font-family: 'Special Elite', monospace; font-weight: bold; margin-bottom: 20px;">Please write a complete case report based on the collected clues:</p>
          <div id="report-content" style="position: relative;"></div>
          <div style="text-align: right; margin-top: 20px;">
            <button id="btn-submit-report" class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md" style="display:none;">Submit Report</button>
            <button id="btn-finish" class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md" style="display:none;">Close Case</button>
          </div>
        </div>
      </section>

      <div id="success-modal" class="dr-modal-overlay" style="display:none;">
        <div class="modal-content detective-theme">
          <div id="modal-stamp-container"></div>
          <div class="modal-actions mt-3">
            <button id="btn-play-again" class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md">Play Again</button>
            <button id="btn-modal-menu" class="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2">Back to Dialogue-Roleplay</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

<Scoreboard {userName} onRestart={() => restartFn()} onHome={goHome} />
<TeacherDashboard bind:triggerCount={titleClickCount} />
