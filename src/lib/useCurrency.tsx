"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { type CurrencyCode } from "./currency";

const CURRENCY_KEY = "frame-currency-preference";

const currencyListeners = new Set<() => void>();
let currencySnapshot: CurrencyCode = "JPY";
let initialized = false;

function emitCurrencyChange() {
  currencyListeners.forEach((listener) => listener());
}

function readCurrencySnapshot(): CurrencyCode {
  if (typeof window === "undefined") return currencySnapshot;

  if (!initialized) {
    try {
      const stored = localStorage.getItem(CURRENCY_KEY);
      if (stored && isValidCurrency(stored)) {
        currencySnapshot = stored as CurrencyCode;
      }
    } catch {
      // Fallback to default
    }
    initialized = true;
  }

  return currencySnapshot;
}

function subscribeCurrency(onStoreChange: () => void) {
  currencyListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CURRENCY_KEY) {
      initialized = false;
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    currencyListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function isValidCurrency(code: string): boolean {
  return ["JPY", "USD", "EUR", "GBP", "AUD", "CAD"].includes(code);
}

function setCurrency(currency: CurrencyCode) {
  try {
    localStorage.setItem(CURRENCY_KEY, currency);
    currencySnapshot = currency;
    emitCurrencyChange();
  } catch {
    // Ignore localStorage errors
  }
}

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(
    subscribeCurrency,
    readCurrencySnapshot,
    () => "JPY",
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
