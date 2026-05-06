export function todayLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameLocalDay(isoDate: string): boolean {
  return isoDate === todayLocalISODate();
}

/** הוספת/חיסור ימים לתאריך מקומי YYYY-MM-DD */
export function addDaysToIsoDate(isoDate: string, deltaDays: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** יום ראשון של אותו שבוע כמו isoDate (מקומי) */
export function startOfWeekSundayFromIso(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  const dow = d.getDay();
  return addDaysToIsoDate(isoDate, -dow);
}

/** שבת בלוח מקומי (getDay() === 6), לפי תאריך YYYY-MM-DD */
export function isSaturdayIsoDate(isoDate: string): boolean {
  return new Date(isoDate + "T12:00:00").getDay() === 6;
}
