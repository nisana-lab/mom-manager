"use client";

import { motion } from "framer-motion";
import {
  Baby,
  Bath,
  ChevronDown,
  Milk,
  Pill,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import type { BabyDiaperType } from "@/types/mom-manager";
import { defaultPersistedState } from "@/types/mom-manager";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const DIAPER_OPTIONS: { value: BabyDiaperType; label: string }[] = [
  { value: "pee", label: "פיפי" },
  { value: "poo", label: "קקי" },
  { value: "both", label: "פיפי + קקי" },
];

function diaperLabel(t: BabyDiaperType) {
  return DIAPER_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

export function BabyCareClient() {
  const { state, ready, applyPersisted } = useMomManager();

  const [feedTime, setFeedTime] = useState("");
  const [feedAmount, setFeedAmount] = useState("");
  const [diaperTime, setDiaperTime] = useState("");
  const [diaperType, setDiaperType] = useState<BabyDiaperType>("pee");

  const bc = state?.babyCare ?? defaultPersistedState().babyCare;

  const addFeeding = useCallback(() => {
    if (!feedTime) return;
    applyPersisted((p) => ({
      ...p,
      babyCare: {
        ...p.babyCare,
        feedings: [
          ...p.babyCare.feedings,
          { id: newId(), time: feedTime, amount: feedAmount.trim() },
        ],
      },
    }));
    setFeedAmount("");
  }, [applyPersisted, feedTime, feedAmount]);

  const removeFeeding = (id: string) => {
    applyPersisted((p) => ({
      ...p,
      babyCare: {
        ...p.babyCare,
        feedings: p.babyCare.feedings.filter((f) => f.id !== id),
      },
    }));
  };

  const addDiaper = useCallback(() => {
    if (!diaperTime) return;
    applyPersisted((p) => ({
      ...p,
      babyCare: {
        ...p.babyCare,
        diapers: [
          ...p.babyCare.diapers,
          { id: newId(), time: diaperTime, type: diaperType },
        ],
      },
    }));
  }, [applyPersisted, diaperTime, diaperType]);

  const removeDiaper = (id: string) => {
    applyPersisted((p) => ({
      ...p,
      babyCare: {
        ...p.babyCare,
        diapers: p.babyCare.diapers.filter((d) => d.id !== id),
      },
    }));
  };

  const setBathTime = (bathTime: string) => {
    applyPersisted((p) => ({
      ...p,
      babyCare: { ...p.babyCare, bathTime },
    }));
  };

  const setMark = (key: "vitaminD" | "iron" | "chahGiven", v: boolean) => {
    applyPersisted((p) => ({
      ...p,
      babyCare: { ...p.babyCare, [key]: v },
    }));
  };

  if (!ready || !state) {
    return (
      <div className="mx-auto max-w-lg pb-28 pt-6">
        <div className="h-48 animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  const sortedFeeds = [...bc.feedings].sort((a, b) =>
    a.time.localeCompare(b.time)
  );
  const sortedDiapers = [...bc.diapers].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-28 pt-4">
      <header className="space-y-2 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700/80">
          תינוקת
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          טיפול בתינוקת
        </h1>
        <p className="text-sm text-slate-600">
          רישום יומי — מתאפס בכל יום חדש (נשמר במכשיר).
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
      >
        <div className="mb-3 flex items-center gap-2 text-rose-800">
          <Milk className="h-5 w-5" aria-hidden />
          <h2 className="font-semibold text-slate-900">אכילה</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 text-right">
            <label className="mb-1 block text-xs text-slate-600">שעה</label>
            <input
              type="time"
              value={feedTime}
              onChange={(e) => setFeedTime(e.target.value)}
              className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200/60"
            />
          </div>
          <div className="flex-[2] text-right">
            <label className="mb-1 block text-xs text-slate-600">כמות / הערה</label>
            <input
              type="text"
              value={feedAmount}
              onChange={(e) => setFeedAmount(e.target.value)}
              placeholder="למשל 90 מ״ל, הנקה, בקבוק..."
              className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm shadow-inner outline-none placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-200/60"
            />
          </div>
          <button
            type="button"
            onClick={addFeeding}
            disabled={!feedTime}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-rose-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            הוספה
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {sortedFeeds.length === 0 ? (
            <li className="text-right text-sm text-slate-500">אין רישומי אכילה היום.</li>
          ) : (
            sortedFeeds.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => removeFeeding(f.id)}
                  className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100"
                  aria-label="מחיקה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="min-w-0 flex-1 text-right">
                  <span className="font-semibold tabular-nums">{f.time}</span>
                  {f.amount ? (
                    <span className="text-slate-700"> — {f.amount}</span>
                  ) : null}
                </span>
              </li>
            ))
          )}
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
      >
        <div className="mb-3 flex items-center gap-2 text-sage-800">
          <Baby className="h-5 w-5" aria-hidden />
          <h2 className="font-semibold text-slate-900">החלפת חיתול</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 text-right">
            <label className="mb-1 block text-xs text-slate-600">שעת החלפה</label>
            <input
              type="time"
              value={diaperTime}
              onChange={(e) => setDiaperTime(e.target.value)}
              className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200/60"
            />
          </div>
          <div className="flex-1 text-right">
            <label className="mb-1 block text-xs text-slate-600">סוג</label>
            <div className="relative">
              <select
                value={diaperType}
                onChange={(e) =>
                  setDiaperType(e.target.value as BabyDiaperType)
                }
                className="w-full appearance-none rounded-xl border border-sage-200 bg-white py-2 pl-8 pr-3 text-sm shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-200/60"
              >
                {DIAPER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-sage-600" />
            </div>
          </div>
          <button
            type="button"
            onClick={addDiaper}
            disabled={!diaperTime}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-sage-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            הוספה
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {sortedDiapers.length === 0 ? (
            <li className="text-right text-sm text-slate-500">
              אין החלפות מתועדות היום.
            </li>
          ) : (
            sortedDiapers.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-sage-100 bg-sage-50/60 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => removeDiaper(d.id)}
                  className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-100"
                  aria-label="מחיקה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="flex-1 text-right">
                  <span className="font-semibold tabular-nums">{d.time}</span>
                  <span className="text-slate-600">
                    {" "}
                    · {diaperLabel(d.type)}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
      >
        <div className="mb-3 flex items-center gap-2 text-sky-800">
          <Bath className="h-5 w-5" aria-hidden />
          <h2 className="font-semibold text-slate-900">מקלחת</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="text-right">
            <label className="mb-1 block text-xs text-slate-600">שעת מקלחה</label>
            <input
              type="time"
              value={bc.bathTime}
              onChange={(e) => setBathTime(e.target.value)}
              className="rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200/60"
            />
          </div>
          {bc.bathTime && (
            <button
              type="button"
              onClick={() => setBathTime("")}
              className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              ניקוי שעה
            </button>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09 }}
        className="rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
      >
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <Pill className="h-5 w-5 text-amber-600" aria-hidden />
          <h2 className="font-semibold text-slate-900">תוספים וסימונים</h2>
        </div>
        <ul className="flex flex-col gap-3 text-right">
          <li className="flex items-center justify-between gap-3 rounded-xl border border-sage-100 bg-cream-50 px-3 py-2">
            <input
              id="vit-d"
              type="checkbox"
              checked={bc.vitaminD}
              onChange={(e) => setMark("vitaminD", e.target.checked)}
              className="h-5 w-5 rounded border-sage-300 text-sage-600 focus:ring-sage-400"
            />
            <label htmlFor="vit-d" className="flex-1 cursor-pointer text-sm font-medium">
              ניתן ויטמין D היום
            </label>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl border border-sage-100 bg-cream-50 px-3 py-2">
            <input
              id="iron"
              type="checkbox"
              checked={bc.iron}
              onChange={(e) => setMark("iron", e.target.checked)}
              className="h-5 w-5 rounded border-sage-300 text-sage-600 focus:ring-sage-400"
            />
            <label htmlFor="iron" className="flex-1 cursor-pointer text-sm font-medium">
              ניתן ברזל (טיפות) היום
            </label>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl border border-sage-100 bg-cream-50 px-3 py-2">
            <input
              id="chah"
              type="checkbox"
              checked={bc.chahGiven}
              onChange={(e) => setMark("chahGiven", e.target.checked)}
              className="h-5 w-5 rounded border-sage-300 text-rose-600 focus:ring-rose-400"
            />
            <label htmlFor="chah" className="flex-1 cursor-pointer text-sm font-medium">
              סימון: נתנו חה
            </label>
          </li>
        </ul>
      </motion.section>
    </div>
  );
}
