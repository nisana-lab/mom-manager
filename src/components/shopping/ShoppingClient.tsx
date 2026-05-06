"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  LayoutList,
  MessageCircle,
  Plus,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

export function ShoppingClient() {
  const { state, ready, applyPersisted } = useMomManager();
  const [tab, setTab] = useState<TabId>("food");
  const [draft, setDraft] = useState("");

  const lists = state?.shopping ?? EMPTY_SHOPPING;

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
          שני רשימות נפרדות — נשמרות במכשיר. שתפי לבעל דרך וואטסאפ.
        </p>
      </header>

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
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-900/20 transition hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          שיתוף לוואטסאפ
        </button>
        <span className="text-xs text-slate-500">
          נשלחות שתי הרשימות (מזון + כללי)
        </span>
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
