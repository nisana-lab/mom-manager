"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MOM-MANAGER global]", error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-cream-100 p-6 font-sans text-slate-900">
        <div className="mx-auto max-w-md text-right">
          <h1 className="mb-2 text-lg font-bold">שגיאה קריטית</h1>
          <p className="mb-4 text-sm text-slate-600">
            בדקי את חלון הטרמינל שבו רצה <code className="rounded bg-slate-200 px-1">npm run dev</code>{" "}
            ואת Console בדפדפן (F12).
          </p>
          <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-white p-3 text-xs text-red-800 ring-1 ring-slate-200">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-sage-700 px-4 py-2 text-sm font-bold text-white"
          >
            נסי שוב
          </button>
        </div>
      </body>
    </html>
  );
}
