import {
  addDaysToIsoDate,
  startOfWeekSundayFromIso,
  todayLocalISODate,
} from "@/lib/dates";
import type {
  KidsTrackTagDef,
  KidsTrackTagValue,
  TrackedChild,
} from "@/types/mom-manager";

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const;

export function formatTagDisplay(
  tag: KidsTrackTagDef,
  val?: KidsTrackTagValue
): string {
  if (tag.kind === "checkbox") {
    return val?.checked ? "כן" : "לא";
  }
  const t = val?.text?.trim();
  return t && t.length > 0 ? t : "—";
}

export function weekDaysFromSunday(weekStartSunday: string): {
  iso: string;
  label: string;
}[] {
  const out: { iso: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    out.push({
      iso: addDaysToIsoDate(weekStartSunday, i),
      label: DAY_LABELS[i],
    });
  }
  return out;
}

export function buildKidsWeekExportText(opts: {
  weekStartSunday: string;
  childName: string;
  tags: KidsTrackTagDef[];
  byDate: Record<string, Record<string, KidsTrackTagValue>>;
}): string {
  const endSat = addDaysToIsoDate(opts.weekStartSunday, 6);
  const lines: string[] = [];
  lines.push(`מעקב ילדים — ${opts.childName}`);
  lines.push(
    `שבוע: ${opts.weekStartSunday} (א׳) עד ${endSat} (ש׳)`
  );
  lines.push("");

  for (const { iso, label } of weekDaysFromSunday(opts.weekStartSunday)) {
    const dayVals = opts.byDate[iso] ?? {};
    const dateHe = new Date(iso + "T12:00:00").toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    lines.push(`— יום ${label} · ${dateHe}`);
    for (const tag of opts.tags) {
      const cell = formatTagDisplay(tag, dayVals[tag.id]);
      lines.push(`  • ${tag.label}: ${cell}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildAllKidsWeekExportText(opts: {
  weekStartSunday: string;
  children: TrackedChild[];
  tags: KidsTrackTagDef[];
  values: Record<string, Record<string, Record<string, KidsTrackTagValue>>>;
}): string {
  const sep = "\n\n———————————————\n\n";
  return opts.children
    .map((c) =>
      buildKidsWeekExportText({
        weekStartSunday: opts.weekStartSunday,
        childName: c.name,
        tags: opts.tags,
        byDate: opts.values[c.id] ?? {},
      })
    )
    .join(sep);
}

/** עוגן שבוע נוכחי לפי היום המקומי */
export function currentWeekStartSunday(): string {
  return startOfWeekSundayFromIso(todayLocalISODate());
}
