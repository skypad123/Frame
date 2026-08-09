"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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
      <div className="install-banner">
        <p>Install Frame on this device for one-tap counter lookups.</p>
        <div className="install-actions">
          <button type="button" className="ghost-btn" onClick={() => setDismissed(true)}>
            Not now
          </button>
          <button
            type="button"
            className="solid-btn"
            onClick={async () => {
              await deferred.prompt();
              setDeferred(null);
            }}
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  if (env.isIos) {
    return (
      <div className="install-banner">
        <p>
          On iPhone: tap Share, then <strong>Add to Home Screen</strong> for
          offline-ready lookups.
        </p>
        <button type="button" className="ghost-btn" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}
