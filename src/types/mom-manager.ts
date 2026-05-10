export type ShoppingItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ShoppingLists = {
  food: ShoppingItem[];
  general: ShoppingItem[];
};

export type MealSelectionKey = "sandwiches" | "dinner";

export type MealSelectionOptions = Record<MealSelectionKey, string[]>;

export type HealthMeals = {
  breakfast: string;
  lunch: string;
  dinner: string;
};

export type HealthPersisted = {
  healthDay: string;
  waterMl: number;
  meals: HealthMeals;
};

export type BabyFeedingLog = {
  id: string;
  time: string;
  /** כמות למשל "90 מ״ל" או "הנקה משמאל" */
  amount: string;
};

export type BabyDiaperType = "pee" | "poo" | "both";

export type BabyDiaperLog = {
  id: string;
  time: string;
  type: BabyDiaperType;
};

export type BabyCarePersisted = {
  babyCareDay: string;
  feedings: BabyFeedingLog[];
  diapers: BabyDiaperLog[];
  /** שעת מקלחה (אופציונלי) */
  bathTime: string;
  vitaminD: boolean;
  iron: boolean;
  /** סימון "נתנו חה" לפי הבקשה */
  chahGiven: boolean;
};

/** סשן הקלטה באולפן */
export type StudioSession = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** שעת ההקלטה (למשל 19:00) */
  recordingTime: string;
  /** שם המקליט */
  recorderName: string;
  /** מי מקליט */
  whoRecords: string;
  /** מגדר */
  gender: string;
  /** שיר */
  song: string;
};

/** ארוחות הילדים — נשמר לפי יום; שבוע מתחיל בראשון; איפוס עם תחילת שבוע חדש (ראשון), לא בשבת */
export type KidsMealsDayEntry = {
  breakfast: string;
  lunch: string;
  dinner: string;
};

export type KidsMealsWeekPersisted = {
  /** יום ראשון של השבוע הפעיל (YYYY-MM-DD) */
  weekStartSunday: string;
  byDay: Record<string, KidsMealsDayEntry>;
};

export type KidsTrackTagKind = "text" | "checkbox";

/** תגית במעקב ילדים — ניתן להוסיף/להסיר */
export type KidsTrackTagDef = {
  id: string;
  label: string;
  kind: KidsTrackTagKind;
};

export type TrackedChild = {
  id: string;
  name: string;
};

export type KidsTrackTagValue = {
  text?: string;
  checked?: boolean;
};

/** מעקב ילדים: ילדים, תגיות מותאמות, ערכים לפי יום */
export type KidsTrackingPersisted = {
  children: TrackedChild[];
  tags: KidsTrackTagDef[];
  /** childId → תאריך → tagId → ערך */
  values: Record<string, Record<string, Record<string, KidsTrackTagValue>>>;
};

/** העדפות התראות וסיכום יומי (שמור במכשיר) */
export type NotificationPrefsPersisted = {
  /** בקשת התראות דפדפן/PWA — עובד כשהאפליקציה פתוחה או ברקע תלוי דפדפן */
  browserNotificationsEnabled: boolean;
  /** התראות Web Push כשהאפליקציה סגורה — דורש Supabase + VAPID והרצת cron בפריסה */
  backgroundPushEnabled: boolean;
  /** שעה 0–23 להצגת סיכום יומי */
  dailySummaryHour: number;
  /** תאריך YYYY-MM-DD שבו הוצג סיכום יומי לאחרונה */
  lastDailySummaryDate: string;
  /** מפתחות תזכורת שכבר נורו היום */
  reminderKeysFiredToday: string[];
  /** מפתח → timestamp (ms) — לא להציג שוב לפני */
  reminderSnoozeUntil: Record<string, number>;
  /** עד 2 מספרי WhatsApp לשליחה מהירה (E.164 ללא +, לדוגמה 9725XXXXXXXX) */
  whatsappRecipients: string[];
  /** הקראת שם המשימה בקול בעת תזכורת (Web Speech, כשהאפליקציה פתוחה) */
  reminderVoiceEnabled: boolean;
};

export function defaultKidsTrackingTags(): KidsTrackTagDef[] {
  return [
    { id: "meal", label: "מה אכל", kind: "text" },
    { id: "homework", label: "שיעורי בית", kind: "text" },
    { id: "meal_on_time", label: "ארוחה בזמן", kind: "checkbox" },
    { id: "teeth", label: "צחצוח שיניים", kind: "checkbox" },
    { id: "test", label: "מבחן", kind: "text" },
    { id: "english", label: "לימוד אנגלית", kind: "checkbox" },
  ];
}

export type MomManagerPersisted = {
  /** YYYY-MM-DD the checklist progress refers to */
  checklistDay: string;
  checklist: Record<string, boolean>;
  selections: {
    sandwiches: string;
    dinner: string;
  };
  selectionOptions: MealSelectionOptions;
  studioSessions: StudioSession[];
  /** ISO date (YYYY-MM-DD) when morning studio banner was dismissed */
  studioMorningDismissedDate: string | null;
  shopping: ShoppingLists;
  health: HealthPersisted;
  babyCare: BabyCarePersisted;
  kidsMeals: KidsMealsWeekPersisted;
  kidsTracking: KidsTrackingPersisted;
  notificationPrefs: NotificationPrefsPersisted;
};

/** מפתח גיבוי מקומי לפני חשבונות — ניסיון ייבוא חד־פעמי */
export const LEGACY_STORAGE_KEY = "mom-manager-v5";

export function storageKeyForUser(userId: string): string {
  return `mom-manager-v5:${userId}`;
}

export const defaultPersistedState = (): MomManagerPersisted => ({
  checklistDay: "",
  checklist: {},
  selections: {
    sandwiches: "גבינה וירקות",
    dinner: "עוף בתנור",
  },
  selectionOptions: {
    sandwiches: ["גבינה וירקות", "טונה", "חומוס וביצה", "לבנה וזיתים", "חביתה"],
    dinner: ["עוף בתנור", "דגים", "פסטה", "פיצה ביתית", "מרק וסלט", "ארוחה חלבית"],
  },
  studioSessions: [],
  studioMorningDismissedDate: null,
  shopping: { food: [], general: [] },
  health: {
    healthDay: "",
    waterMl: 0,
    meals: { breakfast: "", lunch: "", dinner: "" },
  },
  babyCare: {
    babyCareDay: "",
    feedings: [],
    diapers: [],
    bathTime: "",
    vitaminD: false,
    iron: false,
    chahGiven: false,
  },
  kidsMeals: {
    weekStartSunday: "",
    byDay: {},
  },
  kidsTracking: {
    children: [],
    tags: defaultKidsTrackingTags(),
    values: {},
  },
  notificationPrefs: {
    browserNotificationsEnabled: false,
    backgroundPushEnabled: false,
    dailySummaryHour: 20,
    lastDailySummaryDate: "",
    reminderKeysFiredToday: [],
    reminderSnoozeUntil: {},
    whatsappRecipients: [],
    reminderVoiceEnabled: false,
  },
});
