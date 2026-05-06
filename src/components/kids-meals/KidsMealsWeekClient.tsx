"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarRange, Home } from "lucide-react";
import { useMomManager } from "@/hooks/use-mom-manager";
import type { KidsMealsDayEntry } from "@/types/mom-manager";
import {
  addDaysToIsoDate,
  isSaturdayIsoDate,
  startOfWeekSundayFromIso,
  todayLocalISODate,
} from "@/lib/dates";
import { KidsMealSelectField } from "@/components/kids-meals/KidsMealSelectField";

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const;

export function KidsMealsWeekClient() {
  const { state, ready, applyPersisted } = useMomManager();
  const today = todayLocalISODate();

  const updateDayField = (
    date: string,
    field: keyof KidsMealsDayEntry,
    value: string
  ) => {
    if (isSaturdayIsoDate(date)) return;
    applyPersisted((p) => {
      const cur =
        p.kidsMeals.byDay[date] ?? {
          breakfast: "",
          lunch: "",
          dinner: "",
        };
      return {
        ...p,
        kidsMeals: {
          ...p.kidsMeals,
          byDay: {
            ...p.kidsMeals.byDay,
            [date]: { ...cur, [field]: value },
          },
        },
      };
    });
  };

  if (!ready || !state) {
    return (
      <div className="mx-auto max-w-lg pb-28 pt-6">
        <div className="h-64 animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  const weekStart =
    state.kidsMeals.weekStartSunday || startOfWeekSundayFromIso(today);
  const weekDays: { iso: string; label: string; index: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const iso = addDaysToIsoDate(weekStart, i);
    weekDays.push({
      iso,
      label: DAY_LABELS[i],
      index: i,
    });
  }

  const noteShabbat = isSaturdayIsoDate(today)
      ? "היום שבת — אין רישום. נתוני השבוע עדיין זמינים; מיום ראשון ייפתח מעקב חדש."
      : null;

  return (
    <div className="mx-auto max-w-lg pb-28 pt-4">
      <header className="mb-5 space-y-2 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-700/80">
          ארוחות
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          מעקב ארוחות — הילדים
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          ראשון–שישי: רישום מלא. בשבת אין רישום. האיפוס לשבוע חדש קורה ביום ראשון
          (נשמר במכשיר). לאותה רשימת מאכלים לכל ארוחה; אפשר גם לבחור «אחר» ולפרט.
        </p>
        {noteShabbat && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-200/80">
            {noteShabbat}
          </p>
        )}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sage-700 hover:text-sage-900"
        >
          <Home className="h-4 w-4" aria-hidden />
          חזרה לבית
        </Link>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
      >
        <div className="flex items-center gap-2 text-sage-800">
          <CalendarRange className="h-5 w-5" aria-hidden />
          <h2 className="font-semibold text-slate-900">השבוע הנוכחי</h2>
        </div>

        <div className="flex flex-col gap-4">
          {weekDays.map(({ iso, label, index }) => {
            const isSaturday = index === 6;
            const entry =
              state.kidsMeals.byDay[iso] ?? {
                breakfast: "",
                lunch: "",
                dinner: "",
              };
            const isToday = iso === today;

            return (
              <div
                key={iso}
                className={`rounded-xl border px-3 py-3 text-right ${
                  isSaturday
                    ? "border-dashed border-sage-200 bg-sage-50/40"
                    : isToday
                      ? "border-sage-300 bg-sage-50/70 ring-1 ring-sage-200/60"
                      : "border-sage-100 bg-white"
                }`}
              >
                <p className="mb-2 flex flex-wrap items-baseline justify-end gap-2 border-b border-sage-100 pb-2">
                  <span className="text-sm font-bold text-sage-900">
                    יום {label}
                  </span>
                  <span className="text-xs tabular-nums text-slate-500">
                    {new Date(iso + "T12:00:00").toLocaleDateString("he-IL", {
                      day: "numeric",
                      month: "short",
                    })}
                    {isToday ? " · היום" : ""}
                  </span>
                </p>

                {isSaturday ? (
                  <p className="text-sm text-slate-600">
                    שבת — אין רישום ארוחות. האיפוס לשבוע הבא ביום ראשון.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <KidsMealSelectField
                      label="בוקר"
                      value={entry.breakfast}
                      onChange={(v) => updateDayField(iso, "breakfast", v)}
                    />
                    <KidsMealSelectField
                      label="צהריים"
                      value={entry.lunch}
                      onChange={(v) => updateDayField(iso, "lunch", v)}
                    />
                    <KidsMealSelectField
                      label="ערב"
                      value={entry.dinner}
                      onChange={(v) => updateDayField(iso, "dinner", v)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}
