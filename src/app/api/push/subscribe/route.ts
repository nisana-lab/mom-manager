import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isPushDeviceSnapshot } from "@/lib/push/push-snapshot";
import { parsePushSubscription } from "@/lib/push/subscription-parse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "supabase_missing" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const deviceId = typeof o.deviceId === "string" ? o.deviceId.trim() : "";
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: "device_id" }, { status: 400 });
  }
  const sub = parsePushSubscription(o.subscription);
  if (!sub) {
    return NextResponse.json({ ok: false, error: "subscription" }, { status: 400 });
  }
  if (!isPushDeviceSnapshot(o.state)) {
    return NextResponse.json({ ok: false, error: "state" }, { status: 400 });
  }
  const backgroundPush = o.backgroundPush !== false;
  const now = new Date().toISOString();

  const { data: existing, error: selErr } = await supabase
    .from("mom_push_devices")
    .select("device_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (selErr) {
    return NextResponse.json(
      { ok: false, error: selErr.message },
      { status: 500 }
    );
  }

  if (existing) {
    const { error } = await supabase
      .from("mom_push_devices")
      .update({
        subscription: sub,
        state: o.state,
        background_push: backgroundPush,
        updated_at: now,
      })
      .eq("device_id", deviceId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("mom_push_devices").insert({
      device_id: deviceId,
      subscription: sub,
      state: o.state,
      background_push: backgroundPush,
      pushed_reminder_date: "",
      pushed_reminder_keys: [],
      last_summary_push_date: "",
      updated_at: now,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
