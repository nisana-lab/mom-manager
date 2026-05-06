import { buildDailySummary } from "@/lib/daily-summary";
import { buildTodayTasksForDay } from "@/lib/checklist-model";
import {
  findNextDueReminder,
  reminderKey,
} from "@/lib/task-reminders";
import {
  minutesSinceMidnightJerusalem,
  todayIsoJerusalem,
  weekdayJerusalem,
} from "@/lib/dates-jerusalem";
import type { PushDeviceSnapshot } from "@/lib/push/push-snapshot";

export type CronDeviceRow = {
  device_id: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } } | null;
  state: PushDeviceSnapshot;
  background_push: boolean;
  pushed_reminder_date: string;
  pushed_reminder_keys: string[];
  last_summary_push_date: string;
};

export type PushPayload = {
  title: string;
  body: string;
  tag: string;
};

export type EvaluatePushResult = {
  push: PushPayload;
  kind: "reminder" | "summary";
  nextPushedReminderDate: string;
  nextPushedReminderKeys: string[];
  nextSummaryPushDate: string;
};

function normalizeForJerusalemToday(snap: PushDeviceSnapshot): {
  todayIso: string;
  checklist: Record<string, boolean>;
  fired: Set<string>;
  snooze: Record<string, number>;
  prefs: PushDeviceSnapshot["notificationPrefs"];
} {
  const todayIso = todayIsoJerusalem();
  let checklist = snap.checklist;
  let fired = new Set(snap.notificationPrefs.reminderKeysFiredToday);
  let snooze = { ...snap.notificationPrefs.reminderSnoozeUntil };
  if (!snap.checklistDay || snap.checklistDay !== todayIso) {
    checklist = {};
    fired = new Set();
    snooze = {};
  }
  return {
    todayIso,
    checklist,
    fired,
    snooze,
    prefs: snap.notificationPrefs,
  };
}

export function evaluatePushForDevice(row: CronDeviceRow): EvaluatePushResult | null {
  if (!row.background_push || !row.subscription) return null;
  const snap = row.state;
  if (!snap.notificationPrefs.backgroundPushEnabled) return null;

  const { todayIso, checklist, fired, snooze, prefs } =
    normalizeForJerusalemToday(snap);

  const hasStudio = snap.studioSessions.some((s) => s.date === todayIso);
  const wday = weekdayJerusalem();
  const tasks = buildTodayTasksForDay(hasStudio, wday);
  const now = new Date();
  const mins = minutesSinceMidnightJerusalem(now);

  const due = findNextDueReminder(
    todayIso,
    now,
    tasks,
    checklist,
    fired,
    snooze,
    { minutesSinceMidnight: mins }
  );

  let pushedKeys = [...row.pushed_reminder_keys];
  let pushedDate = row.pushed_reminder_date;
  if (pushedDate !== todayIso) {
    pushedKeys = [];
    pushedDate = todayIso;
  }

  if (due) {
    const key = reminderKey(todayIso, due.taskId);
    if (pushedKeys.includes(key)) return null;
    return {
      push: {
        title: `MOM-MANAGER · ${due.timeLabel}`,
        body: due.title,
        tag: key,
      },
      kind: "reminder",
      nextPushedReminderDate: todayIso,
      nextPushedReminderKeys: [...pushedKeys, key],
      nextSummaryPushDate: row.last_summary_push_date,
    };
  }

  const hourJ = Math.floor(mins / 60);
  const summary = buildDailySummary(checklist, tasks);
  if (
    hourJ >= prefs.dailySummaryHour &&
    prefs.lastDailySummaryDate !== todayIso &&
    summary.total > 0 &&
    row.last_summary_push_date !== todayIso
  ) {
    return {
      push: {
        title: "MOM-MANAGER · סיכום היום",
        body: summary.headline,
        tag: `daily-summary|${todayIso}`,
      },
      kind: "summary",
      nextPushedReminderDate: pushedDate,
      nextPushedReminderKeys: pushedKeys,
      nextSummaryPushDate: todayIso,
    };
  }

  return null;
}
