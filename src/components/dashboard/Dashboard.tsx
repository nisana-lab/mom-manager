"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { LiveClock } from "@/components/dashboard/LiveClock";
import { DailyProgress } from "@/components/dashboard/DailyProgress";
import { KidsMealsHomeCard } from "@/components/dashboard/KidsMealsHomeCard";
import { KidsTrackingHomeCard } from "@/components/dashboard/KidsTrackingHomeCard";
import { NotificationPrefsBar } from "@/components/dashboard/NotificationPrefsBar";
import { StudioMorningBanner } from "@/components/dashboard/StudioMorningBanner";
import { useMomManager } from "@/hooks/use-mom-manager";
import {
  buildTodayTasks,
  type ChecklistTaskDef,
} from "@/lib/checklist-model";

function taskCardClass(task: ChecklistTaskDef, done: boolean) {
  const base =
    "group relative flex flex-col overflow-hidden rounded-2xl border shadow-md transition-all duration-200";
  if (done) {
    return `${base} border-sage-200/80 bg-sage-50/90 opacity-80`;
  }
  if (task.kind === "mandatory") {
    return `${base} border-rose-300/90 bg-gradient-to-l from-rose-50 to-white ring-2 ring-rose-200/70`;
  }
  if (task.kind === "studio") {
    return `${base} border-sage-400/50 bg-gradient-to-l from-sage-50 to-white ring-1 ring-sage-300/60`;
  }
  return `${base} border-white/80 bg-white/95 hover:border-sage-200 hover:shadow-lg`;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const {
    state,
    ready,
    toggleTask,
    setSelection,
    hasStudioToday,
    todayStudioSessions,
    showStudioMorningAlert,
    dismissStudioMorning,
  } = useMomManager();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || "";

  const tasks = buildTodayTasks(hasStudioToday);

  const completed = tasks.filter((t) => state?.checklist[t.id]).length;
  const total = tasks.length;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 pb-28 pt-4">
      <header className="space-y-1 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-700/80">
          MOM-MANAGER · גרסה 5.0
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">
          לוח בקרה
        </h1>
        <p className="text-sm text-slate-600">
          יום מאורגן — צעד אחר צעד, בקצב שלך.
        </p>
      </header>

      {user && (
        <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sage-200/80 bg-white/90 px-3 py-2.5 text-right shadow-inner ring-1 ring-black/5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {displayName || "משתמשת"}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 rounded-xl border border-sage-300 bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-900 hover:bg-sage-100"
          >
            התנתקות
          </button>
        </section>
      )}

      <LiveClock />

      {ready && <NotificationPrefsBar />}

      <AnimatePresence>
        {ready && (
          <StudioMorningBanner
            visible={showStudioMorningAlert}
            onDismiss={dismissStudioMorning}
            sessions={todayStudioSessions}
          />
        )}
      </AnimatePresence>

      {ready && <DailyProgress completed={completed} total={total} />}

      {ready && <KidsMealsHomeCard />}

      {ready && <KidsTrackingHomeCard />}

      {!ready && (
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-28 animate-pulse rounded-2xl bg-white/50" />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-slate-800">
            רשימת משימות חכמה
          </h2>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-sage-800 shadow-sm ring-1 ring-black/5">
            היום
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {tasks.map((task, index) => {
            const done = Boolean(state?.checklist[task.id]);
            const Icon = task.Icon;
            const cbId = `task-${task.id}`;

            return (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className={taskCardClass(task, done)}>
                  <div className="flex gap-3 p-4 text-right">
                    <input
                      id={cbId}
                      type="checkbox"
                      checked={done}
                      onChange={(e) =>
                        toggleTask(task.id, e.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={cbId}
                      className="flex min-w-0 flex-1 cursor-pointer gap-3"
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 shadow-inner ring-1 ring-white ${
                          done ? "grayscale" : ""
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 space-y-2">
                        <span className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-1">
                          <span className="text-xs font-semibold tabular-nums text-sage-700">
                            {task.timeLabel}
                          </span>
                          {task.kind === "mandatory" && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                              חובה
                            </span>
                          )}
                          {task.kind === "studio" && (
                            <span className="rounded-full bg-sage-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sage-900">
                              אולפן
                            </span>
                          )}
                        </span>
                        <span
                          className={`block text-base font-semibold leading-snug text-slate-900 ${
                            done
                              ? "line-through decoration-sage-600/60"
                              : ""
                          }`}
                        >
                          {task.title}
                        </span>
                      </span>
                    </label>

                    <label
                      htmlFor={cbId}
                      className={`mt-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-sage-400 ${
                        done
                          ? "border-sage-500 bg-sage-500"
                          : "border-sage-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {done && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="block h-2 w-2 rounded-full bg-white"
                        />
                      )}
                    </label>
                  </div>

                  {task.kind === "dropdown" &&
                    task.dropdownKey &&
                    task.dropdownOptions && (
                      <div
                        className="border-t border-sage-100/80 bg-white/60 px-4 pb-4 pt-2"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="relative">
                          <select
                            value={
                              state?.selections[task.dropdownKey] ??
                              task.dropdownOptions[0]
                            }
                            onChange={(e) =>
                              setSelection(task.dropdownKey!, e.target.value)
                            }
                            className="w-full appearance-none rounded-xl border border-sage-200/80 bg-white/90 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 shadow-inner outline-none transition focus:border-sage-400 focus:ring-2 focus:ring-sage-300/50"
                          >
                            {task.dropdownOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" />
                          <p className="mt-1 text-right text-xs text-slate-500">
                            {task.dropdownKey === "sandwiches"
                              ? "בחירת תפריט סנדוויצ׳ים"
                              : "בחירת ארוחת ערב"}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
