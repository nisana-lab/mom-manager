"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";

function formatTime(d: Date) {
  return d.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="h-24 animate-pulse rounded-2xl bg-white/40 shadow-inner" />
    );
  }

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f4f7f4] via-white to-[#fdeef2] p-5 shadow-lg shadow-sage-900/5 ring-1 ring-black/5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sage-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-rose-200/35 blur-3xl" />
      <div className="relative flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-medium text-sage-800/80">
          <Clock3 className="h-4 w-4 text-sage-600" aria-hidden />
          <span>שעון חי</span>
        </div>
        <p className="text-4xl font-semibold tracking-tight text-slate-800 tabular-nums">
          {formatTime(now)}
        </p>
        <p className="text-sm text-slate-600">{formatDate(now)}</p>
      </div>
    </motion.div>
  );
}
