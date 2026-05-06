import type { ChecklistTaskDef } from "@/lib/checklist-model";

/** דקות מחצות לפי תווית שעה HH:MM */
export function timeLabelToMinutes(label: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59 || Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

export function nowLocalMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function reminderKey(dateIso: string, taskId: string): string {
  return `${dateIso}|${taskId}`;
}

export type DueReminder = {
  taskId: string;
  title: string;
  timeLabel: string;
};

/**
 * המשימה הראשונה בסדר היום שעדיין לא בוצעה, שעבר זמנה, ולא נחסמה/נודניקה.
 */
export function findNextDueReminder(
  todayIso: string,
  now: Date,
  tasks: ChecklistTaskDef[],
  checklist: Record<string, boolean>,
  fired: Set<string>,
  snoozed: Record<string, number>,
  opts?: { minutesSinceMidnight?: number }
): DueReminder | null {
  const nm =
    opts?.minutesSinceMidnight ?? nowLocalMinutes(now);
  const tMs = now.getTime();
  const sorted = [...tasks].sort((a, b) => a.sortKey - b.sortKey);

  for (const t of sorted) {
    if (checklist[t.id]) continue;
    const tm = timeLabelToMinutes(t.timeLabel);
    if (tm === null) continue;
    const key = reminderKey(todayIso, t.id);
    if (fired.has(key)) continue;
    const snoozeUntil = snoozed[key];
    if (snoozeUntil != null && tMs < snoozeUntil) continue;
    if (nm >= tm) {
      return {
        taskId: t.id,
        title: t.title.trim() || "משימה",
        timeLabel: t.timeLabel,
      };
    }
  }
  return null;
}
