/** מבנה המנוי כפי ש־`pushManager.subscribe` ו־`web-push` מצפים לו */
export type NormalizedPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
};

export function parsePushSubscription(
  raw: unknown
): NormalizedPushSubscription | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.endpoint !== "string" || o.endpoint.length === 0) return null;
  const keys = o.keys;
  if (!keys || typeof keys !== "object") return null;
  const k = keys as Record<string, unknown>;
  if (typeof k.p256dh !== "string" || typeof k.auth !== "string") return null;
  const out: NormalizedPushSubscription = {
    endpoint: o.endpoint,
    keys: { p256dh: k.p256dh, auth: k.auth },
  };
  if (o.expirationTime === null || typeof o.expirationTime === "number") {
    out.expirationTime = o.expirationTime as number | null;
  }
  return out;
}
