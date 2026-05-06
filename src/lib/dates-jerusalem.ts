/** תאריך מקומי YYYY-MM-DD בזמן ירושלים */
export function todayIsoJerusalem(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}

/** 0 = ראשון … 6 = שבת (כמו `Date.getDay()`) בזמן ירושלים */
export function weekdayJerusalem(d = new Date()): number {
  const w = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
  }).format(d);
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
  return idx >= 0 ? idx : 0;
}

/** דקות מחצות בזמן ירושלים */
export function minutesSinceMidnightJerusalem(d = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}
