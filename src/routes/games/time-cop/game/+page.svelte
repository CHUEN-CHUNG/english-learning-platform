<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import {
    playCorrectSfx,
    playWrongSfx,
    setTimeCopBgm,
    stopTimeCopBgm,
    playEnterGameSfx,
  } from '$lib/utils/audio';
  import { normalizeTextForEnglishTts, pickEnglishVoice } from '$lib/utils/english-tts';
  import { gameProgress } from '$lib/stores/gameProgress.svelte';
  import '$lib/styles/time-cop.scss';

  interface MCQ { scene: string; text: string; opts: Record<string, string>; correct: string; exp: string; reward: number }
  interface FillQ { scene: string; text: string; primary: string; alts: string[]; feedback: string; hint: string; exp: string; reward: number }
  interface UnscrQ { scene: string; target: string; parts: string[]; distractors: string[]; exp: string; reward: number }
  interface BombQ { scene: string; wrong: string; error: string; correct: string; trigger: string; hint: string; exp: string; reward: number }
  interface NpcLine { name: string; text: string }
  type Phase = 'intro' | 'l1' | 'trans12' | 'l2f' | 'trans_f2u' | 'l2u' | 'trans23' | 'l3' | 'victory';

  onMount(() => {
    gameProgress.init();

    // ── CSV loaders ──
    function parseLine(line: string): string[] {
      const parts: string[] = []; let cur = '', inQ = false;
      for (const c of line) {
        if (c === '"') inQ = !inQ;
        else if (c === ',' && !inQ) { parts.push(cur.trim()); cur = ''; }
        else cur += c;
      }
      parts.push(cur.trim());
      return parts;
    }
    async function fetchCsv(filename: string): Promise<string[][]> {
      const res = await fetch(`${base}/content/time-cop/${filename}`);
      if (!res.ok) throw new Error(`CSV not found: ${filename}`);
      const raw = await res.text();
      return raw.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean).slice(1).map(parseLine);
    }

    // ── State ──
    const S = {
      phase: 'intro' as Phase, crystals: 0, lives: 5, correct: 0, total: 0,
      l1i: 0, l2fi: 0, l2ui: 0, l3i: 0,
    };

    let mcQs: MCQ[] = [], fillQs: FillQ[] = [], unscrQs: UnscrQ[] = [], bombQs: BombQ[] = [];
    const npc: Record<string, NpcLine[]> = {
      l1s: [], l1ok: [], l1no: [], l2s: [], l2ok: [], l2no: [], l3s: [], l3ok: [], l3no: [],
    };

    // ── DOM ──
    const ROOT = document.getElementById('game-root')!;
    const HDC = document.getElementById('hd-crystals')!;
    const HDL = document.getElementById('hd-lives')!;
    const PTITLE = document.getElementById('phase-title')!;
    const EXP_MODAL = document.getElementById('exp-modal')!;
    const EXP_ICON = document.getElementById('exp-icon')!;
    const EXP_TITLE = document.getElementById('exp-title')!;
    const EXP_TEXT = document.getElementById('exp-text')!;
    const EXP_BTN = document.getElementById('exp-next')!;

    // ── Voice ──
    let isSpeaking = false;
    let speechUnlocked = false;

    const unlockSpeech = () => {
      if (speechUnlocked || typeof speechSynthesis === 'undefined') return;
      speechUnlocked = true;
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
    };
    document.addEventListener('pointerdown', unlockSpeech, { once: true, capture: true });

    function returnToHub(e?: Event) {
      stopTimeCopBgm();
      if (window.parent !== window) {
        e?.preventDefault();
        window.parent.postMessage('grammar:time-cop-close', '*');
      }
    }

    const onBeforeUnload = () => stopTimeCopBgm();
    window.addEventListener('beforeunload', onBeforeUnload);
    document.querySelector('.hd-home')?.addEventListener('click', (e) => returnToHub(e));

    function speak(text: string, isAutoPlay = false) {
      if (typeof speechSynthesis === 'undefined') return;
      if (!isAutoPlay && isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        return;
      }
      speechSynthesis.cancel();
      const cleanText = normalizeTextForEnglishTts(text);
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = 'en-US';
      const preferred = pickEnglishVoice();
      if (preferred) u.voice = preferred;
      u.volume = 1;
      u.rate = 0.92;
      u.pitch = 1.08;
      u.onstart = () => { isSpeaking = true; };
      u.onend = () => { isSpeaking = false; };
      u.onerror = () => { isSpeaking = false; };
      if (!isAutoPlay || speechUnlocked) speechSynthesis.speak(u);
    }
    (window as any).speak = speak;

    // Step elements
    const STEPS = [1, 2, 3, 4].map((i) => document.getElementById(`step${i}`)!);
    const LINES = [1, 2, 3].map((i) => document.getElementById(`line${i}`)!);
    const SLBLS = [2, 3, 4].map((i) => document.getElementById(`sl${i}`)!);

    // ── Helpers ──
    function shuffle<T>(a: T[]): T[] {
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }
    function pick<T>(a: T[]): T | undefined { return a.length ? a[Math.floor(Math.random() * a.length)] : undefined; }
    function qs<T extends Element>(sel: string, ctx: Element | Document = document): T { return ctx.querySelector<T>(sel)!; }

    const PHASE_SECS = 180;
    let phaseTimer: number | null = null;
    let phaseLeft = PHASE_SECS;

    function stopPhaseTimer() {
      if (phaseTimer) { clearInterval(phaseTimer); phaseTimer = null; }
      const el = document.getElementById('hd-timer');
      if (el) el.style.display = 'none';
    }

    function startPhaseTimer(durationSecs: number = 180) {
      stopPhaseTimer();
      phaseLeft = durationSecs;
      const timerContainer = document.getElementById('hd-timer');
      const timerEl = document.getElementById('global-timer');
      if (timerContainer) timerContainer.style.display = 'flex';
      
      const updateDisplay = () => {
        if (!timerEl || !timerContainer) return;
        const m = Math.floor(phaseLeft / 60).toString().padStart(2, '0');
        const s = (phaseLeft % 60).toString().padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
        if (phaseLeft <= 30) {
          timerContainer.style.color = 'var(--red)';
          timerContainer.style.borderColor = 'var(--red)';
          timerContainer.style.animation = 'tcTickPulse 1s infinite';
        } else {
          timerContainer.style.color = 'var(--cyan)';
          timerContainer.style.borderColor = 'var(--cyan)';
          timerContainer.style.animation = 'none';
        }
      };
      
      updateDisplay();
      phaseTimer = window.setInterval(() => {
        phaseLeft--;
        updateDisplay();
        if (phaseLeft <= 0) {
          stopPhaseTimer();
          S.lives = 0;
          hud();
          showExp('⏳', 'Time is Up!', 'You ran out of time! Dr. Chronos has escaped.', () => {
            goPhase('victory');
          });
        }
      }, 1000);
    }

    function hud() {
      HDC.textContent = String(S.crystals);
      HDL.innerHTML = '❤️'.repeat(Math.max(0, S.lives)) + '<span style="opacity:.3">🤍</span>'.repeat(Math.max(0, 5 - S.lives));

      const hintBtn = document.getElementById('l2f-hint-btn') as HTMLButtonElement;
      if (hintBtn && !hintBtn.disabled && S.lives < 1) {
        hintBtn.disabled = true;
        hintBtn.style.opacity = '0.5';
        hintBtn.style.cursor = 'not-allowed';
      }
      const retryBtn = document.getElementById('btn-retry') as HTMLButtonElement;
      if (retryBtn) {
        if (S.lives < 1) {
          retryBtn.disabled = true;
          retryBtn.style.opacity = '0.5';
          retryBtn.style.cursor = 'not-allowed';
          retryBtn.textContent = '🔄 Try Again (Need ❤️)';
        } else {
          retryBtn.disabled = false;
          retryBtn.style.opacity = '1';
          retryBtn.style.cursor = 'pointer';
          retryBtn.textContent = '🔄 Try Again (-1 ❤️)';
        }
      }
    }

    function showMistake(correctText: string, expText: string, onRetry: () => void, onNext: () => void, isTimeout = false) {
      const modal = document.getElementById('mistake-modal')!;
      const icon = document.getElementById('mistake-icon')!;
      const title = document.getElementById('mistake-title')!;
      const correctEl = document.getElementById('mistake-correct-text')!;
      const expEl = document.getElementById('mistake-exp-text')!;
      const btnNext = document.getElementById('btn-next-q') as HTMLButtonElement;

      icon.textContent = isTimeout ? '💥' : '❌';
      title.textContent = isTimeout ? "Time's Up!" : "Not quite right!";
      correctEl.innerHTML = correctText;
      expEl.innerHTML = expText;

      modal.classList.remove('hidden');

      if (S.lives >= 1) {
        btnNext.textContent = '🔄 Try Again (-1 ❤️)';
        btnNext.onclick = () => {
          S.lives--;
          hud();
          modal.classList.add('hidden');
          onRetry();
          if (S.lives === 0) {
            setTimeout(() => {
              showExp('💔', 'No More Hearts!', 'You have 0 hearts left. You cannot use Hints or Try Again anymore. You must complete the levels carefully!', () => {});
            }, 50);
          }
        };
      } else {
        btnNext.textContent = '⏭️ Next Question';
        btnNext.onclick = () => {
          modal.classList.add('hidden');
          onNext();
        };
      }
    }

    function showExp(icon: string, title: string, text: string, onNext: () => void) {
      EXP_ICON.textContent = icon; EXP_TITLE.textContent = title; EXP_TEXT.textContent = text;
      EXP_MODAL.classList.remove('hidden');
      (EXP_BTN as HTMLButtonElement).onclick = () => { EXP_MODAL.classList.add('hidden'); onNext(); };
    }

    function updateSteps(ph: Phase) {
      const ORDER: Phase[] = ['intro', 'l1', 'trans12', 'l2f', 'trans_f2u', 'l2u', 'trans23', 'l3', 'victory'];
      const idx = ORDER.indexOf(ph);
      let lv = 0;
      if (idx >= 1) lv = 1;
      if (idx >= 3) lv = 2;
      if (idx >= 5) lv = 3;
      if (idx >= 7) lv = 4;
      if (idx === 8) lv = 5; // victory

      STEPS.forEach((s, i) => { s.className = 'step-dot ' + (i < lv - 1 ? 'done' : i === lv - 1 ? 'active' : ''); });
      LINES.forEach((l, i) => { l.className = 'step-line ' + (i < lv - 1 ? 'done' : i === lv - 1 ? 'active' : ''); });
      SLBLS.forEach((l, i) => { l.className = 'step-label ' + (i + 1 < lv - 1 ? 'done' : i + 1 === lv - 1 ? 'active' : ''); });
    }

    // ═══ INTRO ═══
    function renderIntro() {
      PTITLE.textContent = 'TIME COP NYC // POLICE BASE';
      updateSteps('intro');
      const msg = "Time Cop, we have a Code Red! The bad Dr. Chronos has broken the clocks in New York. He has taken all the train times, hidden all the city holidays, and is now putting dangerous traps across the city! Your mission: Fix the time using the right time words. We need your help... now!";

      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;max-width:38rem;margin:auto;text-align:center" class="fade-in">
        <div style="width:6rem;height:6rem;border-radius:50%;border:2px solid var(--cyan);box-shadow:var(--glow-c);display:flex;align-items:center;justify-content:center;font-size:3rem;margin-bottom:1.2rem;background:var(--bg2);animation:tcPulseBadge 2.5s ease-in-out infinite">👮‍♂️</div>
        <h1 style="font-family:var(--mono);font-size:1.5rem;font-weight:900;color:var(--cyan);letter-spacing:.12em;text-shadow:var(--glow-c);margin-bottom:.35rem">CHIEF CARTER // LIVE</h1>
        <p style="font-family:var(--mono);font-size:.7rem;letter-spacing:.2em;color:var(--text-dim);margin-bottom:1.6rem">POLICE BASE  ·  URGENT MISSION</p>
        <button id="btn-listen" type="button" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
        <div class="tc-panel glow-cyan" style="text-align:left;margin-bottom:1.5rem;width:100%;animation:tcFadeUp .5s ease">
          <div style="font-size:1rem;line-height:1.6;color:var(--text)">
            <p style="margin-bottom:.5rem"><strong>"Time Cop, we have a Code Red!"</strong></p>
            <p style="margin-bottom:.5rem"><strong>"The bad <span style="color:var(--red)">Dr. Chronos</span> has broken the clocks in New York. He has taken all the train times, hidden all the city holidays, and is now putting dangerous traps across the city!"</strong></p>
            <p style="color:var(--cyan);font-weight:bold">"Your mission: Fix the time using the right time words (in, on, at). We need your help... now!"</p>
          </div>
        </div>
        <button id="btn-start" class="btn-primary" style="padding:.9rem 3rem;font-size:1.05rem;letter-spacing:.06em">▶  START MISSION</button>
      </div>`;

      qs<HTMLButtonElement>('#btn-start').onclick = () => { playEnterGameSfx(); goPhase('l1'); };
      qs<HTMLButtonElement>('#btn-listen').onclick = () => { speak(msg); };
    }

    // ═══ LEVEL 1 — Whack-a-Mole MC ═══
    const HOLES = 6, MAX_MOLES = 3, MOLE_MS = 3800, TICK_MS = 750;
    let activeMoles: { hole: number; opt: string; btn: HTMLButtonElement; hide: number }[] = [];
    let moleButtons: HTMLButtonElement[] = [];
    let spawnTimer: number | null = null;
    let l1Mistakes = 0, l1Block = false;

    function buildBoard(board: HTMLElement) {
      board.innerHTML = ''; moleButtons = [];
      for (let i = 0; i < HOLES; i++) {
        const w = document.createElement('div'); w.className = 'hole-wrap';
        const bg = document.createElement('div'); bg.className = 'hole-bg';
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mole'; btn.disabled = true;
        btn.innerHTML = `<span class="mole-face">🤖</span><div class="mole-sign"><span class="mole-sign-text"></span></div>`;
        w.appendChild(bg); w.appendChild(btn); board.appendChild(w); moleButtons.push(btn);
      }
    }

    function resetMole(btn: HTMLButtonElement) {
      btn.classList.remove('up', 'correct', 'wrong'); btn.disabled = true; btn.onclick = null;
      (btn.querySelector('.mole-face') as HTMLElement).textContent = '🤖';
      (btn.querySelector('.mole-sign-text') as HTMLElement).textContent = '';
    }

    function stopSpawn() {
      if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
      activeMoles.forEach((m) => { clearTimeout(m.hide); resetMole(m.btn); });
      activeMoles = [];
    }

    function startSpawn(onWhack: (o: string, b: HTMLButtonElement, h: number) => void) {
      stopSpawn(); spawnMole(onWhack);
      spawnTimer = window.setInterval(() => { if (activeMoles.length < MAX_MOLES) spawnMole(onWhack); }, TICK_MS);
    }

    function spawnMole(onWhack: (o: string, b: HTMLButtonElement, h: number) => void) {
      if (l1Block) return;
      const q = mcQs[S.l1i]; if (!q) return;
      if (activeMoles.length >= MAX_MOLES) return;
      const occ = new Set(activeMoles.map((m) => m.hole));
      const free = [...Array(HOLES).keys()].filter((i) => !occ.has(i));
      if (!free.length) return;
      const hole = free[Math.floor(Math.random() * free.length)];
      const opt = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
      const btn = moleButtons[hole];
      (btn.querySelector('.mole-sign-text') as HTMLElement).textContent = `${opt}. ${q.opts[opt]}`;
      (btn.querySelector('.mole-face') as HTMLElement).textContent = '🤖';
      btn.classList.remove('correct', 'wrong'); btn.disabled = false;
      const hide = window.setTimeout(() => {
        const m = activeMoles.find((m) => m.hole === hole && m.hide === hide);
        if (m) { resetMole(m.btn); activeMoles = activeMoles.filter((x) => x.hole !== hole); }
      }, MOLE_MS);
      btn.onclick = () => onWhack(opt, btn, hole);
      setTimeout(() => btn.classList.add('up'), 30);
      activeMoles.push({ hole, opt, btn, hide });
    }

    function renderL1() {
      if (S.l1i >= mcQs.length) { goPhase('trans12'); return; }
      if (S.l1i === 0 && !phaseTimer) startPhaseTimer();
      const q = mcQs[S.l1i];
      PTITLE.textContent = 'MISSION 1  //  GRAND CENTRAL';
      updateSteps('l1'); l1Mistakes = 0; l1Block = false;

      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto">
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:var(--cyan)">🚉 GRAND CENTRAL</span>
          <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l1i + 1} / ${mcQs.length}</span>
        </div>
        <div id="l1-qcard" style="width:100%;text-align:center;padding:1rem 0;margin-bottom:1rem">
          <button onclick="speak('${q.scene.replace(/'/g, "\\'")} ${q.text.replace(/___/g, 'blank').replace(/'/g, "\\'")}', false)" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
          <p style="font-size:1.1rem;color:#93c5fd;margin-bottom:1.5rem;line-height:1.5">${q.scene}</p>
          <p style="font-size:1.6rem;font-weight:800;color:#fff;line-height:1.6" id="l1-qtext"></p>
        </div>
        <div id="l1-fb" style="min-height:2rem;font-size:1.1rem;font-weight:bold;text-align:center;margin-bottom:1rem"></div>
        <div id="mole-board" style="display:grid;grid-template-columns:repeat(3,6.8rem);grid-template-rows:repeat(2,7rem);gap:.5rem 1rem;justify-content:center;width:fit-content"></div>
      </div>`;

      qs<HTMLElement>('#l1-qtext').innerHTML = q.text.replace(/___/g, '<span class="blank-hl">___</span>');
      buildBoard(qs('#mole-board'));

      function onWhack(opt: string, btn: HTMLButtonElement, hole: number) {
        if (l1Block || btn.disabled) return;
        const mole = activeMoles.find((m) => m.hole === hole); if (!mole) return;
        clearTimeout(mole.hide);
        stopSpawn();
        activeMoles.forEach((m) => { if (m.hole !== hole) resetMole(m.btn); });
        activeMoles = [mole]; btn.disabled = true;

        const fb = qs<HTMLElement>('#l1-fb');

        if (opt === q.correct) {
          l1Block = true;
          (btn.querySelector('.mole-face') as HTMLElement).textContent = '🤩';
          btn.classList.add('correct'); playCorrectSfx();
          S.crystals += q.reward; S.correct++; hud();
          fb.style.color = 'var(--green)';
          fb.textContent = '✅ Correct!';
          setTimeout(() => { S.l1i++; renderL1(); }, 800);
        } else {
          (btn.querySelector('.mole-face') as HTMLElement).textContent = '💀';
          btn.classList.add('wrong'); playWrongSfx();
          qs('#l1-qcard').classList.add('shake');
          l1Block = true;
          
          setTimeout(() => {
            qs('#l1-qcard').classList.remove('shake');
            showMistake(
              `${q.correct}. ${q.opts[q.correct]}`,
              q.exp,
              () => {
                l1Block = false;
                resetMole(btn);
                activeMoles = [];
                startSpawn(onWhack);
              },
              () => {
                S.l1i++; renderL1();
              }
            );
          }, 500);
        }
      }
      startSpawn(onWhack);
    }

    // ═══ TRANSITION ═══
    function renderTransition(fromName: string, toName: string, _icon: string, msg: string, next: Phase) {
      stopSpawn();
      const crystalsNeeded = Math.max(0, 50 - S.crystals);
      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;max-width:38rem;margin:auto;text-align:center" class="fade-in">
        <div style="font-size:3.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 20px rgba(16,185,129,.6))">✅</div>
        
        <div class="tc-panel" style="display:flex;gap:1.5rem;justify-content:center;margin-bottom:1.5rem;font-family:var(--mono);font-size:.82rem;width:100%">
          <span style="color:var(--gold)">🔮 ${S.crystals} CRYSTALS</span>
          <span style="color:var(--text-dim)">·</span>
          <span style="color:var(--red)">❤️ ${S.lives} LIVES</span>
        </div>

        <div class="tc-panel glow-green" style="text-align:left;margin-bottom:1.5rem;width:100%;position:relative">
          <button onclick="speak('Great job! ${fromName.toUpperCase().replace(/'/g, "\\'")} is safe. You need ${crystalsNeeded} more crystals to become a Time Lord! Keep going!', false)" style="position:absolute;top:0;right:0;background:transparent;border:none;cursor:pointer;font-size:1.5rem;padding:0.5rem" title="Listen">🔊</button>
          <div style="font-size:1rem;line-height:1.6;color:var(--text)">
            <p style="margin-bottom:.5rem;color:var(--green);font-weight:bold">"Great job! ${fromName.toUpperCase()} is safe."</p>
            <p style="color:var(--text-dim)">"You need <strong style="color:var(--gold)">${crystalsNeeded}</strong> more crystals to become a Time Lord! Keep going!"</p>
          </div>
        </div>
        
        <button id="btn-cont" class="btn-primary" style="padding:.85rem 2.5rem;font-size:.95rem;letter-spacing:.06em">▶  GO TO ${toName.toUpperCase()}</button>
      </div>`;
      qs<HTMLButtonElement>('#btn-cont').onclick = () => goPhase(next);
    }

    // ═══ LEVEL 2A — Fill-in ═══
    function renderL2F() {
      if (S.l2fi >= fillQs.length) { goPhase('trans_f2u'); return; }
      if (S.l2fi === 0 && !phaseTimer) startPhaseTimer();
      const q = fillQs[S.l2fi];
      PTITLE.textContent = 'MISSION 2  //  CALENDAR REPAIR';
      updateSteps('l2f');

      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto">
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:#fb923c">🗽 CALENDAR REPAIR (PART 1)</span>
          <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l2fi + 1} / ${fillQs.length}</span>
        </div>
        <div style="width:100%;text-align:center;padding:1rem 0;margin-bottom:1rem">
          <button onclick="speak('${q.scene.replace(/'/g, "\\'")} ${q.text.replace(/___/g, 'blank').replace(/'/g, "\\'")}', false)" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
          <p style="font-size:1.1rem;color:#fdba74;margin-bottom:1.5rem;line-height:1.5">${q.scene}</p>
          <p style="font-size:1.6rem;font-weight:800;color:#fff;line-height:1.6" id="l2f-q"></p>
        </div>
        <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:.7rem">
          <input type="text" id="l2f-inp" class="tc-input" placeholder="in / on / at" autocomplete="off" spellcheck="false" />
          <p style="font-size:.85rem;color:var(--text-dim);min-height:1rem;font-style:italic" id="l2f-hint"></p>
          <div style="display:flex;gap:.6rem;margin-top:.5rem">
            <button id="l2f-hint-btn" class="btn-amber">💡 Hint</button>
            <button id="l2f-submit" class="btn-primary" style="padding:.55rem 1.6rem;font-size:.88rem">CHECK ✓</button>
          </div>
        </div>
        <div id="l2f-fb" style="display:none;width:100%;margin-top:1rem;text-align:center"></div>
      </div>`;

      qs<HTMLElement>('#l2f-q').innerHTML = q.text.replace(/___/g, '<span class="blank-hl">___</span>');
      const inp = qs<HTMLInputElement>('#l2f-inp');
      inp.focus();

      const hintBtn = qs<HTMLButtonElement>('#l2f-hint-btn');
      if (S.lives < 1) {
        hintBtn.disabled = true;
        hintBtn.style.opacity = '0.5';
        hintBtn.style.cursor = 'not-allowed';
      }
      hintBtn.addEventListener('click', () => {
        if (S.lives >= 1) {
          S.lives--;
          hud();
          qs<HTMLElement>('#l2f-hint').textContent = `💡  ${q.hint}`;
          hintBtn.disabled = true;
          hintBtn.style.opacity = '0.5';
          hintBtn.style.cursor = 'not-allowed';
          if (S.lives === 0) {
            setTimeout(() => {
              showExp('💔', 'No More Hearts!', 'You have 0 hearts left. You cannot use Hints or Try Again anymore. You must complete the levels carefully!', () => {});
            }, 50);
          }
        }
      });

      function check() {
        const v = inp.value.trim().toLowerCase();
        const ok = v === q.primary.toLowerCase() || q.alts.some((a) => a && a.toLowerCase() === v);
        const fb = qs<HTMLElement>('#l2f-fb');
        if (ok) {
          inp.className = 'tc-input ok';
          S.crystals += q.reward; S.correct++; hud();
          fb.innerHTML = `<div class="fb-ok">✅ Correct! The word is <strong>"${q.primary}"</strong>.<br><span style="opacity:.8">${q.exp}</span></div>`;
          fb.style.display = 'block';
          playCorrectSfx();
          setTimeout(() => { S.l2fi++; renderL2F(); }, 2000);
        } else {
          inp.className = 'tc-input err';
          playWrongSfx();
          setTimeout(() => {
            showMistake(
              q.primary,
              q.exp,
              () => {
                inp.className = 'tc-input'; inp.value = ''; inp.focus();
              },
              () => {
                S.l2fi++; renderL2F();
              }
            );
          }, 400);
        }
      }
      qs('#l2f-submit').addEventListener('click', check);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    }

    // ═══ LEVEL 2B — Unscramble ═══
    let selTiles: { word: string; id: number; src: HTMLButtonElement }[] = [];

    function renderL2U() {
      if (S.l2ui >= unscrQs.length) { goPhase('trans23'); return; }
      if (S.l2ui === 0 && !phaseTimer) startPhaseTimer(300);
      const q = unscrQs[S.l2ui];
      PTITLE.textContent = 'MISSION 3  //  TIME FRAGMENTS';
      updateSteps('l2u'); selTiles = [];

      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto">
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:#a78bfa">🗽 CALENDAR REPAIR (PART 2)</span>
          <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l2ui + 1} / ${unscrQs.length}</span>
        </div>
        <div style="width:100%;text-align:center;padding:1rem 0;margin-bottom:.5rem">
          <button onclick="speak('${q.scene.replace(/'/g, "\\'")}', false)" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
          <p style="font-size:1.1rem;color:#c4b5fd;line-height:1.5">${q.scene}</p>
        </div>
        <div style="width:100%;margin-bottom:1rem">
          <div class="answer-track" id="u-track" style="justify-content:center;min-height:3.5rem">
            <span class="track-ph" id="u-ph">Click words below to make a sentence ↓</span>
          </div>
        </div>
        <div style="width:100%;margin-bottom:1rem">
          <div id="u-pool" style="display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center"></div>
        </div>
        <div style="display:flex;gap:.6rem;justify-content:center">
          <button id="u-reset" class="btn-secondary">↩ Reset</button>
          <button id="u-submit" class="btn-primary" style="padding:.55rem 1.6rem;font-size:.88rem">SUBMIT ✓</button>
        </div>
        <div id="l2u-fb" style="display:none;width:100%;margin-top:1rem;text-align:center"></div>
      </div>`;

      const track = qs<HTMLElement>('#u-track');
      const ph = qs<HTMLElement>('#u-ph');
      const pool = qs<HTMLElement>('#u-pool');

      shuffle([...q.parts, ...q.distractors]).forEach((word, i) => {
        const tile = document.createElement('button'); tile.type = 'button';
        tile.className = 'word-tile'; tile.textContent = word;
        tile.addEventListener('click', () => addTile(tile, word, i, ph, track));
        pool.appendChild(tile);
      });

      qs('#u-reset').addEventListener('click', () => {
        selTiles = [];
        pool.querySelectorAll('.word-tile.selected').forEach((t) => t.classList.remove('selected'));
        track.innerHTML = ''; track.appendChild(ph); ph.style.display = '';
      });

      qs('#u-submit').addEventListener('click', () => {
        const ans = selTiles.map((t) => t.word).join(' ');
        const fb = qs<HTMLElement>('#l2u-fb');
        const normalizeStr = (s: string) => s.trim().replace(/\s+/g, ' ');
        if (normalizeStr(ans) === normalizeStr(q.target)) {
          S.crystals += q.reward; S.correct++; hud();
          fb.innerHTML = `<div class="fb-ok">✅ Perfect! <strong>${q.target}</strong><br><span style="opacity:.8">${q.exp}</span></div>`;
          fb.style.display = 'block';
          playCorrectSfx();
          setTimeout(() => { S.l2ui++; renderL2U(); }, 2000);
        } else {
          playWrongSfx();
          showMistake(
            q.target,
            q.exp,
            () => {
              qs<HTMLButtonElement>('#u-reset').click();
            },
            () => {
              S.l2ui++; renderL2U();
            }
          );
        }
      });
    }

    function addTile(tile: HTMLButtonElement, word: string, id: number, ph: HTMLElement, track: HTMLElement) {
      if (tile.classList.contains('selected')) return;
      tile.classList.add('selected'); ph.style.display = 'none';
      selTiles.push({ word, id, src: tile });
      const chip = document.createElement('button'); chip.type = 'button';
      chip.className = 'word-tile'; chip.textContent = word;
      chip.style.fontSize = '.78rem';
      chip.addEventListener('click', () => {
        track.removeChild(chip);
        selTiles = selTiles.filter((t) => t.id !== id);
        tile.classList.remove('selected');
        if (!track.children.length) { track.appendChild(ph); ph.style.display = ''; }
      });
      track.appendChild(chip);
    }

    // ═══ LEVEL 3 — Bomb Defuse ═══
    const BOMB_SECS = 12;
    let bombTimer: number | null = null, bombLeft = BOMB_SECS, l3Live = false;

    function stopBomb() { if (bombTimer) { clearInterval(bombTimer); bombTimer = null; } }

    let bombState: 'select' | 'type' = 'select';
    let selectedBombWord: { btn: HTMLButtonElement, isErr: boolean } | null = null;

    function renderL3() {
      if (S.l3i >= bombQs.length) { goPhase('victory'); return; }
      const q = bombQs[S.l3i];
      PTITLE.textContent = 'MISSION 4  //  ZERO-PREPOSITION BOMB';
      updateSteps('l3'); bombLeft = BOMB_SECS; l3Live = true; stopBomb();
      bombState = 'select';

      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto;background:rgba(239,68,68,.02)">
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:var(--red)">💣 BOMB DISPOSAL</span>
          <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l3i + 1} / ${bombQs.length}</span>
        </div>
        <div style="width:100%;text-align:center;padding:1rem 0;margin-bottom:.5rem">
          <button onclick="speak('${q.scene.replace(/'/g, "\\'")} ${q.wrong.replace(/'/g, "\\'")}', false)" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
          <p style="font-size:1.1rem;color:#fca5a5;line-height:1.5">${q.scene}</p>
        </div>
        <div class="tc-panel glow-red" id="bomb-card" style="width:100%;background:#0d0608;margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.7rem;color:var(--text-dim);margin-bottom:.35rem">
            <span>⏱ TIME LEFT</span>
            <span id="bomb-secs" style="color:var(--red);font-weight:800">${BOMB_SECS}</span>
          </div>
          <div style="width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,.07);margin-bottom:1rem;overflow:hidden">
            <div id="bomb-bar" style="height:100%;border-radius:3px;width:100%;background:var(--green);transition:width .1s linear,background .5s"></div>
          </div>
          <div style="text-align:center;font-size:4rem;margin-bottom:.5rem;filter:drop-shadow(0 0 18px rgba(239,68,68,.7))" id="bomb-emoji">💣</div>
          <div id="bomb-instruction" style="text-align:center;font-family:var(--mono);font-size:.75rem;letter-spacing:.1em;color:rgba(239,68,68,.9);margin-bottom:1rem;font-weight:bold">⚡ CLICK THE FAKE TIME WORD ⚡</div>
          <div id="bomb-sent" style="text-align:center;font-size:1.3rem;font-weight:700;line-height:2;color:#cbd5e1;letter-spacing:.02em;margin-bottom:.5rem;padding:1rem;border:1px solid rgba(239,68,68,.2);border-radius:.5rem;background:rgba(0,0,0,.3)"></div>
          
          <div id="bomb-confirm-area" style="display:none; width:100%; text-align:center; padding: 0.5rem 0 1rem;">
            <button id="bomb-confirm-btn" class="btn-amber" style="padding:0.6rem 2rem;font-size:0.95rem;font-weight:bold;">CONFIRM SELECTION ⚡</button>
          </div>

          <div id="bomb-type-area" style="display:none; width:100%; text-align:center; padding: 1rem 0;">
            <input type="text" id="bomb-inp" class="tc-input" style="width:100%; max-width: 90%; font-size:1.1rem; padding:0.8rem; margin-bottom:1rem;" autocomplete="off" spellcheck="false" />
            <div style="display:flex;justify-content:center;gap:.6rem;">
              <button id="bomb-submit" class="btn-primary" style="padding:0.55rem 1.6rem;font-size:.88rem">DEFUSE ✓</button>
            </div>
          </div>

          <p style="text-align:center;font-size:.85rem;color:rgba(239,68,68,.7);font-style:italic;min-height:1rem" id="bomb-hint"></p>
        </div>
        <div style="width:100%;text-align:center;font-size:.85rem;color:#fde68a;opacity:.8">📌 <strong>Rule:</strong> Do not use in/on/at before <strong style="color:#fff">this / next / last / every / today / tomorrow / yesterday</strong></div>
        <div id="l3-fb" style="display:none;width:100%;margin-top:1rem;text-align:center"></div>
      </div>`;

      buildBombSentence(q);
      startBombTimer(q);
    }

    function buildBombSentence(q: BombQ) {
      const el = qs<HTMLElement>('#bomb-sent');
      const errStart = q.wrong.indexOf(q.error);
      if (errStart < 0) { el.textContent = q.wrong; return; }
      const before = q.wrong.slice(0, errStart);
      const after = q.wrong.slice(errStart + q.error.length);
      const errWords = q.error.trim().split(/\s+/);
      el.innerHTML = '';
      selectedBombWord = null;

      const confirmArea = qs<HTMLElement>('#bomb-confirm-area');
      const confirmBtn = qs<HTMLButtonElement>('#bomb-confirm-btn');
      confirmArea.style.display = 'none';

      const makeBtn = (w: string, isErr: boolean) => {
        const b = document.createElement('button'); 
        b.className = 'decoy-btn';
        b.textContent = w + ' ';
        b.addEventListener('click', () => {
          if (!l3Live || bombState !== 'select') return;
          if (selectedBombWord) {
             selectedBombWord.btn.style.color = '';
             selectedBombWord.btn.style.fontWeight = '';
             selectedBombWord.btn.style.background = '';
          }
          selectedBombWord = { btn: b, isErr };
          b.style.color = '#fff';
          b.style.fontWeight = 'bold';
          b.style.background = 'rgba(239,68,68,.3)';
          confirmArea.style.display = 'block';
        }); 
        el.appendChild(b);
      };

      confirmBtn.onclick = () => {
        if (!l3Live || bombState !== 'select' || !selectedBombWord) return;
        confirmArea.style.display = 'none';
        if (selectedBombWord.isErr) {
          correctWordClick(q, selectedBombWord.btn);
        } else {
          wrongClick(q);
        }
      };

      before.trim().split(/\s+/).filter(Boolean).forEach((w) => makeBtn(w, false));
      errWords.forEach((w, i) => {
        if (i === 0) {
          makeBtn(w, true);
        } else {
          makeBtn(w, false);
        }
      });
      after.trim().split(/\s+/).filter(Boolean).forEach((w) => makeBtn(w, false));
    }

    function correctWordClick(q: BombQ, btn: HTMLButtonElement) {
      if (!l3Live || bombState !== 'select') return;
      bombState = 'type';
      btn.style.color = 'var(--green)';
      btn.style.fontWeight = 'bold';
      
      const sentEl = qs<HTMLElement>('#bomb-sent');
      const typeArea = qs<HTMLElement>('#bomb-type-area');
      const inp = qs<HTMLInputElement>('#bomb-inp');
      const instruction = qs<HTMLElement>('#bomb-instruction');
      
      sentEl.style.opacity = '0.5';
      sentEl.style.pointerEvents = 'none';
      instruction.textContent = '⚡ NOW TYPE THE CORRECT SENTENCE ⚡';
      
      typeArea.style.display = 'block';
      inp.value = q.wrong; // pre-fill with wrong sentence to edit
      inp.focus();
      
      const check = () => {
        if (!l3Live) return;
        const v = inp.value.trim();
        const norm = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        if (norm(v) === norm(q.correct)) {
          correctClick(q);
        } else {
          wrongClick(q);
        }
      };
      
      qs<HTMLButtonElement>('#bomb-submit').onclick = check;
      inp.onkeydown = (e) => { if (e.key === 'Enter') check(); };
    }

    function correctClick(q: BombQ) {
      if (!l3Live) return; l3Live = false; stopBomb();
      qs<HTMLElement>('#bomb-emoji').textContent = '✅';
      const card = qs<HTMLElement>('#bomb-card');
      card.style.borderColor = 'var(--green)'; card.style.boxShadow = '0 4px 24px rgba(0,0,0,.5),var(--glow-g)';
      S.crystals += bombQs[S.l3i].reward; S.correct++; hud();
      const fb = qs<HTMLElement>('#l3-fb');
      fb.innerHTML = `<div class="fb-ok">✅ DEFUSED! Correct: <strong>"${q.correct}"</strong><br><span style="opacity:.8">${q.exp}</span></div>`;
      fb.style.display = 'block'; playCorrectSfx();
      setTimeout(() => { S.l3i++; renderL3(); }, 2200);
    }

    function wrongClick(q: BombQ) {
      if (!l3Live) return;
      stopBomb(); l3Live = false;
      playWrongSfx();

      setTimeout(() => {
        showMistake(
          q.correct,
          q.exp,
          () => {
            bombLeft = BOMB_SECS; 
            bombState = 'select';
            l3Live = true;
            renderL3();
          },
          () => {
            S.l3i++; renderL3();
          }
        );
      }, 400);
    }

    function startBombTimer(q: BombQ) {
      const secsEl = qs<HTMLElement>('#bomb-secs');
      const bar = qs<HTMLElement>('#bomb-bar');
      bombTimer = window.setInterval(() => {
        bombLeft--;
        secsEl.textContent = String(bombLeft);
        secsEl.className = bombLeft <= 3 ? 'tick' : '';
        const pct = (bombLeft / BOMB_SECS) * 100;
        bar.style.width = pct + '%';
        bar.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--gold)' : 'var(--red)';
        if (bombLeft <= 0) {
          stopBomb(); l3Live = false;
          qs<HTMLElement>('#bomb-emoji').textContent = '💥';
          playWrongSfx();

          setTimeout(() => {
            showMistake(
              q.correct,
              q.exp,
              () => {
                bombLeft = BOMB_SECS; 
                bombState = 'select';
                l3Live = true;
                renderL3();
              },
              () => {
                S.l3i++; renderL3();
              },
              true
            );
          }, 600);
        }
      }, 1000);
    }

    // ═══ VICTORY ═══
    function renderVictory() {
      stopSpawn(); stopBomb();
      PTITLE.textContent = 'MISSION COMPLETE  //  NEW YORK IS SAFE';
      const win = S.crystals >= 15;
      const rank = S.crystals >= 50 ? '👑 Time Lord' : S.crystals >= 25 ? '🏅 Inspector' : S.crystals >= 10 ? '🕵️ Detective' : '🔰 Rookie';

      const prev = parseInt(localStorage.getItem('time_cop_crystals') || '0');
      localStorage.setItem('time_cop_crystals', String(prev + S.crystals));
      if (win) {
        gameProgress.complete('time_cop_level1_complete');
        gameProgress.complete('time_cop_level2_complete');
        gameProgress.complete('time_cop_level3_complete');
      }

      const npcMsg = win
        ? `"Fantastic work, Time Cop! You stopped Dr. Chronos and fixed the time in New York. Everyone is safe, and the time words are correct again."`
        : `"We lost some time pieces, but you are safe. Go back to base, rest, and practice your time words. Dr. Chronos will come back!"`;

      ROOT.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;max-width:38rem;margin:auto;text-align:center" class="fade-in">
        <div style="font-size:4.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 24px rgba(${win ? '16,185,129' : '245,158,11'},.7))">${win ? '🏆' : '💪'}</div>
        <div class="tc-panel glow-${win ? 'green' : 'gold'}" style="text-align:left;margin-bottom:1.5rem;width:100%;position:relative">
          <button onclick="speak('${npcMsg.replace(/'/g, "\\'").replace(/"/g, '')}', false)" style="position:absolute;top:0;right:0;background:transparent;border:none;cursor:pointer;font-size:1.5rem;padding:0.5rem" title="Listen">🔊</button>
          <div style="font-size:1rem;line-height:1.6;color:var(--text)">
            <p style="color:var(--text-dim)">${npcMsg}</p>
          </div>
        </div>
        <div class="tc-panel" style="width:100%;margin-bottom:1.5rem">
          <div style="font-family:var(--mono);color:var(--text-dim);font-size:.7rem;letter-spacing:.1em;margin-bottom:1rem">MISSION SCORE</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;text-align:center">
            <div>
              <div style="font-family:var(--mono);font-size:.65rem;color:var(--text-dim);letter-spacing:.08em">SCORE</div>
              <div style="font-size:1.4rem;font-weight:900;color:var(--cyan)">${S.correct}<span style="font-size:.9rem;color:var(--text-dim)">/${S.total}</span></div>
            </div>
            <div>
              <div style="font-family:var(--mono);font-size:.65rem;color:var(--text-dim);letter-spacing:.08em">CRYSTALS</div>
              <div style="font-size:1.4rem;font-weight:900;color:var(--gold)">🔮 ${S.crystals}</div>
            </div>
            <div>
              <div style="font-family:var(--mono);font-size:.65rem;color:var(--text-dim);letter-spacing:.08em">RANK</div>
              <div style="font-size:1rem;font-weight:700;color:var(--text)">${rank}</div>
            </div>
            <div>
              <div style="font-family:var(--mono);font-size:.65rem;color:var(--text-dim);letter-spacing:.08em">LIVES LEFT</div>
              <div style="font-size:1rem">${'❤️'.repeat(Math.max(0, S.lives))}</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
          <button id="btn-again" class="btn-primary" style="padding:.75rem 1.8rem">🔄 Play Again</button>
          <button id="btn-hub" class="btn-secondary" style="padding:.75rem 1.8rem;font-weight:700">🏠 Return to Hub</button>
        </div>
      </div>`;
      qs<HTMLButtonElement>('#btn-again').onclick = () => startGame();
      qs<HTMLButtonElement>('#btn-hub').onclick = (e) => returnToHub(e);
    }

    // ═══ PHASE ROUTER ═══
    function goPhase(ph: Phase) {
      S.phase = ph; updateSteps(ph); stopSpawn(); stopBomb(); l3Live = false;
      if (['intro', 'l2f', 'l2u', 'trans12', 'trans_f2u', 'trans23', 'l3', 'victory'].includes(ph)) {
        stopPhaseTimer();
      }
      switch (ph) {
        case 'intro': setTimeCopBgm('mission1'); renderIntro(); break;
        case 'l1': setTimeCopBgm('mission1'); renderL1(); break;
        case 'trans12': renderTransition('Grand Central 🚉', 'The Lost Holidays 🗽', '🚉',
          'The trains are running again! But Chronos is not done. He has hidden all the city holidays from the calendar. Go and bring them back!', 'l2f'); break;
        case 'l2f': setTimeCopBgm('mission2'); renderL2F(); break;
        case 'trans_f2u': renderTransition('Calendar Repair 🗓️', 'Time Fragments 🧩', '🗓️',
          'The calendar is fixed! But the time fragments are still scattered. We need to unscramble them to fully restore the holidays!', 'l2u'); break;
        case 'l2u': setTimeCopBgm('mission2'); renderL2U(); break;
        case 'trans23': renderTransition('Lost Holidays 🗽', 'Zero Trap 💣', '🗽',
          "The holidays are back! Wait... we see strange things on our screens. Chronos is putting traps across the city! We need you to stop them before it's too late!", 'l3'); break;
        case 'l3': setTimeCopBgm('mission3'); renderL3(); break;
        case 'victory': setTimeCopBgm('victory'); renderVictory(); break;
      }
    }

    // ═══ DATA LOADER ═══
    async function loadData() {
      mcQs = []; fillQs = []; unscrQs = []; bombQs = [];
      Object.keys(npc).forEach((k) => npc[k] = []);

      (await fetchCsv('TimeCop-L1-MorningChaos-MC.csv'))
        .filter((r) => r.length >= 10 && ['A', 'B', 'C', 'D'].includes(r[7].toUpperCase()))
        .forEach((r) => mcQs.push({ scene: r[1], text: r[2], opts: { A: r[3], B: r[4], C: r[5], D: r[6] }, correct: r[7].toUpperCase(), exp: r[9], reward: parseInt(r[10]) || 1 }));

      (await fetchCsv('TimeCop-L2-LostHolidays-Fillin.csv'))
        .filter((r) => r.length >= 10)
        .forEach((r) => fillQs.push({ scene: r[1], text: r[2], primary: r[3], alts: r[4].split('|').filter(Boolean), feedback: r[7], hint: r[8], exp: r[9], reward: parseInt(r[10]) || 1 }));

      (await fetchCsv('TimeCop-L2-LostHolidays-Unscramble.csv'))
        .filter((r) => r.length >= 8)
        .forEach((r) => unscrQs.push({ scene: r[1], target: r[2], parts: r[3].split('|').filter(Boolean), distractors: r[4].split('|').filter(Boolean), exp: r[7], reward: parseInt(r[8]) || 1 }));

      (await fetchCsv('TimeCop-L3-ZeroTrap-Correction.csv'))
        .filter((r) => r.length >= 9)
        .forEach((r) => bombQs.push({ scene: r[1], wrong: r[2], error: r[3], correct: r[4], trigger: r[6], hint: r[7], exp: r[8], reward: parseInt(r[9]) || 2 }));

      (await fetchCsv('TimeCop-NPC-Dialogues.csv')).forEach((r) => {
        if (r.length < 7) return;
        const obj: NpcLine = { name: r[2], text: r[4] };
        const lvl = r[1], trig = r[6];
        if (trig === 'on_level_start') npc[`l${lvl}s`]?.push(obj);
        if (trig === 'on_correct') npc[`l${lvl}ok`]?.push(obj);
        if (trig === 'on_wrong') npc[`l${lvl}no`]?.push(obj);
      });

      shuffle(mcQs); shuffle(fillQs); shuffle(unscrQs); shuffle(bombQs);
    }

    // ═══ START ═══
    function startGame() {
      Object.assign(S, { phase: 'intro' as Phase, crystals: 0, lives: 5, correct: 0, l1i: 0, l2fi: 0, l2ui: 0, l3i: 0 });
      S.total = mcQs.length + fillQs.length + unscrQs.length + bombQs.length;
      shuffle(mcQs); shuffle(fillQs); shuffle(unscrQs); shuffle(bombQs);
      hud(); goPhase('intro');
    }

    void (async () => {
      try {
        await loadData();
        const ld = document.getElementById('load-detail');
        if (ld) ld.textContent = `${mcQs.length} MC  ·  ${fillQs.length} Fill-in  ·  ${unscrQs.length} Unscramble  ·  ${bombQs.length} Bomb`;
        startGame();
      } catch (e) {
        console.error(e);
        ROOT.innerHTML = `<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center">
          <div style="color:var(--red)">
            <p style="font-size:1.2rem;font-weight:700;margin-bottom:.5rem">⚠️ DATA LOAD FAILURE</p>
            <p style="font-size:.8rem;color:var(--text-dim)">${e}</p>
          </div>
        </div>`;
      }
    })();

    // ── cleanup ──
    return () => {
      stopSpawn(); stopBomb();
      stopTimeCopBgm();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('pointerdown', unlockSpeech, { capture: true } as EventListenerOptions);
      delete (window as any).speak;
    };
  });
</script>

<svelte:head>
  <title>🚔 Time Cop NYC — Dispatch HQ</title>
</svelte:head>

<div class="tc-game-root">
  <header id="tc-header">
    <div class="hd-brand">
      <button type="button" class="hd-home" title="Hub">🏠 Hub</button>
      <span class="hd-logo">🚔</span>
      <span class="hd-title" id="phase-title">TIME COP NYC // POLICE BASE</span>
    </div>
    <div class="hd-stats">
      <div class="stat-badge" id="hd-timer" style="display:none; color:var(--cyan); border-color:var(--cyan);">⏱ <span id="global-timer">05:00</span></div>
      <div class="stat-badge stat-crystal">🔮 <span id="hd-crystals">0</span></div>
      <div class="stat-badge stat-lives" id="hd-lives">❤️❤️❤️❤️❤️</div>
    </div>
  </header>

  <nav id="tc-stepbar">
    <div class="stepbar-inner">
      <div class="step">
        <div class="step-dot active" id="step1">🚉</div>
        <span class="step-label active">MISSION 1</span>
      </div>
      <div class="step-line" id="line1"></div>
      <div class="step">
        <div class="step-dot" id="step2">🗽</div>
        <span class="step-label" id="sl2">MISSION 2</span>
      </div>
      <div class="step-line" id="line2"></div>
      <div class="step">
        <div class="step-dot" id="step3">🧩</div>
        <span class="step-label" id="sl3">MISSION 3</span>
      </div>
      <div class="step-line" id="line3"></div>
      <div class="step">
        <div class="step-dot" id="step4">💣</div>
        <span class="step-label" id="sl4">MISSION 4</span>
      </div>
    </div>
  </nav>

  <main id="game-root">
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:2rem">
      <div style="text-align:center;color:var(--text-dim)">
        <div style="font-size:2.5rem;margin-bottom:.8rem;animation:tcSpin 1.5s linear infinite">⚙️</div>
        <p style="font-family:var(--mono);letter-spacing:.08em">LOADING MISSION DATA…</p>
        <p style="font-size:.75rem;margin-top:.5rem;color:var(--text-dim)" id="load-detail"></p>
      </div>
    </div>
  </main>

  <div id="exp-modal" class="hidden">
    <div class="modal-box">
      <div class="modal-icon" id="exp-icon">❌</div>
      <div class="modal-title" id="exp-title">Mission Debrief</div>
      <div class="modal-body" id="exp-text"></div>
      <button id="exp-next" class="btn-primary" style="width:100%;padding:.85rem">Next Target →</button>
    </div>
  </div>

  <div id="mistake-modal" class="hidden" style="position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;">
    <div class="modal-box" style="border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 8px 60px rgba(0, 0, 0, 0.6), var(--glow-r); padding-top: 1.5rem;">
      <div class="modal-icon" id="mistake-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">❌</div>
      <div class="modal-title" id="mistake-title" style="color: var(--red); font-size: 1.3rem; margin-bottom: 1.5rem;">Not quite right!</div>
      
      <div id="mistake-answer">
        <div class="modal-body" style="border-color: var(--border); margin-bottom: 1.5rem;">
          <p style="color: var(--green); font-weight: bold; margin-bottom: 0.5rem;">✅ Correct Answer:</p>
          <p style="color: white; font-size: 1.1rem; margin-bottom: 1rem; font-weight: bold;" id="mistake-correct-text"></p>
          <p style="color: var(--text-dim); font-style: italic;" id="mistake-exp-text"></p>
        </div>
        <button id="btn-next-q" class="btn-primary" style="width:100%; padding:.85rem;">Next</button>
      </div>
    </div>
  </div>
</div>
