"use client";

import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";

type Props = {
  completed: number;
  total: number;
};

export function DailyProgress({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <motion.section
      className="rounded-2xl bg-white/90 p-5 shadow-lg shadow-sage-900/5 ring-1 ring-black/5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
            <ListChecks className="h-5 w-5" aria-hidden />
          </span>
          <div className="text-right">
            <h2 className="text-base font-semibold text-slate-800">
              התקדמות יומית
            </h2>
            <p className="text-xs text-slate-500">
              {completed} מתוך {total} משימות הושלמו
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums text-sage-700">
          {pct}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-sage-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-l from-rose-300 via-rose-400 to-sage-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
    </motion.section>
  );
}
