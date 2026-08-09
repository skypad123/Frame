"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function detectIos() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const [isIos] = useState(detectIos);
  const [isStandalone] = useState(detectStandalone);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone || dismissed) return null;

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

  if (isIos) {
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
