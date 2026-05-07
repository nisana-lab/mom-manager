/**
 * כתובת הפרויקט ב-Supabase חייבת להיות רק את השרת (ללא /rest/v1 וכו').
 * אם מוסיפים נתיב — לקוח ה-SDK מחבר נתיבים כפולים ומתקבלת שגיאה:
 * "Invalid path specified in request URL".
 */
export function normalizeSupabaseProjectUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return s;
  }
}
