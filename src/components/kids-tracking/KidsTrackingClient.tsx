"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Home,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import { addDaysToIsoDate, todayLocalISODate } from "@/lib/dates";
import {
  buildAllKidsWeekExportText,
  buildKidsWeekExportText,
  currentWeekStartSunday,
  formatTagDisplay,
  weekDaysFromSunday,
} from "@/lib/kids-tracking-export";
import {
  defaultKidsTrackingTags,
  type KidsTrackTagDef,
  type KidsTrackTagKind,
  type TrackedChild,
} from "@/types/mom-manager";

const EMPTY_CHILDREN: TrackedChild[] = [];
const EMPTY_TAGS: KidsTrackTagDef[] = [];

function newEntityId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function KidsTrackingClient() {
  const { state, ready, applyPersisted } = useMomManager();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [trackDate, setTrackDate] = useState(() => todayLocalISODate());
  const [newChildName, setNewChildName] = useState("");
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagKind, setNewTagKind] = useState<KidsTrackTagKind>("text");
  const [manageOpen, setManageOpen] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const children = state?.kidsTracking.children ?? EMPTY_CHILDREN;
  const tags = state?.kidsTracking.tags ?? EMPTY_TAGS;

  useEffect(() => {
    if (!children.length) {
      setSelectedChildId(null);
      return;
    }
    const exists = selectedChildId && children.some((c) => c.id === selectedChildId);
    if (!exists) setSelectedChildId(children[0].id);
  }, [children, selectedChildId]);

  useEffect(() => {
    if (!copyHint) return;
    const t = window.setTimeout(() => setCopyHint(null), 2600);
    return () => window.clearTimeout(t);
  }, [copyHint]);

  const selected = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const setTextValue = useCallback(
    (childId: string, date: string, tagId: string, text: string) => {
      applyPersisted((p) => {
        const kt = p.kidsTracking;
        const prevDay = kt.values[childId]?.[date] ?? {};
        const prevVal = prevDay[tagId] ?? {};
        return {
          ...p,
          kidsTracking: {
            ...kt,
            values: {
              ...kt.values,
              [childId]: {
                ...kt.values[childId],
                [date]: {
                  ...prevDay,
                  [tagId]: { ...prevVal, text },
                },
              },
            },
          },
        };
      });
    },
    [applyPersisted]
  );

  const setCheckedValue = useCallback(
    (childId: string, date: string, tagId: string, checked: boolean) => {
      applyPersisted((p) => {
        const kt = p.kidsTracking;
        const prevDay = kt.values[childId]?.[date] ?? {};
        const prevVal = prevDay[tagId] ?? {};
        return {
          ...p,
          kidsTracking: {
            ...kt,
            values: {
              ...kt.values,
              [childId]: {
                ...kt.values[childId],
                [date]: {
                  ...prevDay,
                  [tagId]: { ...prevVal, checked },
                },
              },
            },
          },
        };
      });
    },
    [applyPersisted]
  );

  const addChild = () => {
    const name = newChildName.trim();
    if (!name) return;
    const id = newEntityId();
    applyPersisted((p) => ({
      ...p,
      kidsTracking: {
        ...p.kidsTracking,
        children: [...p.kidsTracking.children, { id, name }],
        values: { ...p.kidsTracking.values, [id]: p.kidsTracking.values[id] ?? {} },
      },
    }));
    setNewChildName("");
    setSelectedChildId(id);
  };

  const removeChild = (id: string) => {
    if (!window.confirm("להסיר את הילד מהמעקב? הנתונים השמורים עבורו יימחקו.")) {
      return;
    }
    applyPersisted((p) => ({
      ...p,
      kidsTracking: {
        ...p.kidsTracking,
        children: p.kidsTracking.children.filter((c) => c.id !== id),
        values: Object.fromEntries(
          Object.entries(p.kidsTracking.values).filter(([k]) => k !== id)
        ),
      },
    }));
  };

  const addTag = () => {
    const label = newTagLabel.trim();
    if (!label) return;
    const id = newEntityId();
    applyPersisted((p) => ({
      ...p,
      kidsTracking: {
        ...p.kidsTracking,
        tags: [...p.kidsTracking.tags, { id, label, kind: newTagKind }],
      },
    }));
    setNewTagLabel("");
    setNewTagKind("text");
  };

  const removeTag = (tagId: string) => {
    if (!window.confirm("להסיר את התגית? הערכים השמורים בתגית זו יימחקו.")) {
      return;
    }
    applyPersisted((p) => {
      const kt = p.kidsTracking;
      const nextTags = kt.tags.filter((t) => t.id !== tagId);
      const nextValues: typeof kt.values = {};
      for (const [cid, byDate] of Object.entries(kt.values)) {
        nextValues[cid] = {};
        for (const [d, byTag] of Object.entries(byDate)) {
          nextValues[cid][d] = Object.fromEntries(
            Object.entries(byTag).filter(([k]) => k !== tagId)
          );
        }
      }
      return {
        ...p,
        kidsTracking: { ...kt, tags: nextTags, values: nextValues },
      };
    });
  };

  const restoreDefaultTags = () => {
    applyPersisted((p) => ({
      ...p,
      kidsTracking: {
        ...p.kidsTracking,
        tags: defaultKidsTrackingTags(),
      },
    }));
  };

  const todayIso = todayLocalISODate();
  const weekStartSunday = currentWeekStartSunday();
  const weekDays = weekDaysFromSunday(weekStartSunday);

  const copySelectedChildWeek = useCallback(async () => {
    if (!selected || !state || tags.length === 0) return;
    const text = buildKidsWeekExportText({
      weekStartSunday,
      childName: selected.name,
      tags,
      byDate: state.kidsTracking.values[selected.id] ?? {},
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint("סיכום השבוע ל־" + selected.name + " הועתק ללוח");
    } catch {
      setCopyHint("העתקה נכשלה — אפשר לסמן ידנית מהסיכום למטה");
    }
  }, [selected, state, tags, weekStartSunday]);

  const copyAllChildrenWeek = useCallback(async () => {
    if (!state || children.length === 0 || tags.length === 0) return;
    const text = buildAllKidsWeekExportText({
      weekStartSunday,
      children,
      tags,
      values: state.kidsTracking.values,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(
        children.length === 1
          ? "הסיכום הועתק ללוח"
          : "סיכומי כל הילדים לשבוע הועתקו ללוח"
      );
    } catch {
      setCopyHint("העתקה נכשלה — נסי שוב או העתיקי מהטקסט למטה");
    }
  }, [state, children, tags, weekStartSunday]);

  if (!ready || !state) {
    return (
      <div className="mx-auto max-w-lg pb-28 pt-6">
        <div className="h-64 animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  const valuesForDay =
    selected && trackDate
      ? (state.kidsTracking.values[selected.id]?.[trackDate] ?? {})
      : {};

  return (
    <div className="mx-auto max-w-lg pb-28 pt-4">
      <header className="mb-5 space-y-2 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-700/80">
          מעקב
        </p>
        <h1 className="font-display flex items-center justify-end gap-2 text-2xl font-bold text-slate-900">
          <Users className="h-7 w-7 shrink-0 text-sage-700" aria-hidden />
          מעקב ילדים
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          בחרי ילד, יום ותגיות — טקסט או סימון. אפשר להוסיף או להסיר תגיות
          בכל עת.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sage-700 hover:text-sage-900"
        >
          <Home className="h-4 w-4" aria-hidden />
          חזרה לבית
        </Link>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 space-y-4 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
      >
        <h2 className="flex items-center justify-end gap-2 text-sm font-semibold text-slate-900">
          <UserRound className="h-4 w-4 text-sage-600" aria-hidden />
          ילדים
        </h2>

        {children.length === 0 ? (
          <div className="space-y-3 text-right">
            <p className="text-sm text-slate-600">עדיין אין ילדים ברשימה.</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="שם הילד"
                className="min-w-[10rem] flex-1 rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
                onKeyDown={(e) => e.key === "Enter" && addChild()}
              />
              <button
                type="button"
                onClick={addChild}
                className="inline-flex items-center gap-1 rounded-xl bg-sage-700 px-3 py-2 text-sm font-semibold text-white shadow-md hover:bg-sage-800"
              >
                <Plus className="h-4 w-4" aria-hidden />
                הוסף
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-end gap-2">
              {children.map((c) => {
                const active = c.id === selectedChildId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChildId(c.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-sage-700 text-white shadow-md"
                        : "bg-sage-100 text-sage-900 ring-1 ring-sage-200 hover:bg-sage-200/50"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-sage-100 pt-3">
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="הוספת ילד נוסף"
                className="min-w-[8rem] flex-1 rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-400"
                onKeyDown={(e) => e.key === "Enter" && addChild()}
              />
              <button
                type="button"
                onClick={addChild}
                className="inline-flex items-center gap-1 rounded-xl border border-sage-300 bg-white px-3 py-2 text-sm font-semibold text-sage-800 hover:bg-sage-50"
              >
                <Plus className="h-4 w-4" />
                הוסף
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={() => removeChild(selected.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  הסר ילד
                </button>
              )}
            </div>
          </>
        )}
      </motion.section>

      {children.length > 0 && selected && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 space-y-4 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
        >
          <div className="flex flex-col items-stretch gap-2 border-b border-sage-100 pb-3 text-right sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center justify-end gap-2 text-sm font-medium text-slate-700">
              <CalendarDays className="h-4 w-4 text-sage-600" aria-hidden />
              תאריך
              <input
                type="date"
                value={trackDate}
                onChange={(e) => setTrackDate(e.target.value)}
                className="rounded-lg border border-sage-200 bg-white px-2 py-1.5 text-sm text-slate-900"
              />
            </label>
            <p className="text-xs text-slate-500">
              מעקב עבור: <span className="font-semibold text-sage-800">{selected.name}</span>
            </p>
          </div>

          {tags.length === 0 ? (
            <div className="space-y-2 text-right text-sm text-slate-600">
              <p>אין תגיות. הוסיפי תגית למטה או שחזרי ברירת מחדל.</p>
              <button
                type="button"
                onClick={restoreDefaultTags}
                className="rounded-xl bg-sage-100 px-3 py-2 text-sm font-semibold text-sage-900 ring-1 ring-sage-200 hover:bg-sage-200/50"
              >
                שחזר תגיות ברירת מחדל
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-right">
              {tags.map((tag) => (
                <TagFieldRow
                  key={tag.id}
                  tag={tag}
                  value={valuesForDay[tag.id]}
                  onText={(v) => setTextValue(selected.id, trackDate, tag.id, v)}
                  onChecked={(v) =>
                    setCheckedValue(selected.id, trackDate, tag.id, v)
                  }
                />
              ))}
            </div>
          )}
        </motion.section>
      )}

      {children.length > 0 && tags.length > 0 && selected && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mb-4 space-y-3 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5"
        >
          <div className="space-y-2 border-b border-sage-100 pb-3 text-right">
            <h2 className="text-sm font-semibold text-slate-900">
              סיכום שבועי — {selected.name}
            </h2>
            <p className="text-xs text-slate-500">
              שבוע נוכחי (א׳–ש׳):{" "}
              {new Date(weekStartSunday + "T12:00:00").toLocaleDateString(
                "he-IL",
                { day: "numeric", month: "short" }
              )}{" "}
              –{" "}
              {new Date(
                addDaysToIsoDate(weekStartSunday, 6) + "T12:00:00"
              ).toLocaleDateString("he-IL", {
                day: "numeric",
                month: "short",
              })}
            </p>
            {copyHint && (
              <p
                role="status"
                className="rounded-lg bg-sage-100 px-3 py-2 text-sm font-medium text-sage-900 ring-1 ring-sage-200/80"
              >
                {copyHint}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void copySelectedChildWeek()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sage-700 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sage-800 sm:text-sm"
              >
                <Copy className="h-4 w-4 shrink-0" aria-hidden />
                העתק סיכום {selected.name}
              </button>
              {children.length > 1 && (
                <button
                  type="button"
                  onClick={() => void copyAllChildrenWeek()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sage-300 bg-white px-3 py-2 text-xs font-semibold text-sage-900 hover:bg-sage-50 sm:text-sm"
                >
                  <Copy className="h-4 w-4 shrink-0" aria-hidden />
                  העתק את כל הילדים
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {weekDays.map(({ iso, label }) => {
              const byDay = state.kidsTracking.values[selected.id]?.[iso] ?? {};
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={`rounded-xl border px-3 py-2.5 text-right ${
                    isToday
                      ? "border-sage-400 bg-sage-50/90 ring-1 ring-sage-200/70"
                      : "border-sage-100 bg-white"
                  }`}
                >
                  <p className="mb-1.5 flex flex-wrap items-baseline justify-end gap-2 border-b border-sage-100/80 pb-1.5 text-xs text-slate-600">
                    <span className="font-bold text-sage-900">יום {label}</span>
                    <span className="tabular-nums">
                      {new Date(iso + "T12:00:00").toLocaleDateString("he-IL", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-sage-200/80 px-2 py-0.5 text-[10px] font-semibold text-sage-900">
                        היום
                      </span>
                    ) : null}
                  </p>
                  <ul className="space-y-1">
                    {tags.map((tag) => (
                      <li
                        key={tag.id}
                        className="flex justify-between gap-2 text-sm leading-snug"
                      >
                        <span className="shrink-0 font-medium text-slate-700">
                          {tag.label}
                        </span>
                        <span className="min-w-0 text-left text-slate-600 break-words">
                          {formatTagDisplay(tag, byDay[tag.id])}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-dashed border-sage-200 bg-sage-50/40 p-4 text-right ring-1 ring-sage-100"
      >
        <button
          type="button"
          onClick={() => setManageOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-sage-900"
        >
          <span>ניהול תגיות</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${manageOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {manageOpen && (
          <div className="mt-4 space-y-4 border-t border-sage-200/80 pt-4">
            <ul className="space-y-2">
              {tags.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 ring-1 ring-sage-100"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {t.label}
                    <span className="me-2 text-xs font-normal text-slate-500">
                      ({t.kind === "text" ? "טקסט" : "סימון"})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTag(t.id)}
                    className="inline-flex items-center gap-1 rounded-lg p-1.5 text-rose-700 hover:bg-rose-50"
                    aria-label={`הסר ${t.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            {tags.length === 0 && (
              <button
                type="button"
                onClick={restoreDefaultTags}
                className="w-full rounded-xl bg-sage-700 py-2 text-sm font-semibold text-white hover:bg-sage-800"
              >
                שחזר תגיות ברירת מחדל
              </button>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
              <input
                type="text"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                placeholder="שם התגית (למשל: חוג כדורגל)"
                className="flex-1 rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-400"
              />
              <select
                value={newTagKind}
                onChange={(e) =>
                  setNewTagKind(e.target.value as KidsTrackTagKind)
                }
                className="rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="text">שדה טקסט</option>
                <option value="checkbox">סימון (כן/לא)</option>
              </select>
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-sage-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sage-700"
              >
                <Plus className="h-4 w-4" />
                הוסף תגית
              </button>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}

function TagFieldRow({
  tag,
  value,
  onText,
  onChecked,
}: {
  tag: KidsTrackTagDef;
  value?: { text?: string; checked?: boolean };
  onText: (v: string) => void;
  onChecked: (v: boolean) => void;
}) {
  if (tag.kind === "checkbox") {
    const id = `kt-${tag.id}`;
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-sage-100 bg-sage-50/50 px-3 py-2">
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-800 cursor-pointer"
        >
          {tag.label}
        </label>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value?.checked)}
          onChange={(e) => onChecked(e.target.checked)}
          className="h-5 w-5 rounded border-sage-300 text-sage-700 focus:ring-sage-400"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {tag.label}
      </label>
      <textarea
        rows={2}
        value={value?.text ?? ""}
        onChange={(e) => onText(e.target.value)}
        placeholder="מה להזין..."
        className="w-full resize-y rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
      />
    </div>
  );
}
