/* From catch8 src/lib/answer/markdown-plugins.ts: a table as words, and a cell's number. */

export interface TableData {
  headers: string[];
  rows: string[][];
}

export function cellNumber(cell: string): number | null {
  const western = cell.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/٫/g, ".").replace(/٬/g, ",");
  const m = /-?\d[\d,]*(?:\.\d+)?/.exec(western);
  if (!m) return null;
  const letters = western.replace(/[\d.,\s%$€£¥+\-–]/g, "");
  if (letters.length > 12) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
