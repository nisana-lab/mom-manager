"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import { useMomManager } from "@/hooks/use-mom-manager";

export function KidsTrackingHomeCard() {
  const { state, ready } = useMomManager();

  if (!ready || !state) {
    return (
      <div className="h-24 animate-pulse rounded-2xl bg-white/50 shadow-inner" />
    );
  }

  const n = state.kidsTracking.children.length;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-sage-200/80 bg-white/95 p-4 shadow-lg shadow-sage-900/5 ring-1 ring-black/5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sage-800">
          <Users className="h-5 w-5 shrink-0" aria-hidden />
          <h2 className="text-base font-semibold text-slate-900">מעקב ילדים</h2>
        </div>
        <Link
          href="/kids-tracking"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-sage-700 hover:text-sage-900"
        >
          פתח מעקב
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <p className="mt-2 text-right text-sm text-slate-600">
        {n === 0
          ? "הוסיפי ילדים ותגיות — ארוחות, שיעורים, מבחנים. בסוף המסך: סיכום שבועי וייצוא להעתקה."
          : `${n} ${n === 1 ? "ילד ברשימה" : "ילדים ברשימה"} — רישום יומי, סיכום א׳–ש׳ והעתקה לוואטסאפ.`}
      </p>
    </motion.section>
  );
}
