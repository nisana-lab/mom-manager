import webpush from "web-push";

let configured = false;

/** web-push דורש נושא בצורת כתובת (mailto: או https://). מייל לבד נכשל. */
function normalizeVapidSubject(raw: string | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "mailto:team@localhost";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.toLowerCase().startsWith("mailto:")) return s;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `mailto:${s}`;
  return s;
}

export function ensureWebPushConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = normalizeVapidSubject(process.env.VAPID_SUBJECT);
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export { webpush };
