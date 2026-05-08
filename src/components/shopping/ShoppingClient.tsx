"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  LayoutList,
  MessageCircle,
  Plus,
  Save,
  Send,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import type { ShoppingItem, ShoppingLists } from "@/types/mom-manager";

type TabId = "food" | "general";

const EMPTY_SHOPPING: ShoppingLists = { food: [], general: [] };

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatShareMessage(lists: ShoppingLists) {
  const lines: string[] = ["היי אהובים — רשימת קניות מ־MOM-MANAGER 🌷", ""];

  const section = (title: string, items: ShoppingItem[]) => {
    lines.push(`*${title}*`);
    if (items.length === 0) {
      lines.push("(ריק)");
      lines.push("");
      return;
    }
    for (const it of items) {
      const mark = it.done ? "✅" : "▫️";
      lines.push(`${mark} ${it.text}`);
    }
    lines.push("");
  };

  section("מזון", lists.food);
  section("כללי", lists.general);
  lines.push("— נשלח מהאפליקציה");
  return lines.join("\n").trim();
}

function normalizePhoneForWhatsApp(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, "").trim();
  const noPlus = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  return noPlus.replace(/[^\d]/g, "");
}

export function ShoppingClient() {
  const { state, ready, applyPersisted } = useMomManager();
  const [tab, setTab] = useState<TabId>("food");
  const [draft, setDraft] = useState("");
  const [phoneDrafts, setPhoneDrafts] = useState<[string, string]>(["", ""]);

  const lists = state?.shopping ?? EMPTY_SHOPPING;
  const recipients = (state?.notificationPrefs.whatsappRecipients ?? []).slice(
    0,
    2
  );
  const recipient1 = recipients[0] ?? "";
  const recipient2 = recipients[1] ?? "";

  useEffect(() => {
    setPhoneDrafts([recipient1, recipient2]);
  }, [recipient1, recipient2]);

  const activeItems = tab === "food" ? lists.food : lists.general;

  const addItem = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const item: ShoppingItem = { id: newId(), text, done: false };
    applyPersisted((prev) => {
      const cur = prev.shopping[tab];
      return {
        ...prev,
        shopping: { ...prev.shopping, [tab]: [item, ...cur] },
      };
    });
    setDraft("");
  }, [draft, tab, applyPersisted]);

  const toggleItem = useCallback(
    (id: string) => {
      applyPersisted((prev) => {
        const cur = prev.shopping[tab];
        return {
          ...prev,
          shopping: {
            ...prev.shopping,
            [tab]: cur.map((i) =>
              i.id === id ? { ...i, done: !i.done } : i
            ),
          },
        };
      });
    },
    [applyPersisted, tab]
  );

  const removeItem = useCallback(
    (id: string) => {
      applyPersisted((prev) => {
        const cur = prev.shopping[tab];
        return {
          ...prev,
          shopping: {
            ...prev.shopping,
            [tab]: cur.filter((i) => i.id !== id),
          },
        };
      });
    },
    [applyPersisted, tab]
  );

  const shareWhatsApp = useCallback(() => {
    const text = formatShareMessage(lists);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [lists]);

  const sendToPhone = useCallback(
    (phone: string) => {
      const normalized = normalizePhoneForWhatsApp(phone);
      if (!normalized) return;
      const text = formatShareMessage(lists);
      const url = `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [lists]
  );

  const savePhone = useCallback(
    (index: 0 | 1) => {
      const normalized = normalizePhoneForWhatsApp(phoneDrafts[index]);
      applyPersisted((prev) => {
        const current = [...prev.notificationPrefs.whatsappRecipients].slice(0, 2);
        while (current.length < 2) current.push("");
        current[index] = normalized;
        return {
          ...prev,
          notificationPrefs: {
            ...prev.notificationPrefs,
            whatsappRecipients: current.filter((x) => x.trim().length > 0).slice(0, 2),
          },
        };
      });
      setPhoneDrafts((prev) => {
        const next: [string, string] = [...prev] as [string, string];
        next[index] = normalized;
        return next;
      });
    },
    [applyPersisted, phoneDrafts]
  );

  const sendToSaved = useCallback(
    (index: 0 | 1) => {
      const phone = recipients[index];
      if (!phone) return;
      sendToPhone(phone);
    },
    [recipients, sendToPhone]
  );

  const sendToAllSaved = useCallback(() => {
    recipients.forEach((phone) => {
      if (phone) sendToPhone(phone);
    });
  }, [recipients, sendToPhone]);

  const tabs = useMemo(
    () =>
      [
        { id: "food" as const, label: "מזון", icon: Apple },
        { id: "general" as const, label: "כללי", icon: LayoutList },
      ],
    []
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg pb-28 pt-6">
        <div className="h-48 animate-pulse rounded-2xl bg-white/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pb-28 pt-4">
      <header className="mb-5 space-y-2 px-1 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-700/80">
          קניות
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          רשימות קניות
        </h1>
        <p className="text-sm text-slate-600">
          שני רשימות נפרדות + שליחה מהירה לווטסאפ למספרים ששמרת מראש.
        </p>
      </header>

      <section className="mb-4 rounded-2xl border border-sage-200/80 bg-white/95 p-3.5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-2 text-right text-sm font-bold text-slate-900">
          מספרי WhatsApp קבועים
        </h2>
        <p className="mb-3 text-right text-xs text-slate-600">
          שמרי עד 2 מספרים בפורמט בינלאומי (למשל 9725XXXXXXXX). לאחר מכן אפשר לשלוח בלחיצה אחת.
        </p>
        {[0, 1].map((slot) => (
          <div key={slot} className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => savePhone(slot as 0 | 1)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <Save className="h-3.5 w-3.5" />
              שמירה
            </button>
            <button
              type="button"
              onClick={() => sendToSaved(slot as 0 | 1)}
              disabled={!recipients[slot]}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              שליחה
            </button>
            <input
              type="tel"
              dir="ltr"
              value={phoneDrafts[slot]}
              onChange={(e) =>
                setPhoneDrafts((prev) => {
                  const next: [string, string] = [...prev] as [string, string];
                  next[slot] = e.target.value;
                  return next;
                })
              }
              placeholder={slot === 0 ? "מספר ראשון" : "מספר שני"}
              className="min-w-0 flex-1 rounded-lg border border-sage-200 bg-white px-3 py-2 text-right text-sm text-slate-900 outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
            />
          </div>
        ))}
      </section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex gap-2 rounded-2xl bg-white/80 p-1.5 shadow-md ring-1 ring-black/5"
        role="tablist"
        aria-label="בחירת רשימה"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                active ? "text-sage-950" : "text-sage-600 hover:text-sage-800"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="shop-tab"
                  className="absolute inset-0 rounded-xl bg-sage-100 shadow-inner ring-1 ring-sage-200/80"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </span>
            </button>
          );
        })}
      </motion.div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={sendToAllSaved}
          disabled={recipients.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-900/20 transition hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          שליחה למספרים השמורים
        </button>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="text-xs text-slate-500 underline underline-offset-2"
        >
          פתיחה ידנית של ווטסאפ (בלי מספר קבוע)
        </button>
      </div>

      <section className="rounded-2xl bg-white/95 p-4 shadow-lg shadow-sage-900/5 ring-1 ring-black/5">
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={
              tab === "food" ? "פריט מזון חדש…" : "פריט כללי חדש…"
            }
            className="min-w-0 flex-1 rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-right text-sm text-slate-900 shadow-inner outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-300/40"
          />
          <button
            type="button"
            onClick={addItem}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sage-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            הוספה
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {activeItems.length === 0 ? (
              <li className="rounded-xl border border-dashed border-sage-200 bg-sage-50/50 py-10 text-center text-sm text-slate-500">
                <ShoppingBasket className="mx-auto mb-2 h-8 w-8 text-sage-400" />
                אין פריטים ברשימה. הוסיפי משהו למעלה.
              </li>
            ) : (
              activeItems.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-center gap-3 rounded-xl border border-sage-100 bg-sage-50/40 px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="h-5 w-5 shrink-0 rounded-md border-sage-300 text-sage-600 focus:ring-sage-400"
                  />
                  <span
                    className={`min-w-0 flex-1 text-right text-sm font-medium ${
                      item.done
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
                    aria-label="מחיקת פריט"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.li>
              ))
            )}
          </AnimatePresence>
        </ul>
      </section>
    </div>
  );
}
