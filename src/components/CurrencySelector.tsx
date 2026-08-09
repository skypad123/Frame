"use client";

import { useCurrency } from "@/lib/useCurrency";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="currency-selector">
      <label htmlFor="currency-select" className="currency-label">
        Currency
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        className="currency-select"
      >
        {Object.values(CURRENCIES).map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code}
          </option>
        ))}
      </select>
    </div>
  );
}
