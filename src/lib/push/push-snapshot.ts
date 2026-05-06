import type { MomManagerPersisted } from "@/types/mom-manager";

/** מצב מצומצם לסנכרון push (ללא נתונים אישיים מיותרים) */
export type PushDeviceSnapshot = {
  checklistDay: string;
  checklist: Record<string, boolean>;
  notificationPrefs: MomManagerPersisted["notificationPrefs"];
  studioSessions: { date: string }[];
};

export function buildPushSnapshot(
  state: MomManagerPersisted
): PushDeviceSnapshot {
  return {
    checklistDay: state.checklistDay,
    checklist: state.checklist,
    notificationPrefs: state.notificationPrefs,
    studioSessions: state.studioSessions.map((s) => ({ date: s.date })),
  };
}

export function isPushDeviceSnapshot(x: unknown): x is PushDeviceSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.checklistDay !== "string") return false;
  if (!o.checklist || typeof o.checklist !== "object") return false;
  if (!o.notificationPrefs || typeof o.notificationPrefs !== "object") return false;
  if (!Array.isArray(o.studioSessions)) return false;
  return true;
}
