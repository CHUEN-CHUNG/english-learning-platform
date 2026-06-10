/**
 * Loads Super Traveler Quest scenario banks from CSV under
 * content/grammar/.../Super-Traveler-Quest/
 */

const csvModules = {
  ...import.meta.glob("../../../../content/grammar/**/Super-Traveler-Quest/**/*.csv", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
  ...import.meta.glob("../../../../Content/grammar/**/Super-Traveler-Quest/**/*.csv", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
} as Record<string, string>;

function csvRaw(filename: string): string {
  const key = Object.keys(csvModules).find((k) =>
    k.replace(/\\/g, "/").endsWith(`/${filename}`),
  );
  if (!key) {
    throw new Error(`Traveler Quest CSV not found: ${filename}`);
  }
  return csvModules[key];
}

function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((p) => p.trim());
}

function parseCsvRows(filename: string): string[][] {
  const text = csvRaw(filename).replace(/^\uFEFF/, "").trim();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => parseCsvLine(line));
}

/** Multiple regex patterns in one CSV cell — use `;;` (not `|`, which is regex OR). */
const PATTERN_SEP = ";;";

function patternsFromCell(cell: string): RegExp[] {
  if (!cell?.trim()) return [];
  return cell
    .split(PATTERN_SEP)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      try {
        return new RegExp(p, "i");
      } catch (err) {
        console.warn("[Traveler Quest] Invalid regex in CSV:", p, err);
        return null;
      }
    })
    .filter((r): r is RegExp => r !== null);
}

function parseBool(cell: string): boolean {
  return /^true$/i.test(cell.trim());
}

// ─── Level 1: Transport & Status ───

export interface DestinationRow {
  label: string;
  question: string;
}

export interface StatusCardRow {
  id: string;
  emoji: string;
  label: string;
  npcQuestion: string;
  expectedPatterns: RegExp[];
  hint: string;
}

export function loadTransportDestinations(): DestinationRow[] {
  return parseCsvRows("Transport-Status-Destinations.csv").map((r) => ({
    label: r[0],
    question: r[1],
  }));
}

export function loadTransportStatusCards(): StatusCardRow[] {
  return parseCsvRows("Transport-Status-StatusCards.csv").map((r) => ({
    id: r[0],
    emoji: r[1],
    label: r[2],
    npcQuestion: r[3],
    expectedPatterns: patternsFromCell(r[4]),
    hint: r[5],
  }));
}

// ─── Level 2: New Class Icebreakers ───

export interface ClassmateRow {
  emoji: string;
  label: string;
}

export interface WheelActivityRow {
  id: string;
  label: string;
  activity: string;
  verb: string;
  be?: boolean;
}

export interface NpcFreqTemplateRow {
  type: "be" | "regular";
  template: string;
}

export function loadNewClassClassmates(): ClassmateRow[] {
  return parseCsvRows("New-Class-Classmates.csv").map((r) => ({
    emoji: r[0],
    label: r[1],
  }));
}

export function loadNewClassWheelActivities(): WheelActivityRow[] {
  return parseCsvRows("New-Class-WheelActivities.csv").map((r) => ({
    id: r[0],
    label: r[1],
    activity: r[2],
    verb: r[3],
    be: parseBool(r[4]) ? true : undefined,
  }));
}

export function loadNewClassNpcFreqTemplates(): NpcFreqTemplateRow[] {
  return parseCsvRows("New-Class-NpcFreqAnswers.csv").map((r) => ({
    type: r[0].toLowerCase() === "be" ? "be" : "regular",
    template: r[1],
  }));
}

export function pickNpcFreqAnswerFromBank(
  act: WheelActivityRow,
  templates: NpcFreqTemplateRow[],
): string {
  const pool = templates.filter((t) => t.type === (act.be ? "be" : "regular"));
  if (!pool.length) {
    return act.be ? `I am usually ${act.activity.replace(/^be\s+/i, "")}.` : `I usually ${act.activity}.`;
  }
  const tpl = pool[Math.floor(Math.random() * pool.length)].template;
  if (act.be) {
    const adj = act.activity.replace(/^be\s+/i, "");
    return tpl.replace(/\{adj\}/g, adj);
  }
  return tpl.replace(/\{activity\}/g, act.activity);
}

// ─── Level 3: Souvenir Shop ───

export interface ShopItemRow {
  id: string;
  emoji: string;
  label: string;
  display: string;
  countable: boolean;
  unitPrice: number;
  priceDemo: string;
}

export interface NpcErrorRow {
  id: string;
  context: string;
  wrongLine: string;
  correctLine: string;
  correctPatterns: RegExp[];
  hint: string;
}

export function loadSouvenirShopItems(): ShopItemRow[] {
  return parseCsvRows("Souvenir-Shop-Items.csv").map((r) => ({
    id: r[0],
    emoji: r[1],
    label: r[2],
    display: r[3],
    countable: parseBool(r[4]),
    unitPrice: Number(r[5]),
    priceDemo: r[6],
  }));
}

export function loadSouvenirNpcErrors(): NpcErrorRow[] {
  return parseCsvRows("Souvenir-Shop-NpcErrors.csv").map((r) => ({
    id: r[0],
    context: r[1],
    wrongLine: r[2],
    correctLine: r[3],
    correctPatterns: patternsFromCell(r[4]),
    hint: r[5],
  }));
}
