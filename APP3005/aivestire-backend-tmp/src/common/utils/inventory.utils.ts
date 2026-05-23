/** Coerce API/JSON stock values to a non-negative integer. */
export function coerceStockQuantity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(Math.max(0, Math.trunc(value)), 99999);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return 0;
    const n = parseInt(trimmed, 10);
    return Number.isFinite(n) ? Math.min(Math.max(0, n), 99999) : 0;
  }
  return 0;
}

/** Sum units from ProductColorSizeStock rows (single source of truth). */
export function sumSizeStockRows(
  sizeStocks: { stock: unknown }[] | undefined | null,
): number {
  return (sizeStocks ?? []).reduce(
    (sum, row) => sum + coerceStockQuantity(row.stock),
    0,
  );
}
