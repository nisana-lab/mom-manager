import { NextRequest, NextResponse } from "next/server";
import { evaluatePushForDevice } from "@/lib/push/evaluate-push";
import { dbRowToCronDevice } from "@/lib/push/db-row";
import { findNextDueReminder, reminderKey } from "@/lib/task-reminders";
import { buildTodayTasksForDay } from "@/lib/checklist-model";
import {
  minutesSinceMidnightJerusalem,
  todayIsoJerusalem,
  weekdayJerusalem,
} from "@/lib/dates-jerusalem";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureWebPushConfigured } from "@/lib/push/configure-web-push";
import type { CronDeviceRow } from "@/lib/push/evaluate-push";

export const dynamic = "force-dynamic";

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function whyNoPlan(row: CronDeviceRow): string {
  if (!row.background_push) return "השדה background_push בטבלה false";
  if (!row.subscription) return "אין subscription בטבלה";
  const snap = row.state;
  if (!snap?.notificationPrefs?.backgroundPushEnabled) {
    return "ב־state שמור בטבלה: backgroundPushEnabled = false — פתחי את האתר, סמני שוב «גם כשהאפליקציה סגורה», המתיני ורענני";
  }
  const todayIso = todayIsoJerusalem();
  if (!snap.checklistDay || snap.checklistDay !== todayIso) {
    return "יום צ׳ק-ליסט ב-state לא היום (או ריק) — נטען יום נקי; עדיף לפתוח פעם את האפליקציה היום כדי לסנכרן";
  }
  const hasStudio = snap.studioSessions.some((s) => s.date === todayIso);
  const wday = weekdayJerusalem();
  const tasks = buildTodayTasksForDay(hasStudio, wday);
  const now = new Date();
  const mins = minutesSinceMidnightJerusalem(now);
  const fired = new Set(snap.notificationPrefs.reminderKeysFiredToday);
  const snooze = { ...snap.notificationPrefs.reminderSnoozeUntil };
  const checklist = snap.checklist;
  const due = findNextDueReminder(
    todayIso,
    now,
    tasks,
    checklist,
    fired,
    snooze,
    { minutesSinceMidnight: mins }
  );
  if (!due) {
    return "אין כרגע משימה «באיחור» (לפי שעון ישראל): או שכל המשימות לפני עכשיו כבר מסומנות כבוצעות, או שעות המשימות עדיין בעתיד, או נודניק/ביטול ליום";
  }
  let pushedKeys = [...row.pushed_reminder_keys];
  let pushedDate = row.pushed_reminder_date;
  if (pushedDate !== todayIso) pushedKeys = [];
  const key = reminderKey(todayIso, due.taskId);
  if (pushedKeys.includes(key)) {
    return "כבר נשלחה היום התראה push למשימה הזו (מופיע ב-pushed_reminder_keys)";
  }
  return "לא ידוע — אמור היה לשלוח; הריצי שוב /api/push/cron";
}

export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: "unauthorized",
        hint: "בפרודקשן צריך כותרת Authorization: Bearer והערך של CRON_SECRET מ-Vercel",
      },
      { status: 401 }
    );
  }

  const vapidOk = ensureWebPushConfigured();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "supabase_missing" },
      { status: 503 }
    );
  }

  const now = new Date();
  const { data: rows, error } = await supabase
    .from("mom_push_devices")
    .select("*")
    .eq("background_push", true);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const list = rows ?? [];
  const results: Array<Record<string, unknown>> = [];

  for (const raw of list) {
    const row = dbRowToCronDevice(raw as Record<string, unknown>);
    if (!row) {
      results.push({
        device_id: (raw as { device_id?: string }).device_id,
        ok: false,
        reason: "שגיאת פרסור שורה (subscription/state)",
      });
      continue;
    }
    const plan = evaluatePushForDevice(row);
    results.push({
      device_id: row.device_id,
      wouldSendPush: plan !== null,
      kind: plan?.kind ?? null,
      titleIfAny: plan?.push.title ?? null,
      whyNot: plan ? null : whyNoPlan(row),
    });
  }

  return NextResponse.json({
    ok: true,
    serverTimeUtc: now.toISOString(),
    todayJerusalem: todayIsoJerusalem(),
    minutesSinceMidnightJerusalem: minutesSinceMidnightJerusalem(now),
    vapidConfigured: vapidOk,
    cronSecretSet: Boolean(process.env.CRON_SECRET?.trim()),
    devicesChecked: list.length,
    results,
  });
}
