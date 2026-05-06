"use client";

import { motion } from "framer-motion";
import { ChevronDown, Droplets, Flame } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import {
  BREAKFAST_OPTIONS,
  CALORIE_GOAL,
  DINNER_OPTIONS,
  kcalForMealIds,
  LUNCH_OPTIONS,
  WATER_GOAL_ML,
} from "@/lib/meal-database";
import type { HealthMeals } from "@/types/mom-manager";

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function MealSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string; kcal: number }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative text-right">
      <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-sage-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
      >
        {options.map((o, i) => (
          <option key={`${label}-${i}-${o.id}`} value={o.id}>
            {o.label}
            {o.id ? ` · ${o.kcal} קל׳` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute left-2.5 top-[26px] h-4 w-4 text-sage-600" />
    </div>
  );
}

export function HealthClient() {
  const { state, ready, applyPersisted } = useMomManager();

  const health = state?.health;
  const breakfast = health?.meals?.breakfast ?? "";
  const lunch = health?.meals?.lunch ?? "";
  const dinner = health?.meals?.dinner ?? "";
  const meals: HealthMeals = { breakfast, lunch, dinner };
  const waterMl = health?.waterMl ?? 0;

  const kcal = useMemo(
    () => kcalForMealIds({ breakfast, lunch, dinner }),
    [breakfast, lunch, dinner]
  );
  const caloriePct = Math.min(kcal / CALORIE_GOAL, 1);
  const waterPct = Math.min(waterMl / WATER_GOAL_ML, 1);
  const ringOffset = RING_C * (1 - caloriePct);

  const setMeals = useCallback(
    (m: HealthMeals) => {
      applyPersisted((prev) => ({
        ...prev,
        health: { ...prev.health, meals: m },
      }));
    },
    [applyPersisted]
  );

  const addWater = useCallback(
    (ml: number) => {
      applyPersisted((prev) => ({
        ...prev,
        health: {
          ...prev.health,
          waterMl: Math.max(0, prev.health.waterMl + ml),
        },
      }));
    },
    [applyPersisted]
  );

  if (!ready || !health) {
    return (
      <div className="mx-auto max-w-lg pb-28 pt-6">
        <div className="h-56 animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-28 pt-4">
      <header className="mb-5 space-y-2 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-700/80">
          בריאות
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          מעקב בריאותי
        </h1>
        <p className="text-sm text-slate-600">
          מים (יעד 2 ליטר), קלוריות (יעד {CALORIE_GOAL}), ובחירות ארוחה — נשמרים
          יומית במכשיר.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl bg-white/95 p-5 shadow-lg ring-1 ring-black/5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sage-800">
              <Droplets className="h-5 w-5 text-sky-600" aria-hidden />
              <h2 className="font-semibold text-slate-900">שתיית מים</h2>
            </div>
            <span className="text-sm font-bold tabular-nums text-slate-700">
              {waterMl} / {WATER_GOAL_ML} מ״ל
            </span>
          </div>

          <div className="relative mx-auto h-48 w-28 overflow-hidden rounded-b-3xl rounded-t-lg border-4 border-sky-100 bg-gradient-to-b from-sky-50 to-white shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.45)_0%,transparent_50%,rgba(255,255,255,0.35)_100%)]" />
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-500 via-sky-400 to-sky-300"
              initial={false}
              animate={{ height: `${waterPct * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
            <div className="absolute inset-x-2 top-3 h-2 rounded-full bg-white/70 shadow-sm" />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => addWater(200)}
              className="rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-sm font-semibold text-sage-900 hover:bg-sage-100"
            >
              +200 מ״ל
            </button>
            <button
              type="button"
              onClick={() => addWater(250)}
              className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-700"
            >
              +250 מ״ל
            </button>
            <button
              type="button"
              onClick={() => addWater(500)}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
            >
              +500 מ״ל
            </button>
            <button
              type="button"
              onClick={() =>
                applyPersisted((p) => ({
                  ...p,
                  health: { ...p.health, waterMl: 0 },
                }))
              }
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              איפוס היום
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white/95 p-5 shadow-lg ring-1 ring-black/5"
        >
          <div className="mb-4 flex items-center gap-2 text-sage-800">
            <Flame className="h-5 w-5 text-rose-500" aria-hidden />
            <h2 className="font-semibold text-slate-900">קלוריות וארוחות</h2>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_R}
                  fill="none"
                  className="text-sage-100"
                  stroke="currentColor"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={RING_R}
                  fill="none"
                  stroke="url(#kcal-gradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  initial={false}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
                <defs>
                  <linearGradient
                    id="kcal-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#7d9a7d" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {kcal}
                </span>
                <span className="text-xs text-slate-500">
                  מתוך {CALORIE_GOAL} קל׳
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <MealSelect
                label="בוקר"
                value={meals.breakfast}
                options={BREAKFAST_OPTIONS}
                onChange={(id) =>
                  setMeals({ ...meals, breakfast: id })
                }
              />
              <MealSelect
                label="צהריים"
                value={meals.lunch}
                options={LUNCH_OPTIONS}
                onChange={(id) => setMeals({ ...meals, lunch: id })}
              />
              <MealSelect
                label="ערב"
                value={meals.dinner}
                options={DINNER_OPTIONS}
                onChange={(id) =>
                  setMeals({ ...meals, dinner: id })
                }
              />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
