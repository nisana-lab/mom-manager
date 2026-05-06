"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, UtensilsCrossed } from "lucide-react";
import { useMomManager } from "@/hooks/use-mom-manager";
import type { KidsMealsDayEntry } from "@/types/mom-manager";
import { isSaturdayIsoDate, todayLocalISODate } from "@/lib/dates";
import { KidsMealSelectField } from "@/components/kids-meals/KidsMealSelectField";

export function KidsMealsHomeCard() {
  const { state, ready, applyPersisted } = useMomManager();
  const today = todayLocalISODate();
  const isShabbat = isSaturdayIsoDate(today);

  const updateField = (field: keyof KidsMealsDayEntry, value: string) => {
    if (isShabbat) return;
    applyPersisted((p) => {
      const cur =
        p.kidsMeals.byDay[today] ?? {
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
            [today]: { ...cur, [field]: value },
          },
        },
      };
    });
  };

  if (!ready || !state) {
    return (
      <div className="h-36 animate-pulse rounded-2xl bg-white/50 shadow-inner" />
    );
  }

  const entry =
    state.kidsMeals.byDay[today] ?? {
      breakfast: "",
      lunch: "",
      dinner: "",
    };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-sage-200/80 bg-white/95 p-4 shadow-lg shadow-sage-900/5 ring-1 ring-black/5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sage-800">
          <UtensilsCrossed className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900">
            ארוחות הילדים — היום
          </h2>
        </div>
        <Link
          href="/kids-meals"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-sage-700 hover:text-sage-900"
        >
          מעקב שבועי
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {isShabbat ? (
        <p className="text-right text-sm leading-relaxed text-slate-600">
          בשבת אין רישום ארוחות. נתוני השבוע נשארים לצפייה עד מוצאי שבת; מיום
          ראשון מתחיל מעקב חדש. אפשר לעבור ל
          <strong className="font-medium text-slate-800">מעקב הארוחות</strong>{" "}
          לסיכום השבוע.
        </p>
      ) : (
        <div className="space-y-3 text-right">
          <KidsMealSelectField
            label="ארוחת בוקר"
            fieldId="kids-breakfast"
            relaxed
            value={entry.breakfast}
            onChange={(v) => updateField("breakfast", v)}
          />
          <KidsMealSelectField
            label="ארוחת צהריים"
            fieldId="kids-lunch"
            relaxed
            value={entry.lunch}
            onChange={(v) => updateField("lunch", v)}
          />
          <KidsMealSelectField
            label="ארוחת ערב"
            fieldId="kids-dinner"
            relaxed
            value={entry.dinner}
            onChange={(v) => updateField("dinner", v)}
          />
        </div>
      )}
    </motion.section>
  );
}
