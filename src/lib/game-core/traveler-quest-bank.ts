/**
 * Loads Super Traveler Quest scenario banks from CSV under static/content/grammar/
 * Rewritten to use fetch() for SvelteKit static adapter compatibility.
 */

import { base } from '$app/paths';
import { parseCSVLine } from '$lib/utils/csv-parser';

const CONTENT_BASE = `${base}/content/grammar`;

async function fetchCsv(filename: string): Promise<string> {
  // Search for the file under any time-tense subdirectory
  // Filenames are unique across the tree, so we try known paths
  const paths = [
    `${CONTENT_BASE}/time-tense/Super-Traveler-Quest/${filename}`,
    `${CONTENT_BASE}/Super-Traveler-Quest/${filename}`,
  ];

  for (const path of paths) {
    const res = await fetch(path);
    if (res.ok) return res.text();
  }
  throw new Error(`Traveler Quest CSV not found: ${filename}`);
}

function parseCsvLines(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => parseCSVLine(line).map((p) => p.trim()));
}

/** Multiple regex patterns in one CSV cell — use `;;` as separator. */
const PATTERN_SEP = ';;';

function patternsFromCell(cell: string): RegExp[] {
  if (!cell?.trim()) return [];
  return cell
    .split(PATTERN_SEP)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      try { return new RegExp(p, 'i'); }
      catch (err) { console.warn('[Traveler Quest] Invalid regex in CSV:', p, err); return null; }
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

export async function loadTransportDestinations(): Promise<DestinationRow[]> {
  const text = await fetchCsv('Transport-Status-Destinations.csv');
  return parseCsvLines(text).map((r) => ({ label: r[0], question: r[1] }));
}

export async function loadTransportStatusCards(): Promise<StatusCardRow[]> {
  const text = await fetchCsv('Transport-Status-StatusCards.csv');
  return parseCsvLines(text).map((r) => ({
    id: r[0], emoji: r[1], label: r[2], npcQuestion: r[3],
    expectedPatterns: patternsFromCell(r[4]), hint: r[5],
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
  type: 'be' | 'regular';
  template: string;
}

export async function loadNewClassClassmates(): Promise<ClassmateRow[]> {
  const text = await fetchCsv('New-Class-Classmates.csv');
  return parseCsvLines(text).map((r) => ({ emoji: r[0], label: r[1] }));
}

export async function loadNewClassWheelActivities(): Promise<WheelActivityRow[]> {
  const text = await fetchCsv('New-Class-WheelActivities.csv');
  return parseCsvLines(text).map((r) => ({
    id: r[0], label: r[1], activity: r[2], verb: r[3],
    be: parseBool(r[4]) ? true : undefined,
  }));
}

export async function loadNewClassNpcFreqTemplates(): Promise<NpcFreqTemplateRow[]> {
  const text = await fetchCsv('New-Class-NpcFreqAnswers.csv');
  return parseCsvLines(text).map((r) => ({
    type: r[0].toLowerCase() === 'be' ? 'be' : 'regular',
    template: r[1],
  }));
}

export function pickNpcFreqAnswerFromBank(
  act: WheelActivityRow,
  templates: NpcFreqTemplateRow[],
): string {
  const pool = templates.filter((t) => t.type === (act.be ? 'be' : 'regular'));
  if (!pool.length) {
    return act.be
      ? `I am usually ${act.activity.replace(/^be\s+/i, '')}.`
      : `I usually ${act.activity}.`;
  }
  const tpl = pool[Math.floor(Math.random() * pool.length)].template;
  if (act.be) {
    const adj = act.activity.replace(/^be\s+/i, '');
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

export async function loadSouvenirShopItems(): Promise<ShopItemRow[]> {
  const text = await fetchCsv('Souvenir-Shop-Items.csv');
  return parseCsvLines(text).map((r) => ({
    id: r[0], emoji: r[1], label: r[2], display: r[3],
    countable: parseBool(r[4]),
    unitPrice: Number(r[5]),
    priceDemo: r[6],
  }));
}

export async function loadSouvenirNpcErrors(): Promise<NpcErrorRow[]> {
  const text = await fetchCsv('Souvenir-Shop-NpcErrors.csv');
  return parseCsvLines(text).map((r) => ({
    id: r[0], context: r[1], wrongLine: r[2], correctLine: r[3],
    correctPatterns: patternsFromCell(r[4]),
    hint: r[5],
  }));
}
