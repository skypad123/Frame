export function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function containsJapanese(text: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function isLikelySetCode(query: string): boolean {
  return /^[A-Z0-9]{2,6}-[A-Z]{0,2}\d{0,3}$/i.test(query.trim());
}
