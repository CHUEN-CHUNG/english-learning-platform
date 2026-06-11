export function parseCSVLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { parts.push(current); current = ''; }
    else { current += char; }
  }
  parts.push(current);
  return parts;
}

export function parseCSVRows(csv: string): string[][] {
  return csv.trim().split('\n')
    .slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => parseCSVLine(line));
}
