export type CurrencyCode = "JPY" | "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "SGD";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
};

// Approximate exchange rates from JPY (as of typical rates)
// In production, these would come from an API
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  JPY: 1,
  USD: 0.0067, // ~150 JPY = 1 USD
  EUR: 0.0062, // ~161 JPY = 1 EUR
  GBP: 0.0053, // ~189 JPY = 1 GBP
  AUD: 0.0103, // ~97 JPY = 1 AUD
  CAD: 0.0092, // ~109 JPY = 1 CAD
  SGD: 0.0090, // ~111 JPY = 1 SGD
};

export function convertFromYen(
  yenAmount: number,
  targetCurrency: CurrencyCode,
): number {
  return yenAmount * EXCHANGE_RATES[targetCurrency];
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
): string {
  const info = CURRENCIES[currency];
  const fractionDigits = currency === "JPY" ? 0 : 2;

  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatPrice(yenAmount: number, currency: CurrencyCode): string {
  const converted = convertFromYen(yenAmount, currency);
  return formatCurrency(converted, currency);
}
