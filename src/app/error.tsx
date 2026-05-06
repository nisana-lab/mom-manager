"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MOM-MANAGER]", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 className="font-display text-xl font-bold text-slate-900">
        משהו השתבש
      </h1>
      <p className="text-sm leading-relaxed text-slate-600">
        פתחי את ה־<strong>DevTools</strong> (F12) בלשונית Console כדי לראות פרטים.
        לעיתים מסך לבן נגרם מנתונים פגומים ב־localStorage.
      </p>
      <pre className="max-h-40 w-full overflow-auto rounded-xl bg-slate-100 p-3 text-right text-xs text-red-800 ring-1 ring-slate-200">
        {error.message}
      </pre>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-sage-700 px-4 py-2 text-sm font-bold text-white hover:bg-sage-800"
        >
          נסי שוב
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("mom-manager-v5");
            } catch {
              /* */
            }
            window.location.reload();
          }}
          className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
        >
          נקה נתונים ורענון
        </button>
      </div>
    </div>
  );
}
