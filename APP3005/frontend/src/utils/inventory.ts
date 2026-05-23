/** Parse a stock quantity from user input (digits only, capped). */
export function parseStockInput(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '') return 0;
  if (!/^\d+$/.test(trimmed)) return 0;
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 99999);
}

/** Coerce unknown JSON values to a safe stock integer. */
export function coerceStockQuantity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(Math.max(0, Math.trunc(value)), 99999);
  }
  if (typeof value === 'string') return parseStockInput(value);
  return 0;
}

/** Sum units from per-size stock map (creator upload forms). */
export function sumSizeStockMap(sizeStocks?: Record<string, unknown>): number {
  return Object.values(sizeStocks ?? {}).reduce(
    (sum, n) => sum + coerceStockQuantity(n),
    0,
  );
}

/** Commit string drafts → numeric size_stocks map. */
export function commitSizeStockDrafts(
  drafts: Record<string, string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [size, raw] of Object.entries(drafts)) {
    out[size] = parseStockInput(raw);
  }
  return out;
}
