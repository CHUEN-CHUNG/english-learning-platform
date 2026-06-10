// ═══════════════════════════════════════════════════════════
//  Time Cop NYC — Unified Game  |  Dispatch HQ Edition
// ═══════════════════════════════════════════════════════════

import {
  playCorrectSfx,
  playWrongSfx,
  setTimeCopBgm,
  stopTimeCopBgm,
} from "./time-cop-audio";
import { playEnterGameSfx } from "../../../shared/enter-game-sfx";
import { normalizeTextForEnglishTts, pickEnglishVoice } from "@shared/utils/english-tts";

// ── CSV import (build-time via Vite glob) ──────────────────
const csvModules = import.meta.glob("../../config/*.csv", {
  query: "?raw", import: "default", eager: true,
}) as Record<string, string>;

function csvRaw(filename: string): string {
  const key = Object.keys(csvModules).find(k => k.endsWith("/" + filename));
  if (!key) throw new Error(`CSV not found: ${filename}`);
  return csvModules[key];
}

// ── CSV parser ─────────────────────────────────────────────
function parseLine(line: string): string[] {
  const parts: string[] = []; let cur = "", inQ = false;
  for (const c of line) {
    if (c === '"') inQ = !inQ;
    else if (c === "," && !inQ) { parts.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  parts.push(cur.trim());
  return parts;
}
function parseCsv(filename: string): string[][] {
  return csvRaw(filename).replace(/^\uFEFF/, "").trim()
    .split(/\r?\n/).filter(Boolean).slice(1).map(parseLine);
}

// ── Types ──────────────────────────────────────────────────
interface MCQ  { scene:string; text:string; opts:Record<string,string>; correct:string; exp:string; reward:number }
interface FillQ{ scene:string; text:string; primary:string; alts:string[]; feedback:string; hint:string; exp:string; reward:number }
interface UnscrQ{ scene:string; target:string; parts:string[]; distractors:string[]; exp:string; reward:number }
interface BombQ { scene:string; wrong:string; error:string; correct:string; trigger:string; hint:string; exp:string; reward:number }
interface NpcLine{ name:string; text:string }
type Phase = "intro"|"l1"|"trans12"|"l2f"|"l2u"|"trans23"|"l3"|"victory";

// ── State ──────────────────────────────────────────────────
const S = { phase:"intro" as Phase, crystals:0, lives:3, correct:0, total:0,
             l1i:0, l2fi:0, l2ui:0, l3i:0 };

let mcQs:MCQ[]=[], fillQs:FillQ[]=[], unscrQs:UnscrQ[]=[], bombQs:BombQ[]=[];
const npc: Record<string,NpcLine[]> = {
  l1s:[], l1ok:[], l1no:[], l2s:[], l2ok:[], l2no:[], l3s:[], l3ok:[], l3no:[],
};

// ── DOM ────────────────────────────────────────────────────
const ROOT      = document.getElementById("game-root")!;
const HDC       = document.getElementById("hd-crystals")!;
const HDL       = document.getElementById("hd-lives")!;
const HDP       = document.getElementById("hd-progress")!;
const PTITLE    = document.getElementById("phase-title")!;
const EXP_MODAL = document.getElementById("exp-modal")!;
const EXP_ICON  = document.getElementById("exp-icon")!;
const EXP_TITLE = document.getElementById("exp-title")!;
const EXP_TEXT  = document.getElementById("exp-text")!;
const EXP_BTN   = document.getElementById("exp-next")!;

// Voice
let isSpeaking = false;
let speechUnlocked = false;

// Unlock speech synthesis on first user interaction (TTS only)
document.addEventListener(
  "pointerdown",
  () => {
    if (speechUnlocked || typeof speechSynthesis === "undefined") return;
    speechUnlocked = true;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    speechSynthesis.speak(u);
  },
  { once: true, capture: true },
);

function returnToHub(e?: Event) {
  stopTimeCopBgm();
  if (window.parent !== window) {
    e?.preventDefault();
    window.parent.postMessage("grammar:time-cop-close", "*");
  }
}

window.addEventListener('beforeunload', () => stopTimeCopBgm());
document.querySelector('.hd-home')?.addEventListener('click', (e) => returnToHub(e));

(window as any).speak = function(text: string, isAutoPlay = false) {
  if (typeof speechSynthesis === 'undefined') return;

  // If it's a manual click and we are currently speaking, just stop it (toggle off)
  if (!isAutoPlay && isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    return;
  }

  // Otherwise, cancel any ongoing speech and start new
  speechSynthesis.cancel();
  
  const cleanText = normalizeTextForEnglishTts(text);
  const u = new SpeechSynthesisUtterance(cleanText);
  u.lang = 'en-US';

  const preferred = pickEnglishVoice();
  if (preferred) u.voice = preferred;

  u.volume = 1;
  // 調整為更接近真人說話的節奏與語調
  u.rate = 0.92;
  u.pitch = 1.08;
  
  u.onstart = () => { isSpeaking = true; };
  u.onend = () => { isSpeaking = false; };
  u.onerror = () => { isSpeaking = false; };
  
  // 只有在非自動播放，或者是自動播放且語音功能已解鎖的情況下才發聲
  if (!isAutoPlay || speechUnlocked) {
    speechSynthesis.speak(u);
  }
}

// Step elements
const STEPS  = [1,2,3].map(i => document.getElementById(`step${i}`)!);
const LINES  = [1,2].map(i => document.getElementById(`line${i}`)!);
const SLBLS  = [2,3].map(i => document.getElementById(`sl${i}`)!);

// ── Helpers ────────────────────────────────────────────────
function shuffle<T>(a:T[]): T[] {
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function pick<T>(a:T[]): T|undefined { return a.length ? a[Math.floor(Math.random()*a.length)] : undefined; }
function qs<T extends Element>(sel:string, ctx:Element|Document=document): T { return ctx.querySelector<T>(sel)! }

function hud() {
  HDC.textContent = String(S.crystals);
  HDL.innerHTML   = "❤️".repeat(Math.max(0,S.lives)) + '<span style="opacity:.3">❤️</span>'.repeat(Math.max(0,3-S.lives));
  HDP.textContent = `${S.correct} / ${S.total}`;
}

function showExp(icon:string, title:string, text:string, onNext:()=>void) {
  EXP_ICON.textContent=icon; EXP_TITLE.textContent=title; EXP_TEXT.textContent=text;
  EXP_MODAL.classList.remove("hidden");
  EXP_BTN.onclick=()=>{ EXP_MODAL.classList.add("hidden"); onNext(); };
}

// NPC config
const NPC_CFG: Record<string,{ring:string; signal:string; sign:string}> = {
  "Chief Carter":{ ring:"",      signal:"",    sign:"" },
  "NYC Commuter":{ ring:"ring-green", signal:"", sign:"green" },
  "Dr. Chronos": { ring:"ring-red",   signal:"red", sign:"red" },
};

function showNpc(el:Element, lines:NpcLine[], fallName:string, fallText:string) {
  const l = pick(lines);
  const name = l?.name ?? fallName;
  const text = l?.text ?? fallText;
  const c = NPC_CFG[name] ?? { ring:"", signal:"", sign:"" };
  const EMOJI: Record<string,string> = { "Chief Carter":"👮‍♂️", "NYC Commuter":"🗽", "Dr. Chronos":"🦹" };
  const emoji = EMOJI[name] ?? "👤";
  el.innerHTML = `
    <div class="npc-comm">
      <div class="npc-avatar-wrap">
        <div class="npc-avatar-ring ${c.ring}">${emoji}</div>
        <span class="npc-signal ${c.signal}"></span>
      </div>
      <div class="npc-body">
        <div class="npc-callsign ${c.sign}">${name.toUpperCase()}  //  LIVE</div>
        <div class="npc-bubble-tech">${text}</div>
      </div>
    </div>`;
}

function scene(el:Element, txt:string) {
  el.innerHTML = txt
    ? `<div class="mission-brief fade-in">${txt}</div>`
    : "";
}

function updateSteps(ph:Phase) {
  const ORDER:Phase[] = ["intro","l1","trans12","l2f","l2u","trans23","l3","victory"];
  const idx = ORDER.indexOf(ph);
  const lv  = idx <= 1 ? 0 : idx <= 4 ? 1 : 2;
  STEPS.forEach((s,i) => {
    s.className = "step-dot " + (i<lv ? "done" : i===lv ? "active" : "");
  });
  LINES.forEach((l,i) => {
    l.className = "step-line " + (i<lv ? "done" : i===lv ? "active" : "");
  });
  SLBLS.forEach((l,i) => {
    l.className = "step-label " + (i+1 < lv ? "done" : i+1 === lv ? "active" : "");
  });
}

// ═══════════════════════════════════════════════════════════
//  INTRO
// ═══════════════════════════════════════════════════════════
function renderIntro() {
  PTITLE.textContent = "TIME COP NYC // POLICE BASE";
  updateSteps("intro");
  const msg = "Time Cop, we have a Code Red! The bad Dr. Chronos has broken the clocks in New York. He has taken all the train times, hidden all the city holidays, and is now putting dangerous traps across the city! Your mission: Fix the time using the right time words. We need your help... now!";

  ROOT.innerHTML = `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;max-width:38rem;margin:auto;text-align:center" class="fade-in">
    <div style="width:6rem;height:6rem;border-radius:50%;border:2px solid var(--cyan);box-shadow:var(--glow-c);display:flex;align-items:center;justify-content:center;font-size:3rem;margin-bottom:1.2rem;background:var(--bg2);animation:pulseBadge 2.5s ease-in-out infinite">👮‍♂️</div>
    <h1 style="font-family:var(--mono);font-size:1.5rem;font-weight:900;color:var(--cyan);letter-spacing:.12em;text-shadow:var(--glow-c);margin-bottom:.35rem">CHIEF CARTER // LIVE</h1>
    <p style="font-family:var(--mono);font-size:.7rem;letter-spacing:.2em;color:var(--text-dim);margin-bottom:1.6rem">POLICE BASE  ·  URGENT MISSION</p>
    <button id="btn-listen" type="button" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>

    <div class="tc-panel glow-cyan" style="text-align:left;margin-bottom:1.5rem;width:100%;animation:fadeUp .5s ease">
      <div style="font-size:1rem;line-height:1.6;color:var(--text)">
        <p style="margin-bottom:.5rem"><strong>"Time Cop, we have a Code Red!"</strong></p>
        <p style="margin-bottom:.5rem"><strong>"The bad <span style="color:var(--red)">Dr. Chronos</span> has broken the clocks in New York. He has taken all the train times, hidden all the city holidays, and is now putting dangerous traps across the city!"</strong></p>
        <p style="color:var(--cyan);font-weight:bold">"Your mission: Fix the time using the right time words (in, on, at). We need your help... now!"</p>
      </div>
    </div>

    <button id="btn-start" class="btn-primary" style="padding:.9rem 3rem;font-size:1.05rem;letter-spacing:.06em">
      ▶  START MISSION
    </button>
  </div>`;

  // inject pulseBadge keyframe once
  if (!document.getElementById("kf-pulse")) {
    const s = document.createElement("style"); s.id="kf-pulse";
    s.textContent = `@keyframes pulseBadge{0%,100%{box-shadow:var(--glow-c)}50%{box-shadow:0 0 40px rgba(0,212,255,.7)}}`;
    document.head.appendChild(s);
  }
  qs<HTMLButtonElement>("#btn-start").onclick = () => {
    playEnterGameSfx();
    goPhase("l1");
  };

  qs<HTMLButtonElement>("#btn-listen").onclick = () => {
    (window as any).speak(msg);
  };
}

// ═══════════════════════════════════════════════════════════
//  LEVEL 1 — Whack-a-Mole MC
// ═══════════════════════════════════════════════════════════
const HOLES=6, MAX_MOLES=3, MOLE_MS=3800, TICK_MS=750;
let activeMoles: {hole:number;opt:string;btn:HTMLButtonElement;hide:number}[] = [];
let moleButtons: HTMLButtonElement[] = [];
let spawnTimer: number|null = null;
let l1Mistakes=0, l1Block=false;

function buildBoard(board:HTMLElement) {
  board.innerHTML=""; moleButtons=[];
  for (let i=0;i<HOLES;i++) {
    const w=document.createElement("div"); w.className="hole-wrap";
    const bg=document.createElement("div"); bg.className="hole-bg";
    const btn=document.createElement("button"); btn.type="button"; btn.className="mole"; btn.disabled=true;
    btn.innerHTML=`<span class="mole-face">🤖</span><div class="mole-sign"><span class="mole-sign-text"></span></div>`;
    w.appendChild(bg); w.appendChild(btn); board.appendChild(w); moleButtons.push(btn);
  }
}

function resetMole(btn:HTMLButtonElement) {
  btn.classList.remove("up","correct","wrong"); btn.disabled=true; btn.onclick=null;
  (btn.querySelector(".mole-face") as HTMLElement).textContent="🤖";
  (btn.querySelector(".mole-sign-text") as HTMLElement).textContent="";
}

function stopSpawn() {
  if (spawnTimer){ clearInterval(spawnTimer); spawnTimer=null; }
  activeMoles.forEach(m=>{ clearTimeout(m.hide); resetMole(m.btn); });
  activeMoles=[];
}

function startSpawn(onWhack:(o:string,b:HTMLButtonElement,h:number)=>void) {
  stopSpawn(); spawnMole(onWhack);
  spawnTimer=window.setInterval(()=>{ if(activeMoles.length<MAX_MOLES) spawnMole(onWhack); }, TICK_MS);
}

function spawnMole(onWhack:(o:string,b:HTMLButtonElement,h:number)=>void) {
  if (l1Block) return;
  const q=mcQs[S.l1i]; if(!q) return;
  if (activeMoles.length>=MAX_MOLES) return;
  const occ=new Set(activeMoles.map(m=>m.hole));
  const free=[...Array(HOLES).keys()].filter(i=>!occ.has(i));
  if (!free.length) return;
  const hole=free[Math.floor(Math.random()*free.length)];
  const opt=["A","B","C","D"][Math.floor(Math.random()*4)];
  const btn=moleButtons[hole];
  (btn.querySelector(".mole-sign-text") as HTMLElement).textContent=`${opt}. ${q.opts[opt]}`;
  (btn.querySelector(".mole-face") as HTMLElement).textContent="🤖";
  btn.classList.remove("correct","wrong"); btn.disabled=false;
  const hide=window.setTimeout(()=>{
    const m=activeMoles.find(m=>m.hole===hole&&m.hide===hide);
    if(m){ resetMole(m.btn); activeMoles=activeMoles.filter(x=>x.hole!==hole); }
  }, MOLE_MS);
  btn.onclick=()=>onWhack(opt,btn,hole);
  setTimeout(()=>btn.classList.add("up"),30);
  activeMoles.push({hole,opt,btn,hide});
}

  function renderL1() {
    if (S.l1i>=mcQs.length){ goPhase("trans12"); return; }
    const q=mcQs[S.l1i];
    PTITLE.textContent="MISSION 1  //  GRAND CENTRAL";
    updateSteps("l1"); l1Mistakes=0; l1Block=false;
  
    ROOT.innerHTML=`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto">
  
      <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:var(--cyan)">🚉 GRAND CENTRAL</span>
        <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l1i+1} / ${mcQs.length}</span>
      </div>
  
    <div id="l1-qcard" style="width:100%;text-align:center;padding:1rem 0;margin-bottom:1rem">
      <button onclick="speak('${q.scene.replace(/'/g, "\\'")} ${q.text.replace(/___/g, "blank").replace(/'/g, "\\'")}', false)" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
      <p style="font-size:1.1rem;color:#93c5fd;margin-bottom:1.5rem;line-height:1.5">${q.scene}</p>
      <p style="font-size:1.6rem;font-weight:800;color:#fff;line-height:1.6" id="l1-qtext"></p>
    </div>

    <div id="l1-fb" style="min-height:2rem;font-size:1.1rem;font-weight:bold;text-align:center;margin-bottom:1rem"></div>

    <div style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:var(--text-dim);text-align:center;margin-bottom:.5rem">
      ⚡ HIT THE RIGHT WORD (3 ATTEMPTS)
    </div>

    <div id="mole-board"
         style="display:grid;grid-template-columns:repeat(3,6.8rem);grid-template-rows:repeat(2,7rem);gap:.5rem 1rem;justify-content:center;width:fit-content"></div>
  </div>`;

  qs<HTMLElement>("#l1-qtext").innerHTML=q.text.replace(/___/g,'<span class="blank-hl">___</span>');
  buildBoard(qs("#mole-board"));

  function onWhack(opt:string, btn:HTMLButtonElement, hole:number) {
    if (l1Block||btn.disabled) return;
    const mole=activeMoles.find(m=>m.hole===hole); if(!mole) return;
    clearTimeout(mole.hide);
    stopSpawn();
    activeMoles.forEach(m=>{ if(m.hole!==hole) resetMole(m.btn); });
    activeMoles=[mole]; btn.disabled=true;

    const fb = qs<HTMLElement>("#l1-fb");

    if (opt===q.correct) {
      l1Block=true;
      (btn.querySelector(".mole-face") as HTMLElement).textContent="🤩";
      btn.classList.add("correct"); playCorrectSfx();
      S.crystals+=q.reward; S.correct++; hud();
      fb.style.color = "var(--green)";
      fb.textContent = "✅ Correct!";
      setTimeout(()=>{ S.l1i++; renderL1(); }, 800);
    } else {
      l1Mistakes++;
      (btn.querySelector(".mole-face") as HTMLElement).textContent="💀";
      btn.classList.add("wrong"); playWrongSfx();
      qs("#l1-qcard").classList.add("shake");
      fb.style.color = "var(--red)";
      fb.textContent = "❌ Try again!";
      if (l1Mistakes>=3) {
        S.lives--; hud(); l1Block=true;
        showExp("💀","Mission Report",q.exp,()=>{ S.l1i++; renderL1(); });
      } else {
        setTimeout(()=>{
          qs("#l1-qcard").classList.remove("shake");
          fb.textContent = "";
          resetMole(btn); activeMoles=[];
          if (!l1Block) startSpawn(onWhack);
        },800);
      }
    }
  }
  startSpawn(onWhack);
}

// ═══════════════════════════════════════════════════════════
//  TRANSITION
// ═══════════════════════════════════════════════════════════
function renderTransition(fromName:string, toName:string, icon:string, msg:string, next:Phase) {
  stopSpawn();
  ROOT.innerHTML=`
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;max-width:38rem;margin:auto;text-align:center" class="fade-in">
    <div style="font-size:3.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 20px rgba(16,185,129,.6))">✅</div>
    
    <div class="tc-panel glow-green" style="text-align:left;margin-bottom:1.5rem;width:100%;position:relative">
      <button onclick="speak('Great job! ${fromName.toUpperCase()} is safe. ' + '${msg.replace(/'/g, "\\'")}', false)" style="position:absolute;top:0;right:0;background:transparent;border:none;cursor:pointer;font-size:1.5rem;padding:0.5rem" title="Listen">🔊</button>
      <div style="font-size:1rem;line-height:1.6;color:var(--text)">
        <p style="margin-bottom:.5rem;color:var(--green);font-weight:bold">"Great job! ${fromName.toUpperCase()} is safe."</p>
        <p style="color:var(--text-dim)">"${msg}"</p>
      </div>
    </div>

    <div class="tc-panel" style="display:flex;gap:1.5rem;justify-content:center;margin-bottom:1.8rem;font-family:var(--mono);font-size:.82rem;width:100%">
      <span style="color:var(--gold)">🔮 ${S.crystals} CRYSTALS</span>
      <span style="color:var(--text-dim)">·</span>
      <span style="color:var(--red)">❤️ ${S.lives} LIVES</span>
    </div>

    <button id="btn-cont" class="btn-primary" style="padding:.85rem 2.5rem;font-size:.95rem;letter-spacing:.06em">
      ▶  GO TO ${toName.toUpperCase()}
    </button>
  </div>`;
  qs<HTMLButtonElement>("#btn-cont").onclick=()=>goPhase(next);
}

// ═══════════════════════════════════════════════════════════
//  LEVEL 2A — Fill-in
// ═══════════════════════════════════════════════════════════
function renderL2F() {
  if (S.l2fi>=fillQs.length){ goPhase("l2u"); return; }
  const q=fillQs[S.l2fi];
  PTITLE.textContent="MISSION 2A  //  LOST HOLIDAYS";
  updateSteps("l2f");

  ROOT.innerHTML=`
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto">

    <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:#fb923c">🗽 CALENDAR REPAIR (PART 1)</span>
      <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l2fi+1} / ${fillQs.length}</span>
    </div>

    <div style="width:100%;text-align:center;padding:1rem 0;margin-bottom:1rem">
      <button onclick="speak('${q.scene.replace(/'/g, "\\'")} ${q.text.replace(/___/g, "blank").replace(/'/g, "\\'")}', false)" style="background:transparent;border:none;cursor:pointer;font-size:1.5rem;margin-bottom:.5rem" title="Listen">🔊</button>
      <p style="font-size:1.1rem;color:#fdba74;margin-bottom:1.5rem;line-height:1.5">${q.scene}</p>
      <p style="font-size:1.6rem;font-weight:800;color:#fff;line-height:1.6" id="l2f-q"></p>
    </div>

    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:.7rem">
      <input type="text" id="l2f-inp" class="tc-input"
             placeholder="in / on / at" autocomplete="off" spellcheck="false" />
      <p style="font-size:.85rem;color:var(--text-dim);min-height:1rem;font-style:italic" id="l2f-hint"></p>
      <div style="display:flex;gap:.6rem;margin-top:.5rem">
        <button id="l2f-hint-btn" class="btn-amber">💡 Hint</button>
        <button id="l2f-submit"   class="btn-primary" style="padding:.55rem 1.6rem;font-size:.88rem">CHECK ✓</button>
      </div>
    </div>

    <div id="l2f-fb" style="display:none;width:100%;margin-top:1rem;text-align:center"></div>
  </div>`;

  qs<HTMLElement>("#l2f-q").innerHTML=q.text.replace(/___/g,'<span class="blank-hl">___</span>');
  const inp=qs<HTMLInputElement>("#l2f-inp");
  inp.focus();

  qs("#l2f-hint-btn").addEventListener("click",()=>{
    qs<HTMLElement>("#l2f-hint").textContent=`💡  ${q.hint}`;
  });

  function check() {
    const v=inp.value.trim().toLowerCase();
    const ok=v===q.primary.toLowerCase()||q.alts.some(a=>a&&a.toLowerCase()===v);
    const fb=qs<HTMLElement>("#l2f-fb");
    if (ok) {
      inp.className="tc-input ok";
      S.crystals+=q.reward; S.correct++; hud();
      fb.innerHTML=`<div class="fb-ok">✅ Correct! The word is <strong>"${q.primary}"</strong>.<br><span style="opacity:.8">${q.exp}</span></div>`;
      fb.style.display="block";
      playCorrectSfx();
      setTimeout(()=>{ S.l2fi++; renderL2F(); },2000);
    } else {
      inp.className="tc-input err";
      S.lives--; hud();
      fb.innerHTML=`<div class="fb-err">❌ ${q.feedback}<br><span style="opacity:.8">${q.exp}</span></div>`;
      fb.style.display="block";
      playWrongSfx();
      if (S.lives<=0){ setTimeout(()=>goPhase("l2u"),1500); return; }
      setTimeout(()=>{ inp.className="tc-input"; inp.value=""; inp.focus(); fb.style.display="none"; },2200);
    }
  }
  qs("#l2f-submit").addEventListener("click",check);
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter") check(); });
}

// ═══════════════════════════════════════════════════════════
//  LEVEL 2B — Unscramble
// ═══════════════════════════════════════════════════════════
let selTiles:{word:string;id:number;src:HTMLButtonElement}[]=[];

function renderL2U() {
  if (S.l2ui>=unscrQs.length){ goPhase("trans23"); return; }
  const q=unscrQs[S.l2ui];
  PTITLE.textContent="MISSION 2B  //  LOST HOLIDAYS";
  updateSteps("l2u"); selTiles=[];

  ROOT.innerHTML=`
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto">

    <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:#a78bfa">🗽 CALENDAR REPAIR (PART 2)</span>
      <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l2ui+1} / ${unscrQs.length}</span>
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
      <button id="u-reset"  class="btn-secondary">↩ Reset</button>
      <button id="u-submit" class="btn-primary" style="padding:.55rem 1.6rem;font-size:.88rem">SUBMIT ✓</button>
    </div>
    <div id="l2u-fb" style="display:none;width:100%;margin-top:1rem;text-align:center"></div>
  </div>`;

  const track=qs<HTMLElement>("#u-track");
  const ph=qs<HTMLElement>("#u-ph");
  const pool=qs<HTMLElement>("#u-pool");

  shuffle([...q.parts,...q.distractors]).forEach((word,i)=>{
    const isDist=q.distractors.includes(word)&&!q.parts.includes(word);
    const tile=document.createElement("button"); tile.type="button";
    tile.className="word-tile"+(isDist?" dist":""); tile.textContent=word;
    tile.addEventListener("click",()=>addTile(tile,word,i,ph,track));
    pool.appendChild(tile);
  });

  qs("#u-reset").addEventListener("click",()=>{
    selTiles=[];
    pool.querySelectorAll(".word-tile.selected").forEach(t=>t.classList.remove("selected"));
    track.innerHTML=""; track.appendChild(ph); (ph as HTMLElement).style.display="";
  });

  qs("#u-submit").addEventListener("click",()=>{
    const ans=selTiles.map(t=>t.word).join(" ");
    const fb=qs<HTMLElement>("#l2u-fb");
    if (ans.trim()===q.target.trim()) {
      S.crystals+=q.reward; S.correct++; hud();
      fb.innerHTML=`<div class="fb-ok">✅ Perfect! <strong>${q.target}</strong><br><span style="opacity:.8">${q.exp}</span></div>`;
      fb.style.display="block";
      playCorrectSfx();
      setTimeout(()=>{ S.l2ui++; renderL2U(); },2000);
    } else {
      S.lives--; hud();
      fb.innerHTML=`<div class="fb-err">❌ Not quite.<br>✅ <strong>${q.target}</strong><br><span style="opacity:.8">${q.exp}</span></div>`;
      fb.style.display="block";
      playWrongSfx();
      if (S.lives<=0){ setTimeout(()=>goPhase("trans23"),1500); return; }
      setTimeout(()=>{ qs<HTMLButtonElement>("#u-reset").click(); fb.style.display="none"; },2500);
    }
  });
}

function addTile(tile:HTMLButtonElement, word:string, id:number, ph:HTMLElement, track:HTMLElement) {
  if (tile.classList.contains("selected")||tile.classList.contains("dist")) return;
  tile.classList.add("selected"); ph.style.display="none";
  selTiles.push({word,id,src:tile});
  const chip=document.createElement("button"); chip.type="button";
  chip.className="word-tile"; chip.textContent=word;
  chip.style.fontSize=".78rem";
  chip.addEventListener("click",()=>{
    track.removeChild(chip);
    selTiles=selTiles.filter(t=>t.id!==id);
    tile.classList.remove("selected");
    if (!track.children.length){ track.appendChild(ph); ph.style.display=""; }
  });
  track.appendChild(chip);
}

// ═══════════════════════════════════════════════════════════
//  LEVEL 3 — Bomb Defuse
// ═══════════════════════════════════════════════════════════
const BOMB_SECS=12;
let bombTimer:number|null=null, bombLeft=BOMB_SECS, l3Live=false;

function stopBomb(){ if(bombTimer){ clearInterval(bombTimer); bombTimer=null; } }

function renderL3() {
  if (S.l3i>=bombQs.length){ goPhase("victory"); return; }
  const q=bombQs[S.l3i];
  PTITLE.textContent="MISSION 3  //  ZERO-PREPOSITION TRAP";
  updateSteps("l3"); bombLeft=BOMB_SECS; l3Live=true; stopBomb();

  ROOT.innerHTML=`
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:42rem;margin:0 auto;padding:.75rem .75rem 1.5rem;gap:.7rem;overflow-y:auto;background:rgba(239,68,68,.02)">

    <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <span style="font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;color:var(--red)">💣 BOMB DISPOSAL</span>
      <span style="font-family:var(--mono);font-size:.7rem;color:var(--text-dim)">${S.l3i+1} / ${bombQs.length}</span>
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

      <div style="text-align:center;font-family:var(--mono);font-size:.75rem;letter-spacing:.1em;color:rgba(239,68,68,.9);margin-bottom:1rem;font-weight:bold">
        ⚡ CLICK THE FAKE TIME WORD TO DEFUSE ⚡
      </div>

      <div id="bomb-sent"
           style="text-align:center;font-size:1.3rem;font-weight:700;line-height:2;color:#cbd5e1;letter-spacing:.02em;margin-bottom:.5rem;padding:1rem;border:1px solid rgba(239,68,68,.2);border-radius:.5rem;background:rgba(0,0,0,.3)">
      </div>
      
      <p style="text-align:center;font-size:.85rem;color:rgba(239,68,68,.7);font-style:italic;min-height:1rem" id="bomb-hint"></p>
    </div>

    <div style="width:100%;text-align:center;font-size:.85rem;color:#fde68a;opacity:.8">
      📌 <strong>Rule:</strong> Do not use in/on/at before <strong style="color:#fff">this / next / last / every / today / tomorrow / yesterday</strong>
    </div>

    <div id="l3-fb" style="display:none;width:100%;margin-top:1rem;text-align:center"></div>
  </div>`;

  buildBombSentence(q);
  startBombTimer(q);
}

function buildBombSentence(q:BombQ) {
  const el=qs<HTMLElement>("#bomb-sent");
  const errStart=q.wrong.indexOf(q.error);
  if (errStart<0){ el.textContent=q.wrong; return; }
  const before=q.wrong.slice(0,errStart);
  const after=q.wrong.slice(errStart+q.error.length);
  const errWords=q.error.trim().split(/\s+/);
  el.innerHTML="";

  before.trim().split(/\s+/).filter(Boolean).forEach(w=>{
    const b=document.createElement("button"); b.className="decoy-btn"; b.textContent=w+" ";
    b.addEventListener("click",()=>wrongClick(q)); el.appendChild(b);
  });
  errWords.forEach((w,i)=>{
    if (i===0) {
      const b=document.createElement("button"); b.className="error-word"; b.textContent=w+" ";
      b.title="Click to defuse!"; b.addEventListener("click",()=>correctClick(q)); el.appendChild(b);
    } else {
      const s=document.createElement("span"); s.style.cssText="color:#94a3b8;font-weight:700"; s.textContent=w+" ";
      el.appendChild(s);
    }
  });
  after.trim().split(/\s+/).filter(Boolean).forEach(w=>{
    const b=document.createElement("button"); b.className="decoy-btn"; b.textContent=w+" ";
    b.addEventListener("click",()=>wrongClick(q)); el.appendChild(b);
  });
}

function correctClick(q:BombQ) {
  if (!l3Live) return; l3Live=false; stopBomb();
  qs<HTMLElement>("#bomb-emoji").textContent="✅";
  const card=qs<HTMLElement>("#bomb-card");
  card.style.borderColor="var(--green)"; card.style.boxShadow="0 4px 24px rgba(0,0,0,.5),var(--glow-g)";
  S.crystals+=bombQs[S.l3i].reward; S.correct++; hud();
  const fb=qs<HTMLElement>("#l3-fb");
  fb.innerHTML=`<div class="fb-ok">✅ DEFUSED! Correct: <strong>"${q.correct}"</strong><br><span style="opacity:.8">${q.exp}</span></div>`;
  fb.style.display="block"; playCorrectSfx();
  setTimeout(()=>{ S.l3i++; renderL3(); },2200);
}

function wrongClick(q:BombQ) {
  if (!l3Live) return;
  S.lives--; hud(); playWrongSfx();
  const fb=qs<HTMLElement>("#l3-fb");
  fb.innerHTML=`<div class="fb-err">❌ Not that word! Find the extra <strong>in/on/at</strong> before "${q.trigger}".</div>`;
  fb.style.display="block";
  qs<HTMLElement>("#bomb-hint").textContent=`💡  ${q.hint}`;
  if (S.lives<=0){ stopBomb(); l3Live=false; setTimeout(()=>goPhase("victory"),1500); }
}

function startBombTimer(q:BombQ) {
  const secsEl=qs<HTMLElement>("#bomb-secs");
  const bar=qs<HTMLElement>("#bomb-bar");
  bombTimer=window.setInterval(()=>{
    bombLeft--;
    secsEl.textContent=String(bombLeft);
    secsEl.className=bombLeft<=3 ? "tick" : "";
    const pct=(bombLeft/BOMB_SECS)*100;
    bar.style.width=pct+"%";
    bar.style.background=pct>50?"var(--green)":pct>25?"var(--gold)":"var(--red)";
    if (bombLeft<=0) {
      stopBomb(); l3Live=false;
      qs<HTMLElement>("#bomb-emoji").textContent="💥";
      S.lives--; hud();
      const fb=qs<HTMLElement>("#l3-fb");
      fb.innerHTML=`<div class="fb-err">💥 BOOM! Time's up! Correct: <strong>"${q.correct}"</strong><br><span style="opacity:.8">${q.exp}</span></div>`;
      fb.style.display="block";
      playWrongSfx();
      if (S.lives<=0){ setTimeout(()=>goPhase("victory"),2000); return; }
      setTimeout(()=>{ S.l3i++; renderL3(); },2800);
    }
  },1000);
}

// ═══════════════════════════════════════════════════════════
//  VICTORY
// ═══════════════════════════════════════════════════════════
function renderVictory() {
  stopSpawn(); stopBomb();
  PTITLE.textContent="MISSION COMPLETE  //  NEW YORK IS SAFE";
  const win=S.crystals>=15;
  const rank=S.crystals>=50?"👑 Time Lord":S.crystals>=25?"🏅 Inspector":S.crystals>=10?"🕵️ Detective":"🔰 Rookie";

  const prev=parseInt(localStorage.getItem("time_cop_crystals")||"0");
  localStorage.setItem("time_cop_crystals",String(prev+S.crystals));
  if (win) ["1","2","3"].forEach(n=>localStorage.setItem(`time_cop_level${n}_complete`,"true"));

  const npcMsg = win 
    ? `"Fantastic work, Time Cop! You stopped Dr. Chronos and fixed the time in New York. Everyone is safe, and the time words are correct again."`
    : `"We lost some time pieces, but you are safe. Go back to base, rest, and practice your time words. Dr. Chronos will come back!"`;

  ROOT.innerHTML=`
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;max-width:38rem;margin:auto;text-align:center" class="fade-in">
    <div style="font-size:4.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 24px rgba(${win?"16,185,129":"245,158,11"},.7))">${win?"🏆":"💪"}</div>
    
    <div class="tc-panel glow-${win?"green":"gold"}" style="text-align:left;margin-bottom:1.5rem;width:100%;position:relative">
      <button onclick="speak('${npcMsg.replace(/'/g, "\\'").replace(/"/g, "")}', false)" style="position:absolute;top:0;right:0;background:transparent;border:none;cursor:pointer;font-size:1.5rem;padding:0.5rem" title="Listen">🔊</button>
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
          <div style="font-size:1rem">${"❤️".repeat(Math.max(0,S.lives))}</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center">
      <button id="btn-again" class="btn-primary" style="padding:.75rem 1.8rem">🔄 Play Again</button>
      <a href="../index.html" class="btn-secondary" style="padding:.75rem 1.8rem;text-decoration:none;font-weight:700">🏠 Return to Hub</a>
    </div>
  </div>`;
  qs<HTMLButtonElement>("#btn-again").onclick=()=>startGame();
  document.querySelector<HTMLAnchorElement>('a[href="../index.html"]')?.addEventListener("click", (e) => returnToHub(e));
}

// ═══════════════════════════════════════════════════════════
//  PHASE ROUTER
// ═══════════════════════════════════════════════════════════
function goPhase(ph:Phase) {
  S.phase=ph; updateSteps(ph); stopSpawn(); stopBomb(); l3Live=false;
  switch(ph) {
    case "intro":
      setTimeCopBgm("mission1");
      renderIntro(); break;
    case "l1":
      setTimeCopBgm("mission1");
      renderL1(); break;
    case "trans12": renderTransition("Grand Central 🚉","The Lost Holidays 🗽","🚉",
      "The trains are running again! But Chronos is not done. He has hidden all the city holidays from the calendar. Go and bring them back!",
      "l2f"); break;
    case "l2f":
      setTimeCopBgm("mission2");
      renderL2F(); break;
    case "l2u":
      setTimeCopBgm("mission2");
      renderL2U(); break;
    case "trans23": renderTransition("Lost Holidays 🗽","Zero Trap 💣","🗽",
      "The holidays are back! Wait... we see strange things on our screens. Chronos is putting traps across the city! We need you to stop them before it's too late!",
      "l3"); break;
    case "l3":
      setTimeCopBgm("mission3");
      renderL3(); break;
    case "victory":
      setTimeCopBgm("victory");
      renderVictory(); break;
  }
}

// ═══════════════════════════════════════════════════════════
//  DATA LOADER
// ═══════════════════════════════════════════════════════════
function loadData() {
  mcQs=[]; fillQs=[]; unscrQs=[]; bombQs=[];
  Object.keys(npc).forEach(k=>npc[k]=[]);

  parseCsv("TimeCop-L1-MorningChaos-MC.csv")
    .filter(r=>r.length>=10&&["A","B","C","D"].includes(r[7].toUpperCase()))
    .forEach(r=>mcQs.push({ scene:r[1],text:r[2],
      opts:{A:r[3],B:r[4],C:r[5],D:r[6]}, correct:r[7].toUpperCase(),
      exp:r[9], reward:parseInt(r[10])||1 }));

  parseCsv("TimeCop-L2-LostHolidays-Fillin.csv")
    .filter(r=>r.length>=10)
    .forEach(r=>fillQs.push({ scene:r[1],text:r[2],primary:r[3],
      alts:r[4].split("|").filter(Boolean),
      feedback:r[7],hint:r[8],exp:r[9],reward:parseInt(r[10])||1 }));

  parseCsv("TimeCop-L2-LostHolidays-Unscramble.csv")
    .filter(r=>r.length>=8)
    .forEach(r=>unscrQs.push({ scene:r[1],target:r[2],
      parts:r[3].split("|").filter(Boolean),
      distractors:r[4].split("|").filter(Boolean),
      exp:r[7],reward:parseInt(r[8])||1 }));

  parseCsv("TimeCop-L3-ZeroTrap-Correction.csv")
    .filter(r=>r.length>=9)
    .forEach(r=>bombQs.push({ scene:r[1],wrong:r[2],error:r[3],correct:r[4],
      trigger:r[6],hint:r[7],exp:r[8],reward:parseInt(r[9])||2 }));

  parseCsv("TimeCop-NPC-Dialogues.csv").forEach(r=>{
    if (r.length<7) return;
    const obj:NpcLine={name:r[2],text:r[4]};
    const lvl=r[1], trig=r[6];
    const map:Record<string,[string,string]> = {
      "1": ["l1s","l1ok"], "2":["l2s","l2ok"], "3":["l3s","l3ok"],
    };
    if (trig==="on_level_start") npc[`l${lvl}s`]?.push(obj);
    if (trig==="on_correct")     npc[`l${lvl}ok`]?.push(obj);
    if (trig==="on_wrong")       npc[`l${lvl}no`]?.push(obj);
  });

  shuffle(mcQs); shuffle(fillQs); shuffle(unscrQs); shuffle(bombQs);
}

// ═══════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════
function startGame() {
  Object.assign(S,{ phase:"intro" as Phase, crystals:0, lives:3, correct:0,
                    l1i:0, l2fi:0, l2ui:0, l3i:0 });
  S.total=mcQs.length+fillQs.length+unscrQs.length+bombQs.length;
  shuffle(mcQs); shuffle(fillQs); shuffle(unscrQs); shuffle(bombQs);
  hud(); goPhase("intro");
}

try {
  loadData();
  const ld=document.getElementById("load-detail");
  if (ld) ld.textContent=`${mcQs.length} MC  ·  ${fillQs.length} Fill-in  ·  ${unscrQs.length} Unscramble  ·  ${bombQs.length} Bomb`;
  startGame();
} catch(e) {
  console.error(e);
  ROOT.innerHTML=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center">
    <div style="color:var(--red)">
      <p style="font-size:1.2rem;font-weight:700;margin-bottom:.5rem">⚠️ DATA LOAD FAILURE</p>
      <p style="font-size:.8rem;color:var(--text-dim)">${e}</p>
    </div>
  </div>`;
}
