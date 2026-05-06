import {
  LEGACY_STORAGE_KEY,
  defaultPersistedState,
  storageKeyForUser,
  type BabyDiaperLog,
  type BabyDiaperType,
  type BabyFeedingLog,
  type KidsMealsDayEntry,
  type KidsTrackTagDef,
  type KidsTrackTagValue,
  type MomManagerPersisted,
  type StudioSession,
  type TrackedChild,
} from "@/types/mom-manager";
import { todayLocalISODate, startOfWeekSundayFromIso } from "@/lib/dates";

function normalizeForToday(base: MomManagerPersisted): MomManagerPersisted {
  const today = todayLocalISODate();
  const np =
    base.notificationPrefs ?? defaultPersistedState().notificationPrefs;
  if (!base.checklistDay || base.checklistDay !== today) {
    return {
      ...base,
      checklistDay: today,
      checklist: {},
      notificationPrefs: {
        ...np,
        reminderKeysFiredToday: [],
        reminderSnoozeUntil: {},
      },
    };
  }
  return base;
}

function normalizeHealthForToday(base: MomManagerPersisted): MomManagerPersisted {
  const today = todayLocalISODate();
  const defH = defaultPersistedState().health;
  const h = base.health && typeof base.health === "object" ? base.health : defH;
  if (!h.healthDay || h.healthDay !== today) {
    return {
      ...base,
      health: {
        healthDay: today,
        waterMl: 0,
        meals: { breakfast: "", lunch: "", dinner: "" },
      },
    };
  }
  return base;
}

function normalizeBabyCareForToday(base: MomManagerPersisted): MomManagerPersisted {
  const today = todayLocalISODate();
  const defBc = defaultPersistedState().babyCare;
  const bc = base.babyCare && typeof base.babyCare === "object" ? base.babyCare : defBc;
  if (!bc.babyCareDay || bc.babyCareDay !== today) {
    return {
      ...base,
      babyCare: {
        babyCareDay: today,
        feedings: [],
        diapers: [],
        bathTime: "",
        vitaminD: false,
        iron: false,
        chahGiven: false,
      },
    };
  }
  return base;
}

function mergeShopping(
  parsed: Partial<MomManagerPersisted>
): MomManagerPersisted["shopping"] {
  const def = defaultPersistedState().shopping;
  const s = parsed.shopping;
  if (!s || typeof s !== "object") return def;
  const food = Array.isArray(s.food) ? s.food : def.food;
  const general = Array.isArray(s.general) ? s.general : def.general;
  return { food, general };
}

function normalizeKidsMealsWeek(base: MomManagerPersisted): MomManagerPersisted {
  const today = todayLocalISODate();
  const thisSunday = startOfWeekSundayFromIso(today);

  const km = base.kidsMeals;
  if (!km.weekStartSunday || km.weekStartSunday !== thisSunday) {
    return {
      ...base,
      kidsMeals: {
        weekStartSunday: thisSunday,
        byDay: {},
      },
    };
  }

  return base;
}

function mergeKidsMeals(
  parsed: Partial<MomManagerPersisted>
): MomManagerPersisted["kidsMeals"] {
  const def = defaultPersistedState().kidsMeals;
  const k = parsed.kidsMeals;
  if (!k || typeof k !== "object") return { ...def };

  const byDay: Record<string, KidsMealsDayEntry> = {};
  if (k.byDay && typeof k.byDay === "object") {
    for (const [date, raw] of Object.entries(k.byDay)) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      byDay[date] = {
        breakfast: typeof o.breakfast === "string" ? o.breakfast : "",
        lunch: typeof o.lunch === "string" ? o.lunch : "",
        dinner: typeof o.dinner === "string" ? o.dinner : "",
      };
    }
  }

  return {
    weekStartSunday:
      typeof k.weekStartSunday === "string" ? k.weekStartSunday : def.weekStartSunday,
    byDay,
  };
}

function isTagKind(k: unknown): k is KidsTrackTagDef["kind"] {
  return k === "text" || k === "checkbox";
}

function mergeKidsTracking(
  parsed: Partial<MomManagerPersisted>
): MomManagerPersisted["kidsTracking"] {
  const def = defaultPersistedState().kidsTracking;
  const raw = parsed.kidsTracking;
  if (!raw || typeof raw !== "object") return { ...def };

  const children: TrackedChild[] = [];
  if (Array.isArray(raw.children)) {
    for (const item of raw.children) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      if (typeof o.id !== "string") continue;
      const name = typeof o.name === "string" ? o.name.trim() : "";
      if (name) children.push({ id: o.id, name });
    }
  }

  let tags: KidsTrackTagDef[];
  if (!Array.isArray(raw.tags)) {
    tags = def.tags;
  } else if (raw.tags.length === 0) {
    tags = [];
  } else {
    const next: KidsTrackTagDef[] = [];
    for (const item of raw.tags) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      if (typeof o.id !== "string") continue;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label) continue;
      const kind = isTagKind(o.kind) ? o.kind : "text";
      next.push({ id: o.id, label, kind });
    }
    tags = next.length > 0 ? next : [];
  }

  const childIds = new Set(children.map((c) => c.id));
  const tagIds = new Set(tags.map((t) => t.id));

  const values: MomManagerPersisted["kidsTracking"]["values"] = {};
  if (raw.values && typeof raw.values === "object") {
    for (const [childId, byDate] of Object.entries(raw.values)) {
      if (!childIds.has(childId)) continue;
      if (!byDate || typeof byDate !== "object") continue;
      values[childId] = {};
      for (const [date, byTag] of Object.entries(byDate)) {
        if (typeof date !== "string" || !byTag || typeof byTag !== "object") continue;
        values[childId][date] = {};
        for (const [tagId, val] of Object.entries(byTag)) {
          if (!tagIds.has(tagId)) continue;
          if (!val || typeof val !== "object") continue;
          const v = val as Record<string, unknown>;
          const tag = tags.find((t) => t.id === tagId);
          if (!tag) continue;
          const out: KidsTrackTagValue = {};
          if (tag.kind === "text") {
            out.text = typeof v.text === "string" ? v.text : "";
          } else {
            out.checked = Boolean(v.checked);
          }
          values[childId][date][tagId] = out;
        }
      }
    }
  }

  return { children, tags, values };
}

function mergeHealth(
  parsed: Partial<MomManagerPersisted>
): MomManagerPersisted["health"] {
  const def = defaultPersistedState().health;
  const h = parsed.health;
  if (!h || typeof h !== "object") return { ...def };
  return {
    healthDay: typeof h.healthDay === "string" ? h.healthDay : def.healthDay,
    waterMl: typeof h.waterMl === "number" && h.waterMl >= 0 ? h.waterMl : def.waterMl,
    meals: {
      breakfast:
        typeof h.meals?.breakfast === "string"
          ? h.meals.breakfast
          : def.meals.breakfast,
      lunch:
        typeof h.meals?.lunch === "string" ? h.meals.lunch : def.meals.lunch,
      dinner:
        typeof h.meals?.dinner === "string"
          ? h.meals.dinner
          : def.meals.dinner,
    },
  };
}

function isDiaperType(t: unknown): t is BabyDiaperType {
  return t === "pee" || t === "poo" || t === "both";
}

function mergeBabyCare(
  parsed: Partial<MomManagerPersisted>
): MomManagerPersisted["babyCare"] {
  const def = defaultPersistedState().babyCare;
  const b = parsed.babyCare;
  if (!b || typeof b !== "object") return { ...def };

  const feedings: BabyFeedingLog[] = [];
  if (Array.isArray(b.feedings)) {
    for (const raw of b.feedings) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      if (typeof o.id === "string" && typeof o.time === "string") {
        feedings.push({
          id: o.id,
          time: o.time,
          amount: typeof o.amount === "string" ? o.amount : "",
        });
      }
    }
  }

  const diapers: BabyDiaperLog[] = [];
  if (Array.isArray(b.diapers)) {
    for (const raw of b.diapers) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      if (
        typeof o.id === "string" &&
        typeof o.time === "string" &&
        isDiaperType(o.type)
      ) {
        diapers.push({ id: o.id, time: o.time, type: o.type });
      }
    }
  }

  return {
    babyCareDay:
      typeof b.babyCareDay === "string" ? b.babyCareDay : def.babyCareDay,
    feedings,
    diapers,
    bathTime: typeof b.bathTime === "string" ? b.bathTime : def.bathTime,
    vitaminD: Boolean(b.vitaminD),
    iron: Boolean(b.iron),
    chahGiven: Boolean(b.chahGiven),
  };
}

function newStudioSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStudioSession(raw: unknown): StudioSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.date !== "string") return null;
  return {
    id: o.id,
    date: o.date,
    recordingTime: typeof o.recordingTime === "string" ? o.recordingTime : "",
    recorderName: typeof o.recorderName === "string" ? o.recorderName : "",
    whoRecords: typeof o.whoRecords === "string" ? o.whoRecords : "",
    gender: typeof o.gender === "string" ? o.gender : "",
    song: typeof o.song === "string" ? o.song : "",
  };
}

type ParsedWithLegacyStudio = Partial<MomManagerPersisted> & {
  studioSessionDates?: string[];
};

function mergeStudio(parsed: ParsedWithLegacyStudio): StudioSession[] {
  if (Array.isArray(parsed.studioSessions)) {
    const out: StudioSession[] = [];
    for (const item of parsed.studioSessions) {
      const n = normalizeStudioSession(item);
      if (n) out.push(n);
    }
    return out;
  }
  if (Array.isArray(parsed.studioSessionDates)) {
    return parsed.studioSessionDates
      .filter((d): d is string => typeof d === "string" && d.length > 0)
      .map((date) => ({
        id: newStudioSessionId(),
        date,
        recordingTime: "",
        recorderName: "",
        whoRecords: "",
        gender: "",
        song: "",
      }));
  }
  return [];
}

function mergeNotificationPrefs(
  parsed: Partial<MomManagerPersisted>
): MomManagerPersisted["notificationPrefs"] {
  const def = defaultPersistedState().notificationPrefs;
  const n = parsed.notificationPrefs;
  if (!n || typeof n !== "object") return { ...def };

  const hour =
    typeof n.dailySummaryHour === "number" &&
    n.dailySummaryHour >= 0 &&
    n.dailySummaryHour <= 23
      ? n.dailySummaryHour
      : def.dailySummaryHour;

  const snooze: Record<string, number> = {};
  if (n.reminderSnoozeUntil && typeof n.reminderSnoozeUntil === "object") {
    for (const [k, v] of Object.entries(n.reminderSnoozeUntil)) {
      if (typeof v === "number" && v > 0) snooze[k] = v;
    }
  }

  return {
    browserNotificationsEnabled: Boolean(n.browserNotificationsEnabled),
    backgroundPushEnabled: Boolean(n.backgroundPushEnabled),
    dailySummaryHour: hour,
    lastDailySummaryDate:
      typeof n.lastDailySummaryDate === "string"
        ? n.lastDailySummaryDate
        : def.lastDailySummaryDate,
    reminderKeysFiredToday: Array.isArray(n.reminderKeysFiredToday)
      ? n.reminderKeysFiredToday.filter(
          (x): x is string => typeof x === "string" && x.length > 0
        )
      : def.reminderKeysFiredToday,
    reminderSnoozeUntil:
      n.reminderSnoozeUntil && typeof n.reminderSnoozeUntil === "object"
        ? snooze
        : def.reminderSnoozeUntil,
  };
}

/** תיקון שמירה ישנה / חלקית — מונע קריסת React כשחסרים שדות */
function repairPersisted(s: MomManagerPersisted): MomManagerPersisted {
  const def = defaultPersistedState();
  const out = { ...s };

  if (!out.notificationPrefs || typeof out.notificationPrefs !== "object") {
    out.notificationPrefs = { ...def.notificationPrefs };
  } else {
    const np = out.notificationPrefs;
    const hour =
      typeof np.dailySummaryHour === "number" &&
      np.dailySummaryHour >= 0 &&
      np.dailySummaryHour <= 23
        ? np.dailySummaryHour
        : def.notificationPrefs.dailySummaryHour;
    out.notificationPrefs = {
      ...def.notificationPrefs,
      ...np,
      browserNotificationsEnabled: Boolean(np.browserNotificationsEnabled),
      backgroundPushEnabled: Boolean(np.backgroundPushEnabled),
      dailySummaryHour: hour,
      lastDailySummaryDate:
        typeof np.lastDailySummaryDate === "string"
          ? np.lastDailySummaryDate
          : def.notificationPrefs.lastDailySummaryDate,
      reminderKeysFiredToday: Array.isArray(np.reminderKeysFiredToday)
        ? np.reminderKeysFiredToday.filter(
            (x): x is string => typeof x === "string" && x.length > 0
          )
        : [],
      reminderSnoozeUntil:
        np.reminderSnoozeUntil && typeof np.reminderSnoozeUntil === "object"
          ? Object.fromEntries(
              Object.entries(np.reminderSnoozeUntil).filter(
                ([, v]) => typeof v === "number" && v > 0
              )
            )
          : {},
    };
  }

  if (!out.kidsTracking || typeof out.kidsTracking !== "object") {
    out.kidsTracking = { ...def.kidsTracking };
  }

  if (!out.babyCare || typeof out.babyCare !== "object") {
    out.babyCare = { ...def.babyCare };
  }

  if (!out.health || typeof out.health !== "object") {
    out.health = { ...def.health };
  }

  return out;
}

function defaultNormalizedState(): MomManagerPersisted {
  return repairPersisted(
    normalizeKidsMealsWeek(
      normalizeBabyCareForToday(
        normalizeHealthForToday(normalizeForToday(defaultPersistedState()))
      )
    )
  );
}

function buildMergedFromParsed(
  parsed: ParsedWithLegacyStudio
): MomManagerPersisted {
  return {
    ...defaultPersistedState(),
    checklistDay: parsed.checklistDay ?? "",
    checklist: { ...defaultPersistedState().checklist, ...parsed.checklist },
    selections: {
      ...defaultPersistedState().selections,
      ...parsed.selections,
    },
    studioSessions: mergeStudio(parsed),
    studioMorningDismissedDate:
      parsed.studioMorningDismissedDate === null
        ? null
        : typeof parsed.studioMorningDismissedDate === "string"
          ? parsed.studioMorningDismissedDate
          : defaultPersistedState().studioMorningDismissedDate,
    shopping: mergeShopping(parsed),
    health: mergeHealth(parsed),
    babyCare: mergeBabyCare(parsed),
    kidsMeals: mergeKidsMeals(parsed),
    kidsTracking: mergeKidsTracking(parsed),
    notificationPrefs: mergeNotificationPrefs(parsed),
  };
}

function studioMigratedFromParsed(parsed: ParsedWithLegacyStudio): boolean {
  return (
    Array.isArray(parsed.studioSessionDates) &&
    parsed.studioSessionDates.length > 0 &&
    !Array.isArray(parsed.studioSessions)
  );
}

export function savePersistedStateForUser(
  userId: string,
  state: MomManagerPersisted
): void {
  if (typeof window === "undefined") return;
  try {
    const fixed = repairPersisted(state);
    window.localStorage.setItem(
      storageKeyForUser(userId),
      JSON.stringify(fixed)
    );
  } catch {
    /* quota / private mode */
  }
}

function finalizeAfterMerge(
  merged: MomManagerPersisted,
  userId: string,
  studioMigrated: boolean
): MomManagerPersisted {
  const prevChecklistDay = merged.checklistDay;
  const afterChecklist = normalizeForToday(merged);
  const prevHealthDay = afterChecklist.health.healthDay;
  const afterHealth = normalizeHealthForToday(afterChecklist);
  const prevBabyCareDay = afterHealth.babyCare.babyCareDay;
  const afterBaby = normalizeBabyCareForToday(afterHealth);
  const kmBefore = afterBaby.kidsMeals;
  const normalized = normalizeKidsMealsWeek(afterBaby);
  const kidsMealsChanged =
    JSON.stringify(kmBefore) !== JSON.stringify(normalized.kidsMeals);

  const shouldSave =
    prevChecklistDay !== normalized.checklistDay ||
    prevHealthDay !== normalized.health.healthDay ||
    prevBabyCareDay !== normalized.babyCare.babyCareDay ||
    kidsMealsChanged;
  if (shouldSave || studioMigrated) {
    savePersistedStateForUser(userId, normalized);
  }
  return repairPersisted(normalized);
}

/** טעינה מקומית לפי משתמשת + נורמליזציה */
export function loadPersistedStateForUser(
  userId: string
): MomManagerPersisted {
  if (typeof window === "undefined") return defaultPersistedState();
  try {
    const raw = window.localStorage.getItem(storageKeyForUser(userId));
    if (!raw) {
      return defaultNormalizedState();
    }
    const parsed = JSON.parse(raw) as ParsedWithLegacyStudio;
    const migrated = studioMigratedFromParsed(parsed);
    const merged = buildMergedFromParsed(parsed);
    return finalizeAfterMerge(merged, userId, migrated);
  } catch {
    return defaultNormalizedState();
  }
}

export function hydratePersistedFromRemoteBlob(
  remoteState: unknown,
  userId: string
): MomManagerPersisted {
  const parsed = (
    remoteState && typeof remoteState === "object" ? remoteState : {}
  ) as ParsedWithLegacyStudio;
  const merged = buildMergedFromParsed(parsed);
  return finalizeAfterMerge(
    merged,
    userId,
    studioMigratedFromParsed(parsed)
  );
}

/**
 * ייבוא חד־פעמי מ־localStorage הישן (לפני חשבון). מוחק את המפתח הישן אם הצליח.
 */
export function tryConsumeLegacyImport(
  userId: string
): MomManagerPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ParsedWithLegacyStudio;
    const merged = buildMergedFromParsed(parsed);
    const out = finalizeAfterMerge(
      merged,
      userId,
      studioMigratedFromParsed(parsed)
    );
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return out;
  } catch {
    return null;
  }
}
