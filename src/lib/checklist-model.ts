import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  BookOpen,
  BrushCleaning,
  Building2,
  ChefHat,
  ClipboardList,
  Droplets,
  Home,
  LightbulbOff,
  MessageSquare,
  Moon,
  Shirt,
  Sparkles,
  Heart,
  TrainFront,
  UsersRound,
  Utensils,
  UtensilsCrossed,
} from "lucide-react";
import { getDeepCleaningLabel } from "@/lib/deep-cleaning";

export type ChecklistTaskType =
  | "standard"
  | "mandatory"
  | "deep-clean"
  | "dropdown"
  | "studio";

export type ChecklistTaskDef = {
  id: string;
  /** Display time (Hebrew / fixed string) */
  timeLabel: string;
  title: string;
  Icon: LucideIcon;
  sortKey: number;
  kind: ChecklistTaskType;
  /** When kind === 'dropdown' */
  dropdownKey?: "sandwiches" | "dinner";
  dropdownOptions?: string[];
};

export const SANDWICH_OPTIONS = [
  "גבינה וירקות",
  "טונה",
  "חומוס וביצה",
  "לבנה וזיתים",
  "חביתה",
] as const;

export const DINNER_OPTIONS = [
  "עוף בתנור",
  "דגים",
  "פסטה",
  "פיצה ביתית",
  "מרק וסלט",
  "ארוחה חלבית",
] as const;

const baseTasks: ChecklistTaskDef[] = [
  {
    id: "morning-routine",
    timeLabel: "05:45",
    title: "קימה, קפה והנקה",
    Icon: AlarmClock,
    sortKey: 10,
    kind: "standard",
  },
  {
    id: "prep-makeup",
    timeLabel: "06:15",
    title: "התארגנות ואיפור",
    Icon: Sparkles,
    sortKey: 20,
    kind: "standard",
  },
  {
    id: "sandwiches",
    timeLabel: "06:45",
    title: "הכנת סנדוויצ'ים ובקבוקי מים",
    Icon: UtensilsCrossed,
    sortKey: 30,
    kind: "dropdown",
    dropdownKey: "sandwiches",
    dropdownOptions: [...SANDWICH_OPTIONS],
  },
  {
    id: "wake-all",
    timeLabel: "07:00",
    title: "להעיר את כולם והלבשת הקטן",
    Icon: UsersRound,
    sortKey: 40,
    kind: "standard",
  },
  {
    id: "train",
    timeLabel: "07:20",
    title: "יציאה לרכבת",
    Icon: TrainFront,
    sortKey: 50,
    kind: "standard",
  },
  {
    id: "teacher-parents",
    timeLabel: "08:00",
    title: "שליחת הודעת עדכון להורים",
    Icon: MessageSquare,
    sortKey: 55,
    kind: "standard",
  },
  {
    id: "teacher-lesson",
    timeLabel: "08:30",
    title: "הכנת מערך שיעור",
    Icon: ClipboardList,
    sortKey: 57,
    kind: "standard",
  },
  {
    id: "lunch",
    timeLabel: "15:30",
    title: "נחיתה וארוחת צהריים",
    Icon: Utensils,
    sortKey: 100,
    kind: "mandatory",
  },
  {
    id: "quick-clean",
    timeLabel: "16:00",
    title: "Quick Clean (30 דק'): סידור הבית + הכנסת מכונה",
    Icon: Home,
    sortKey: 110,
    kind: "standard",
  },
  {
    id: "deep-clean",
    timeLabel: "16:30",
    title: "", // filled dynamically
    Icon: BrushCleaning,
    sortKey: 120,
    kind: "deep-clean",
  },
  {
    id: "kids-time",
    timeLabel: "17:00",
    title: "Kids Time: שיעורי בית / משחקים",
    Icon: BookOpen,
    sortKey: 130,
    kind: "standard",
  },
  {
    id: "dinner",
    timeLabel: "18:30",
    title: "ארוחת ערב",
    Icon: ChefHat,
    sortKey: 140,
    kind: "dropdown",
    dropdownKey: "dinner",
    dropdownOptions: [...DINNER_OPTIONS],
  },
  {
    id: "hygiene-kids",
    timeLabel: "19:00",
    title: "מקלחות וצחצוח שיניים",
    Icon: Droplets,
    sortKey: 150,
    kind: "standard",
  },
  {
    id: "bedtime-kids",
    timeLabel: "20:00",
    title: "שעת שינה לילדים",
    Icon: Moon,
    sortKey: 162,
    kind: "standard",
  },
  {
    id: "tomorrow-prep",
    timeLabel: "20:15",
    title: "מחר: בגדים ותיקים (4 ילדים + שלי)",
    Icon: Shirt,
    sortKey: 170,
    kind: "standard",
  },
  {
    id: "personal-time",
    timeLabel: "21:00",
    title: "זמן אישי: מקלחת וארוחה",
    Icon: Heart,
    sortKey: 180,
    kind: "standard",
  },
  {
    id: "lights-out",
    timeLabel: "21:30",
    title: "כיבוי אורות",
    Icon: LightbulbOff,
    sortKey: 190,
    kind: "standard",
  },
];

const studioPrepTask: ChecklistTaskDef = {
  id: "studio-prep",
  timeLabel: "20:00",
  title: "הכנת האולפן וסידור הבית לקראת לקוח",
  Icon: Building2,
  sortKey: 158,
  kind: "studio",
};

/**
 * @param jsWeekDay יום בשבוע כמו `Date.getDay()` — 0=ראשון … 6=שבת
 */
export function buildTodayTasksForDay(
  includeStudioPrep: boolean,
  jsWeekDay: number
): ChecklistTaskDef[] {
  /** שבת — אין ניקוי עומק ברשימה */
  const filtered = baseTasks.filter(
    (t) => !(t.id === "deep-clean" && jsWeekDay === 6)
  );

  const withDeep: ChecklistTaskDef[] = filtered.map((t) => {
    if (t.id !== "deep-clean") return t;
    return {
      ...t,
      title: `ניקוי עומק: ${getDeepCleaningLabel(jsWeekDay)}`,
    };
  });

  if (!includeStudioPrep) {
    return [...withDeep].sort((a, b) => a.sortKey - b.sortKey);
  }

  const merged = [...withDeep, studioPrepTask];
  return merged.sort((a, b) => a.sortKey - b.sortKey);
}

export function buildTodayTasks(includeStudioPrep: boolean): ChecklistTaskDef[] {
  return buildTodayTasksForDay(includeStudioPrep, new Date().getDay());
}
