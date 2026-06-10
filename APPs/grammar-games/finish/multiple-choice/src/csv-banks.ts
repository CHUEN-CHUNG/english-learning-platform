/** 以獨立 asset URL 載入 CSV，避免 raw 與其他 chunk 錯位 */
export const csvUrlModules = import.meta.glob(
  "../../../../../content/grammar/**/*.csv",
  {
    query: "?url",
    import: "default",
    eager: true,
  },
);

export function findCsvUrlForUnit(unitName: string): string | null {
  const key = Object.keys(csvUrlModules).find((k) =>
    k.includes(`${unitName}.csv`),
  );
  if (!key) return null;
  const url = csvUrlModules[key];
  return typeof url === "string" ? url : null;
}
