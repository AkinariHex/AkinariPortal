// Rows pasted from a spreadsheet (Google Sheets / Excel copy = TSV), CSV, or
// typed by hand with spaces ("NM1 4500604"). Separator, picked once for the
// whole paste: tab if any, else comma if any, else runs of whitespace (so names
// with spaces need a tab or comma). Empty lines are dropped; a first row whose
// first cell matches `header` is skipped.
export function parseSheet(text: string, header?: RegExp): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sep = lines.some((l) => l.includes("\t")) ? "\t" : lines.some((l) => l.includes(",")) ? "," : /\s+/;
  const rows = lines.map((l) => l.split(sep).map((c) => c.trim()).filter((c, i, all) => c || i < all.length - 1));
  if (header && rows[0] && header.test(rows[0][0] ?? "")) rows.shift();
  return rows;
}
