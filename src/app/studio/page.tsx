"use client";

import { motion } from "framer-motion";
import { CalendarDays, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import type { StudioSession } from "@/types/mom-manager";
import { todayLocalISODate } from "@/lib/dates";

const EMPTY: StudioSession[] = [];

const GENDER_OPTIONS = [
  { value: "", label: "— לא נבחר —" },
  { value: "נקבה", label: "נקבה" },
  { value: "זכר", label: "זכר" },
  { value: "אחר", label: "אחר" },
  { value: "לא מצוין", label: "לא מצוין" },
] as const;

function newSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sortSessions(list: StudioSession[]): StudioSession[] {
  return [...list].sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    if (c !== 0) return c;
    return a.recordingTime.localeCompare(b.recordingTime);
  });
}

const defaultForm = () => ({
  date: todayLocalISODate(),
  recordingTime: "",
  recorderName: "",
  whoRecords: "",
  gender: "",
  song: "",
});

export default function StudioCalendarPage() {
  const { state, ready, setStudioSessions } = useMomManager();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sessions = state?.studioSessions ?? EMPTY;
  const sorted = useMemo(() => sortSessions(sessions), [sessions]);

  const resetForm = useCallback(() => {
    setForm(defaultForm());
    setEditingId(null);
  }, []);

  const startEdit = useCallback((s: StudioSession) => {
    setEditingId(s.id);
    setForm({
      date: s.date,
      recordingTime: s.recordingTime,
      recorderName: s.recorderName,
      whoRecords: s.whoRecords,
      gender: s.gender,
      song: s.song,
    });
  }, []);

  const saveSession = () => {
    if (!form.date.trim()) return;

    if (editingId) {
      const next = sessions.map((s) =>
        s.id === editingId
          ? {
              ...s,
              date: form.date,
              recordingTime: form.recordingTime,
              recorderName: form.recorderName.trim(),
              whoRecords: form.whoRecords.trim(),
              gender: form.gender,
              song: form.song.trim(),
            }
          : s
      );
      setStudioSessions(next);
      resetForm();
      return;
    }

    const created: StudioSession = {
      id: newSessionId(),
      date: form.date,
      recordingTime: form.recordingTime,
      recorderName: form.recorderName.trim(),
      whoRecords: form.whoRecords.trim(),
      gender: form.gender,
      song: form.song.trim(),
    };
    setStudioSessions([...sessions, created]);
    resetForm();
  };

  const removeSession = (id: string) => {
    setStudioSessions(sessions.filter((s) => s.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="mx-auto max-w-lg pb-28 pt-4">
      <header className="mb-6 space-y-2 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-700/80">
          אולפן
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          יומן האולפן
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          הוסיפי הקלטות עם כל הפרטים. ביום שיש בו סשן — תופיע תזכורת בוקר
          ומשימת הכנה בלוח הבית ב־20:00.
        </p>
      </header>

      {!ready ? (
        <div className="h-48 animate-pulse rounded-2xl bg-white/50" />
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/95 p-5 shadow-lg shadow-sage-900/5 ring-1 ring-black/5"
        >
          <div className="mb-4 flex items-center gap-2 text-sage-800">
            <CalendarDays className="h-5 w-5" aria-hidden />
            <h2 className="font-semibold text-slate-800">
              {editingId ? "עריכת הקלטה" : "הקלטה חדשה"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 text-right sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="session-date"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                תאריך
              </label>
              <input
                id="session-date"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
              />
            </div>
            <div>
              <label
                htmlFor="session-time"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                שעת ההקלטה
              </label>
              <input
                id="session-time"
                type="time"
                value={form.recordingTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recordingTime: e.target.value }))
                }
                className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
              />
            </div>
            <div>
              <label
                htmlFor="session-gender"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                מגדר
              </label>
              <div className="relative">
                <select
                  id="session-gender"
                  value={form.gender}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gender: e.target.value }))
                  }
                  className="w-full appearance-none rounded-xl border border-sage-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="session-recorder-name"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                שם המקליט
              </label>
              <input
                id="session-recorder-name"
                type="text"
                value={form.recorderName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recorderName: e.target.value }))
                }
                placeholder="למשל שם במערכת / כינוי באולפן"
                className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="session-who"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                מי מקליט
              </label>
              <input
                id="session-who"
                type="text"
                value={form.whoRecords}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whoRecords: e.target.value }))
                }
                placeholder="שם האמן / הלקוח / ההרכב"
                className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="session-song"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                איזה שיר
              </label>
              <input
                id="session-song"
                type="text"
                value={form.song}
                onChange={(e) =>
                  setForm((f) => ({ ...f, song: e.target.value }))
                }
                placeholder="כותרת או הערה קצרה"
                className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sage-50"
              >
                ביטול עריכה
              </button>
            )}
            <button
              type="button"
              onClick={saveSession}
              disabled={!form.date.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sage-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {editingId ? (
                <>
                  <Pencil className="h-4 w-4" aria-hidden />
                  עדכון
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden />
                  שמירת הקלטה
                </>
              )}
            </button>
          </div>

          <div className="mt-6 border-t border-sage-100 pt-4">
            <h3 className="mb-3 text-right text-sm font-semibold text-slate-800">
              הקלטות מתוכננות ({sorted.length})
            </h3>
            {sorted.length === 0 ? (
              <p className="text-right text-sm text-slate-500">
                עדיין אין רשומות. מלאי את הטופס לעיל ושמרי.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sorted.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-sage-100 bg-sage-50/60 px-3 py-3 text-right"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1 text-sm">
                        <p className="font-semibold text-slate-900">
                          {new Date(s.date + "T12:00:00").toLocaleDateString(
                            "he-IL",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                          {s.recordingTime
                            ? ` · ${s.recordingTime}`
                            : ""}
                        </p>
                        {s.song && (
                          <p>
                            <span className="text-slate-500">שיר: </span>
                            {s.song}
                          </p>
                        )}
                        {s.whoRecords && (
                          <p>
                            <span className="text-slate-500">מי מקליט: </span>
                            {s.whoRecords}
                          </p>
                        )}
                        {s.gender && (
                          <p>
                            <span className="text-slate-500">מגדר: </span>
                            {s.gender}
                          </p>
                        )}
                        {s.recorderName && (
                          <p>
                            <span className="text-slate-500">שם המקליט: </span>
                            {s.recorderName}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="rounded-lg p-2 text-sage-800 transition hover:bg-white"
                          aria-label="עריכה"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSession(s.id)}
                          className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-100"
                          aria-label="מחיקה"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.section>
      )}
    </div>
  );
}
