"use client";

import { useEffect, useState } from "react";
import {
  KIDS_MEAL_SELECT_OTHER,
  KIDS_UNIFIED_MEAL_OPTIONS,
  isKidsMealPresetLabel,
} from "@/lib/kids-meal-options";

type Props = {
  label: string;
  fieldId?: string;
  value: string;
  onChange: (v: string) => void;
  /** משבצת טקסט גבוהה יותר (כרטיס בית) */
  relaxed?: boolean;
};

export function KidsMealSelectField({
  label,
  fieldId,
  value,
  onChange,
  relaxed,
}: Props) {
  const [forceOther, setForceOther] = useState(false);

  const isPreset = value !== "" && isKidsMealPresetLabel(value);
  const selectValue =
    value === "" && !forceOther
      ? ""
      : isPreset
        ? value
        : KIDS_MEAL_SELECT_OTHER;

  useEffect(() => {
    if (value !== "" && isKidsMealPresetLabel(value)) {
      setForceOther(false);
    }
  }, [value]);

  const baseSelect =
    "w-full rounded-lg border border-sage-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-300/50";
  const baseInput =
    "mt-1.5 w-full rounded-lg border border-sage-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-sage-400 focus:ring-1 focus:ring-sage-300/50";

  return (
    <div className="text-right">
      <label
        htmlFor={fieldId}
        className={`mb-0.5 block font-medium text-slate-600 ${
          relaxed ? "text-xs" : "text-[11px]"
        }`}
      >
        {label}
      </label>
      <select
        id={fieldId}
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            setForceOther(false);
            onChange("");
            return;
          }
          if (v === KIDS_MEAL_SELECT_OTHER) {
            setForceOther(true);
            if (isPreset) onChange("");
            return;
          }
          setForceOther(false);
          onChange(v);
        }}
        className={relaxed ? `${baseSelect} rounded-xl py-2.5` : baseSelect}
      >
        <option value="">— לא נבחר —</option>
        {KIDS_UNIFIED_MEAL_OPTIONS.map((o) => (
          <option key={o.id} value={o.label}>
            {o.label}
          </option>
        ))}
        <option value={KIDS_MEAL_SELECT_OTHER}>אחר… (הקלידי למטה)</option>
      </select>
      {selectValue === KIDS_MEAL_SELECT_OTHER && (
        <input
          type="text"
          value={isPreset ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="פירוט ארוחה"
          dir="rtl"
          className={relaxed ? `${baseInput} rounded-xl px-3 py-2` : baseInput}
        />
      )}
    </div>
  );
}
