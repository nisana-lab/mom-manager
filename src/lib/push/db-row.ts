import type { CronDeviceRow } from "@/lib/push/evaluate-push";
import { isPushDeviceSnapshot } from "@/lib/push/push-snapshot";
import { parsePushSubscription } from "@/lib/push/subscription-parse";

export function dbRowToCronDevice(
  raw: Record<string, unknown>
): CronDeviceRow | null {
  if (typeof raw.device_id !== "string") return null;
  const sub = parsePushSubscription(raw.subscription);
  if (!sub) return null;
  if (!isPushDeviceSnapshot(raw.state)) return null;
  const keys = Array.isArray(raw.pushed_reminder_keys)
    ? raw.pushed_reminder_keys.filter(
        (x): x is string => typeof x === "string"
      )
    : [];
  return {
    device_id: raw.device_id,
    subscription: sub,
    state: raw.state,
    background_push: Boolean(raw.background_push),
    pushed_reminder_date:
      typeof raw.pushed_reminder_date === "string"
        ? raw.pushed_reminder_date
        : "",
    pushed_reminder_keys: keys,
    last_summary_push_date:
      typeof raw.last_summary_push_date === "string"
        ? raw.last_summary_push_date
        : "",
  };
}
