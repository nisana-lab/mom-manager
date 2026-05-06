/** יום ראשון = 0 … שישי = 5 (JavaScript Date.getDay()). בשבת אין משימת ניקוי עומק בלוח. */
export function getDeepCleaningLabel(dayIndex: number): string {
  const map: Record<number, string> = {
    0: "מטבח",
    1: "מטבח + חדר כביסה",
    2: "חדר הורים + מצעים",
    3: "שטיפה + שירותים ומקלחת",
    4: "חדרי ילדים + מצעים",
    5: "בישולים וסדר כללי",
  };
  return map[dayIndex] ?? "";
}
