"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Clock, Moon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildDailySummary } from "@/lib/daily-summary";
import { buildTodayTasks } from "@/lib/checklist-model";
import {
  findNextDueReminder,
  reminderKey,
} from "@/lib/task-reminders";
import { useMomManager } from "@/hooks/use-mom-manager";
import { todayLocalISODate } from "@/lib/dates";

const SNOOZE_MS = 25 * 60 * 1000;

export function SmartNotificationsClient() {
  const {
    state,
    ready,
    toggleTask,
    hasStudioToday,
    applyPersisted,
  } = useMomManager();

  const [due, setDue] = useState<{
    taskId: string;
    title: string;
    timeLabel: string;
  } | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const lastBrowserTagRef = useRef<string | null>(null);

  const runTick = useCallback(() => {
    if (!state) return;

    const todayIso = todayLocalISODate();
    const tasks = buildTodayTasks(hasStudioToday);
    const prefs = state.notificationPrefs;
    const fired = new Set(prefs.reminderKeysFiredToday);
    const next = findNextDueReminder(
      todayIso,
      new Date(),
      tasks,
      state.checklist,
      fired,
      prefs.reminderSnoozeUntil
    );
    setDue(next);

    if (
      next &&
      prefs.browserNotificationsEnabled &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      const key = reminderKey(todayIso, next.taskId);
      if (lastBrowserTagRef.current !== key) {
        lastBrowserTagRef.current = key;
        try {
          new Notification(`MOM-MANAGER · ${next.timeLabel}`, {
            body: next.title,
            tag: key,
            lang: "he",
          });
        } catch {
          /* ידוע במכשירים חוסמים */
        }
      }
    }

    if (!next) {
      lastBrowserTagRef.current = null;
    }

    const h = new Date().getHours();
    const sumHour = prefs.dailySummaryHour;
    const summaryRes = buildDailySummary(state.checklist, tasks);
    if (
      !next &&
      h >= sumHour &&
      prefs.lastDailySummaryDate !== todayIso &&
      summaryRes.total > 0
    ) {
      setSummaryOpen(true);
    }
  }, [state, hasStudioToday]);

  useEffect(() => {
    if (!ready || !state) return;
    runTick();
    const id = window.setInterval(runTick, 45_000);
    return () => window.clearInterval(id);
  }, [ready, state, runTick]);

  const markReminderDone = () => {
    if (!due || !state) return;
    toggleTask(due.taskId, true);
    setDue(null);
  };

  const dismissReminderToday = () => {
    if (!due || !state) return;
    const key = reminderKey(todayLocalISODate(), due.taskId);
    applyPersisted((p) => ({
      ...p,
      notificationPrefs: {
        ...p.notificationPrefs,
        reminderKeysFiredToday: p.notificationPrefs.reminderKeysFiredToday.includes(
          key
        )
          ? p.notificationPrefs.reminderKeysFiredToday
          : [...p.notificationPrefs.reminderKeysFiredToday, key],
      },
    }));
    setDue(null);
  };

  const snoozeReminder = () => {
    if (!due || !state) return;
    const key = reminderKey(todayLocalISODate(), due.taskId);
    const until = Date.now() + SNOOZE_MS;
    applyPersisted((p) => ({
      ...p,
      notificationPrefs: {
        ...p.notificationPrefs,
        reminderSnoozeUntil: {
          ...p.notificationPrefs.reminderSnoozeUntil,
          [key]: until,
        },
      },
    }));
    setDue(null);
  };

  const closeSummary = (markShown: boolean) => {
    if (markShown && state) {
      const d = todayLocalISODate();
      applyPersisted((p) => ({
        ...p,
        notificationPrefs: {
          ...p.notificationPrefs,
          lastDailySummaryDate: d,
        },
      }));
    }
    setSummaryOpen(false);
  };

  if (!ready || !state) return null;

  const summary =
    summaryOpen && state
      ? buildDailySummary(
          state.checklist,
          buildTodayTasks(hasStudioToday)
        )
      : null;

  return (
    <>
      <AnimatePresence>
        {due && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              aria-label="סגירת שכבה"
              className="fixed inset-0 z-[60] bg-slate-900/40"
              onClick={() => setDue(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reminder-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed left-1/2 top-[12vh] z-[70] w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl border border-sage-200/90 bg-white p-4 shadow-2xl ring-2 ring-sage-300/40"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sage-700">
                  <Bell className="h-6 w-6 shrink-0" aria-hidden />
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sage-600">
                      הגיע הזמן
                    </p>
                    <p
                      id="reminder-title"
                      className="font-display text-lg font-bold text-slate-900"
                    >
                      {due.title}
                    </p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-sm text-slate-600">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {due.timeLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDue(null)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                  aria-label="סגור"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={markReminderDone}
                  className="flex items-center justify-center gap-2 rounded-xl bg-sage-700 py-2.5 text-sm font-bold text-white shadow-md hover:bg-sage-800"
                >
                  <Check className="h-5 w-5" aria-hidden />
                  ביצעתי
                </button>
                <button
                  type="button"
                  onClick={snoozeReminder}
                  className="rounded-xl border border-sage-300 bg-sage-50 py-2 text-sm font-semibold text-sage-900 hover:bg-sage-100"
                >
                  תזכירי לי בעוד 25 דק׳
                </button>
                <button
                  type="button"
                  onClick={dismissReminderToday}
                  className="text-center text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
                >
                  אל תציגי שוב היום למשימה זו
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {summary && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              aria-label="רקע"
              className="fixed inset-0 z-[60] bg-slate-950/45"
              onClick={() => closeSummary(true)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed left-1/2 top-[8vh] z-[70] w-[min(94vw,24rem)] max-h-[min(82vh,32rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border p-4 shadow-2xl ${
                summary.tone === "positive"
                  ? "border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white ring-1 ring-emerald-200/60"
                  : summary.tone === "mixed"
                    ? "border-amber-200/90 bg-gradient-to-b from-amber-50/95 to-white ring-1 ring-amber-200/60"
                    : "border-rose-200/90 bg-gradient-to-b from-rose-50/95 to-white ring-1 ring-rose-200/60"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2 text-right">
                <div className="flex flex-1 items-start gap-2">
                  <Moon className="mt-1 h-6 w-6 shrink-0 text-slate-600" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      סיכום היום
                    </p>
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      {summary.headline}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      {summary.subline}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      בוצעו {summary.done} מתוך {summary.total} משימות (
                      {Math.round(summary.ratio * 100)}%)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => closeSummary(true)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-black/5"
                  aria-label="סגור"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="mb-4 space-y-1.5 text-right text-sm text-slate-700">
                {summary.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 leading-snug">
                    <span className="text-sage-600">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => closeSummary(true)}
                className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-white hover:bg-slate-900"
              >
                הבנתי, לסגור להיום
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
