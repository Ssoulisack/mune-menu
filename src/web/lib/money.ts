// Prices are stored as integers in the currency's minor unit.
// Decimals are fixed here rather than read from Intl, whose answer for some currencies
// (LAK, KHR...) differs between browsers — that would turn ₭25,000 into ₭250.00.
const ZERO_DECIMAL = new Set(["LAK", "KHR", "VND", "JPY", "KRW", "IDR", "MMK", "CLP", "ISK", "PYG", "UGX", "XAF", "XOF"]);

const fractionDigits = (currency: string) => (ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2);

export function formatPrice(minor: number, currency: string, locale?: string) {
  const digits = fractionDigits(currency);
  const value = minor / 10 ** digits;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency}`;
  }
}

/** Minor units → string for an <input>, e.g. 1450 USD → "14.50", 25000 LAK → "25000" */
export function toPriceInput(minor: number, currency: string) {
  const digits = fractionDigits(currency);
  return (minor / 10 ** digits).toFixed(digits);
}

/** Input string → minor units, or null if it isn't a valid non-negative amount. */
export function parsePriceInput(input: string, currency: string): number | null {
  const n = Number(input.replace(/[,\s₭]/g, ""));
  if (!input.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10 ** fractionDigits(currency));
}

export const pricePlaceholder = (currency: string) => (fractionDigits(currency) ? "0.00" : "0");
