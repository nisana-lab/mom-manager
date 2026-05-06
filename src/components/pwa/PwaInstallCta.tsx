"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "mom-manager-pwa-install-dismissed-v1";

function isInstalledStandalone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  } catch {
    /* */
  }
  return Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  );
}

function detectIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

type BeforeInstallPromptEventTyped = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function PwaInstallCta() {
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventTyped | null>(
    null
  );
  const [showIosTip, setShowIosTip] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const inst = isInstalledStandalone();
    setInstalled(inst);
    let dis = false;
    try {
      dis = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dis = false;
    }
    setDismissed(dis);

    if (inst || dis) {
      setReady(true);
      return;
    }

    if (detectIos()) {
      setShowIosTip(true);
      setReady(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEventTyped);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    setReady(true);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* */
    }
    setDismissed(true);
  };

  const runInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* */
    }
    setDeferred(null);
  };

  if (!ready || installed || dismissed) return null;

  if (deferred) {
    return (
      <div
        dir="rtl"
        className="fixed inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-[55] rounded-2xl border border-sage-200 bg-white/95 p-3 shadow-xl shadow-sage-900/10 ring-1 ring-black/5 backdrop-blur-md"
        role="region"
        aria-label="התקנת אפליקציה"
      >
        <div className="flex items-start gap-2">
          <Smartphone
            className="mt-0.5 h-8 w-8 shrink-0 text-sage-700"
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm font-bold text-slate-900">
              להפעלה כמו אפליקציה — בלי שורת כתובות
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              התקיני למכשיר: תיפתח במסך מלא, כמו אפ מובנה (לא ממש Chrome).
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={runInstall}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sage-700 px-3 py-2 text-xs font-bold text-white hover:bg-sage-800"
              >
                <Download className="h-4 w-4" aria-hidden />
                התקיני עכשיו
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                לא עכשיו
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (showIosTip && detectIos()) {
    return (
      <div
        dir="rtl"
        className="fixed inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-[55] rounded-2xl border border-sage-200 bg-white/95 p-3 shadow-xl shadow-sage-900/10 ring-1 ring-black/5 backdrop-blur-md"
        role="region"
        aria-label="הוספה למסך הבית באייפון או באייפד"
      >
        <div className="flex items-start gap-2">
          <Share className="mt-0.5 h-8 w-8 shrink-0 text-sage-700" aria-hidden />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm font-bold text-slate-900">
              באייפון / אייפד: כמו אפליקציה אמיתית
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              לחצי <strong className="font-semibold text-slate-800">שתף</strong>{" "}
              (מרובע עם חץ למעלה), ובחרי{" "}
              <strong className="font-semibold text-slate-800">
                הוסף למסך הבית
              </strong>
              . הפעלה מהאיקון — בלי סרגל כתובות (מנוע Safari של המערכת).
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-2 text-xs font-semibold text-sage-800 underline underline-offset-2"
            >
              הבנתי, אל תציגי שוב
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="סגור"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-[55] rounded-2xl border border-sage-200 bg-amber-50/95 p-3 text-right shadow-lg ring-1 ring-amber-200/80"
      role="region"
    >
      <p className="text-xs font-semibold text-amber-950">
        טיפ: בתפריט הדפדפן (⋮) בחרי <strong>התקן אפליקציה</strong> או{" "}
        <strong>הוסף למסך הבית</strong> — כך נפתח בלי שורת כתובות.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-2 text-xs font-bold text-amber-900 underline"
      >
        סגור
      </button>
    </div>
  );
}
