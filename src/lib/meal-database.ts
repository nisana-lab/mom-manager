export type MealOption = { id: string; label: string; kcal: number };

export const BREAKFAST_OPTIONS: MealOption[] = [
  { id: "", label: "— לא נבחר —", kcal: 0 },
  { id: "yogurt-fruit", label: "יוגורט ופירות", kcal: 320 },
  { id: "eggs-toast", label: "ביצים ולחם מלא", kcal: 420 },
  { id: "oatmeal", label: "שיבולת שועל", kcal: 350 },
  { id: "coffee-light", label: "קפה ומשהו קל", kcal: 120 },
];

export const LUNCH_OPTIONS: MealOption[] = [
  { id: "", label: "— לא נבחר —", kcal: 0 },
  { id: "salad-protein", label: "סלט + חלבון", kcal: 380 },
  { id: "sandwich", label: "סנדוויץ'", kcal: 480 },
  { id: "full-meal", label: "ארוחה ביתית מלאה", kcal: 620 },
  { id: "soup-salad", label: "מרק וסלט", kcal: 340 },
];

export const DINNER_OPTIONS: MealOption[] = [
  { id: "", label: "— לא נבחר —", kcal: 0 },
  { id: "chicken-veg", label: "עוף וירקות", kcal: 450 },
  { id: "fish", label: "דג ותוספת", kcal: 400 },
  { id: "pasta", label: "פסטה", kcal: 520 },
  { id: "light-salad", label: "ארוחה קלה / סלט", kcal: 280 },
];

const byId = new Map<string, MealOption>();

for (const o of [
  ...BREAKFAST_OPTIONS,
  ...LUNCH_OPTIONS,
  ...DINNER_OPTIONS,
]) {
  if (o.id) byId.set(o.id, o);
}

export function kcalForMealIds(ids: {
  breakfast: string;
  lunch: string;
  dinner: string;
}): number {
  let sum = 0;
  for (const key of ["breakfast", "lunch", "dinner"] as const) {
    const id = ids[key];
    if (!id) continue;
    sum += byId.get(id)?.kcal ?? 0;
  }
  return sum;
}

export const CALORIE_GOAL = 1400;
export const WATER_GOAL_ML = 2000;
