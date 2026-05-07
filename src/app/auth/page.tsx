"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";

function translateAuthError(message: string | undefined): string {
  if (!message) return "משהו השתבש. נסי שוב.";
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "אימייל או סיסמה שגויים.";
  if (m.includes("email not confirmed"))
    return "יש לאשר את האימייל לפי הקישור שנשלח אליך.";
  if (m.includes("user already registered"))
    return "כתובת האימייל כבר רשומה. נסי להתחבר.";
  if (m.includes("database error") || m.includes("saving new user"))
    return "שגיאה ביצירת הפרופיל בבסיס הנתונים. ודאי שהרצת את schema-for-dashboard.sql ב-Supabase (SQL Editor).";
  if (m.includes("signup") && m.includes("not enabled"))
    return "הרשמה סגורה בהגדרות Supabase — Authentication → Providers → Email.";
  if (m.includes("rate limit") || m.includes("too many requests"))
    return "יותר מדי ניסיונות — נסי שוב בעוד דקה.";
  if (m === "missing_env")
    return "נדרשים NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY: מקומית — ב־mom-manager/.env.local והפעלה מחדש של npm run dev; בפריסה (Vercel) — באותו שם ב־Project → Settings → Environment Variables, ואז Deploy מחדש. אם כבר הוגדר — נקי `.next` (npm run clean) ורענון קשיח.";
  if (m.includes("invalid path"))
    return "כתובת הסופבייס כוללת נתיב מיותר (למשל בטעות העתקה נכנס גם חלק של rest). השתמשי רק בכתובת הבסיס מהמסך API. גם בגרסה החדשה האתר מתקן זאת אוטומטית — רענני את האתר ונסי שוב.";
  if (m.includes("password"))
    return "הסיסמה חלשה מדי או לא עומדת בדרישות.";
  return message;
}

export default function AuthPage() {
  const { signIn, signUp, ready, supabase, resumeLocalPreview } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [serverEnvOk, setServerEnvOk] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/health/supabase-env")
      .then((r) => r.json() as Promise<{ ok?: boolean }>)
      .then((d) => setServerEnvOk(d.ok === true))
      .catch(() => setServerEnvOk(false));
  }, []);

  if (!ready) {
    return null;
  }

  const canResumeLocal = supabase === null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    if (!trimmedEmail || !password) {
      setMessage("מלאי אימייל וסיסמה.");
      return;
    }
    if (mode === "register" && !trimmedName) {
      setMessage("בהרשמה נדרש שם מלא.");
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await signIn({ email: trimmedEmail, password, rememberMe })
          : await signUp({
              email: trimmedEmail,
              password,
              fullName: trimmedName,
              rememberMe,
            });
      if (res.error) {
        setMessage(translateAuthError(res.error.message));
      } else if (mode === "register") {
        setMessage(
          "נרשמת בהצלחה. אם לא עברת לדף הבית — כנראה נדרש אישור אימייל; בדקי בתיבה וב-Spam. אחרי האישור נסי להתחבר."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-sage-200/90 bg-white/95 p-6 shadow-lg ring-1 ring-black/5">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-sage-600">
          MOM-MANAGER
        </p>
        <h1 className="mt-2 text-center font-display text-2xl font-bold text-slate-900">
          {mode === "login" ? "התחברות" : "הרשמה"}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-600">
          {mode === "login"
            ? "הזיני פרטים כדי להמשיך"
            : "חשבון חדש — רגע ומתחילים"}
        </p>

        {serverEnvOk === false && (
          <p
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs leading-snug text-amber-900"
            role="status"
          >
            <strong className="font-semibold">פריסה:</strong> השרת לא רואה את{" "}
            <code className="rounded bg-white/70 px-1" dir="ltr">
              NEXT_PUBLIC_SUPABASE_*
            </code>
            . ב-Vercel: Settings → Environment Variables → הוסיפי URL + anon ל-
            Production (ול-Preview), ואז Redeploy. אחרי התיקון: רענון לדף{" "}
            <code className="rounded bg-white/70 px-1" dir="ltr">
              /api/health/supabase-env
            </code>{" "}
            —             צריך להופיע{" "}
            <code className="rounded bg-white/70 px-1" dir="ltr">
              {`"ok": true`}
            </code>
            . מדריך מלא: <code className="rounded bg-white/70 px-1">SETUP.txt</code>
          </p>
        )}

        <div className="mt-6 flex rounded-2xl bg-sage-100/80 p-1">
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-sage-900 shadow-sm"
                : "text-sage-700"
            }`}
            onClick={() => {
              setMode("login");
              setMessage(null);
            }}
          >
            התחברות
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-white text-sage-900 shadow-sm"
                : "text-sage-700"
            }`}
            onClick={() => {
              setMode("register");
              setMessage(null);
            }}
          >
            הרשמה
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4 text-right">
          {mode === "register" && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                שם מלא
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-sage-400 focus:ring-2"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-left text-slate-900 outline-none ring-sage-400 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-left text-slate-900 outline-none ring-sage-400 focus:ring-2"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-end gap-2 text-sm text-slate-700">
            <span>לזכור אותי במכשיר</span>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-sage-300 text-sage-600"
            />
          </label>

          {message && (
            <p
              className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200"
              role="alert"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-sage-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-sage-700 disabled:opacity-60"
          >
            {busy ? "מעבדת…" : mode === "login" ? "כניסה" : "יצירת חשבון"}
          </button>
        </form>

        {canResumeLocal && (
          <div className="mt-4 border-t border-sage-100 pt-4 text-center">
            <p className="mb-2 text-xs text-slate-600">
              רק רוצה לראות את הממשק? אפשר בלי חשבון.
            </p>
            <button
              type="button"
              onClick={() => resumeLocalPreview()}
              className="w-full rounded-2xl border border-sage-300 bg-sage-50 py-2.5 text-sm font-semibold text-sage-900 hover:bg-sage-100"
            >
              המשיכי בתצוגה מקומית
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
