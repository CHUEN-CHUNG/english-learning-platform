/** Standalone module — same logic as english-tts.ts */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

function numberUnder100(n) {
  if (n < 20) return ONES[n] ?? String(n);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : (TENS[tens] ?? String(n));
}

function clockTimeToWords(hour, minute) {
  const h12 = hour % 12 || 12;
  const hourWord = numberUnder100(h12);
  if (minute === 0) return `${hourWord} o'clock`;
  if (minute < 10) return `${hourWord} oh ${numberUnder100(minute)}`;
  return `${hourWord} ${numberUnder100(minute)}`;
}

export function normalizeTextForEnglishTts(text) {
  let s = text
    .replace(/<[^>]+>/g, "")
    .replace(/___/g, " blank ")
    .replace(/_/g, " ");

  s = s.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) =>
    clockTimeToWords(parseInt(h, 10), parseInt(m, 10)),
  );

  s = s.replace(/\.{2,}/g, ", ");
  s = s.replace(/…/g, ", ");
  s = s.replace(/:/g, ", ");
  s = s.replace(/@/g, " at ");
  s = s.replace(/&/g, " and ");
  s = s.replace(/\//g, " or ");
  s = s.replace(/·/g, ", ");
  s = s.replace(/[—–－]/g, ", ");

  return s.replace(/\s+/g, " ").trim();
}

export function pickEnglishVoice() {
  if (typeof speechSynthesis === "undefined") return undefined;
  const english = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"));

  return (
    english.find(
      (v) => v.name.includes("Natural") || v.name.includes("Online (Natural)"),
    ) ||
    english.find((v) => v.name.includes("Premium")) ||
    english.find((v) => v.name.includes("Google US English")) ||
    english.find((v) => v.name.includes("Samantha")) ||
    english.find((v) => v.name.includes("Aria")) ||
    english.find((v) => v.lang === "en-US") ||
    english[0]
  );
}

export function speakEnglish(text, opts = {}) {
  if (typeof speechSynthesis === "undefined") return;
  const line = normalizeTextForEnglishTts(text);
  if (!line) return;

  if (opts.cancelPrevious !== false) speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(line);
  utterance.lang = "en-US";
  const voice = pickEnglishVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = opts.rate ?? 0.95;
  if (opts.pitch != null) utterance.pitch = opts.pitch;
  if (opts.onStart) utterance.onstart = opts.onStart;
  if (opts.onEnd) utterance.onend = opts.onEnd;
  if (opts.onError) utterance.onerror = opts.onError;

  speechSynthesis.speak(utterance);
}

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
