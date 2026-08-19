"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type EnvSnapshot = {
  isIos: boolean;
  isStandalone: boolean;
};

const serverEnv: EnvSnapshot = { isIos: false, isStandalone: false };
let clientEnv: EnvSnapshot = serverEnv;

function readEnv(): EnvSnapshot {
  if (typeof window === "undefined") return serverEnv;

  const next: EnvSnapshot = {
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone)),
    isIos: /iPad|iPhone|iPod/.test(window.navigator.userAgent),
  };

  if (
    next.isIos === clientEnv.isIos &&
    next.isStandalone === clientEnv.isStandalone
  ) {
    return clientEnv;
  }

  clientEnv = next;
  return clientEnv;
}

function subscribeEnv(onStoreChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  const onChange = () => onStoreChange();
  media.addEventListener?.("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    media.removeEventListener?.("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const env = useSyncExternalStore(subscribeEnv, readEnv, () => serverEnv);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (env.isStandalone || dismissed) return null;

  if (deferred) {
    return (
      <div className="sticky bottom-3 z-[5] mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(201,162,39,0.35)] bg-[rgba(7,20,33,0.92)] p-4 shadow-[var(--shadow)] backdrop-blur-[10px] animate-[rise_0.5s_ease_both]">
        <p className="m-0 max-w-[36rem] text-sm text-[var(--paper-dim)]">
          Install Frame on this device for one-tap counter lookups.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="default" onClick={() => setDismissed(true)}>
            Not now
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={async () => {
              await deferred.prompt();
              setDeferred(null);
            }}
          >
            Install
          </Button>
        </div>
      </div>
    );
  }

  if (env.isIos) {
    return (
      <div className="sticky bottom-3 z-[5] mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(201,162,39,0.35)] bg-[rgba(7,20,33,0.92)] p-4 shadow-[var(--shadow)] backdrop-blur-[10px] animate-[rise_0.5s_ease_both]">
        <p className="m-0 text-sm text-[var(--paper-dim)]">
          On iPhone: tap Share, then <strong>Add to Home Screen</strong> for
          offline-ready lookups.
        </p>
        <Button variant="ghost" size="default" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    );
  }

  return null;
}
