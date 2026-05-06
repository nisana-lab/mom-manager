/**
 * אפשרויות ארוחות ילדים — אותה רשימה לבוקר, צהריים וערב (לפי בקשת המשתמשת).
 * סדר לפי קבוצות המקור בתמונה + מוקרם לערב.
 */
export type KidsMealChoice = { id: string; label: string };

export const KIDS_UNIFIED_MEAL_OPTIONS: KidsMealChoice[] = [
  { id: "b-omelet", label: "חביתה" },
  { id: "b-tuna", label: "טונה" },
  { id: "b-cheese-cucumber", label: "גבינה/קוטג' ומלפפון" },
  { id: "b-chocolate", label: "שוקולד" },
  { id: "b-toast", label: "טוסט" },
  { id: "b-halva", label: "חלווה" },
  { id: "b-veg-fruit", label: "חיתוך ירקות ופרי" },
  { id: "l-pasta-corn-schnitzel", label: "פסטה ושניצל תירס" },
  { id: "l-noodles", label: "נודלס מוקפץ" },
  { id: "l-couscous", label: "קוסקוס וירקות" },
  { id: "l-chips-schnitzel", label: "צ'יפס ושניצל" },
  { id: "l-ptitim", label: "פתיתים וקציצות/נקניקיות" },
  { id: "l-rice-chicken", label: "אורז ועוף" },
  { id: "d-shakshuka", label: "שקשוקה" },
  { id: "d-pancakes", label: "פנקייקים" },
  { id: "d-cereal", label: "קורנפלקส וחלב" },
  { id: "d-kneidel", label: "מרק קניידלך" },
  { id: "d-toasts", label: "טוסטים" },
  { id: "d-malawach", label: "מלוואח עם ביצה וטונה" },
  { id: "d-gratin", label: "מוקרם" },
];

const presetLabels = new Set(KIDS_UNIFIED_MEAL_OPTIONS.map((o) => o.label));

export function isKidsMealPresetLabel(value: string): boolean {
  return presetLabels.has(value);
}

export const KIDS_MEAL_SELECT_OTHER = "__other__";
