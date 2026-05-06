"use client";

import { motion } from "framer-motion";
import { BellRing, X } from "lucide-react";
import type { StudioSession } from "@/types/mom-manager";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  sessions: StudioSession[];
};

function sessionSummary(s: StudioSession): string {
  const parts: string[] = [];
  if (s.recordingTime) parts.push(`שעה ${s.recordingTime}`);
  if (s.song) parts.push(`שיר: ${s.song}`);
  if (s.whoRecords) parts.push(`מי מקליט: ${s.whoRecords}`);
  if (s.gender) parts.push(`מגדר: ${s.gender}`);
  if (s.recorderName) parts.push(`שם המקליט: ${s.recorderName}`);
  return parts.length > 0 ? parts.join(" · ") : "פרטים באולפן";
}

export function StudioMorningBanner({ visible, onDismiss, sessions }: Props) {
  if (!visible) return null;

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-l from-rose-50 to-white shadow-md shadow-rose-900/10"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <BellRing className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-right">
          <p className="font-semibold text-rose-950">תזכורת אולפן — הבוקר</p>
          <p className="mt-1 text-sm leading-relaxed text-rose-900/85">
            יש לך הקלטה מתוזמנת להיום. נוספה משימת הכנה ב־20:00 —
            &quot;הכנת האולפן וסידור הבית לקראת לקוח&quot;.
          </p>
          <ul className="mt-3 space-y-2 border-t border-rose-100/80 pt-3 text-right">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-rose-950/90"
              >
                {sessionSummary(s)}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl p-2 text-rose-700 transition hover:bg-rose-100"
          aria-label="סגור תזכורת"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}
