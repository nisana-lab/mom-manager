import { NextRequest, NextResponse } from "next/server";
import { evaluatePushForDevice } from "@/lib/push/evaluate-push";
import { dbRowToCronDevice } from "@/lib/push/db-row";
import { ensureWebPushConfigured, webpush } from "@/lib/push/configure-web-push";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!ensureWebPushConfigured()) {
    return NextResponse.json(
      { ok: false, error: "vapid_missing" },
      { status: 503 }
    );
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "supabase_missing" },
      { status: 503 }
    );
  }

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

  let sent = 0;
  const list = rows ?? [];

  for (const raw of list) {
    const row = dbRowToCronDevice(raw as Record<string, unknown>);
    if (!row) continue;
    const plan = evaluatePushForDevice(row);
    if (!plan || !row.subscription) continue;
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title: plan.push.title,
          body: plan.push.body,
          tag: plan.push.tag,
        }),
        { TTL: 300 }
      );
      sent += 1;
      await supabase
        .from("mom_push_devices")
        .update({
          pushed_reminder_date: plan.nextPushedReminderDate,
          pushed_reminder_keys: plan.nextPushedReminderKeys,
          last_summary_push_date: plan.nextSummaryPushDate,
          updated_at: new Date().toISOString(),
        })
        .eq("device_id", row.device_id);
    } catch (e: unknown) {
      const statusCode =
        e && typeof e === "object" && "statusCode" in e
          ? Number((e as { statusCode?: number }).statusCode)
          : undefined;
      if (statusCode === 410) {
        await supabase
          .from("mom_push_devices")
          .delete()
          .eq("device_id", row.device_id);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    checked: list.length,
  });
}
