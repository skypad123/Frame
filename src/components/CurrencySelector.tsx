"use client";

import { useCurrency } from "@/lib/useCurrency";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-3 py-2">
      <label
        htmlFor="currency-select"
        className="text-xs uppercase tracking-wider text-[var(--brass-soft)]"
      >
        Currency
      </label>
      <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
        <SelectTrigger id="currency-select" className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(CURRENCIES).map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              {curr.symbol} {curr.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
