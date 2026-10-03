"use client";

import { useState } from "react";

import { AppIcon } from "@/components/ui/icons";

type Choice = { value: string; label: string };

export function ImperiaChoicePicker({ name, label, options, defaultValue = "" }: { name: string; label: string; options: Choice[]; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];

  return <div className="imperia-choice-picker">
    <input type="hidden" name={name} value={value}/>
    <button type="button" className="imperia-choice-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}><span>{label}</span><b>{current?.label}</b><AppIcon name="arrow"/></button>
    {open && <div className="imperia-choice-backdrop" onMouseDown={() => setOpen(false)}><section className="imperia-choice-dialog" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.stopPropagation()}><div className="imperia-choice-handle"/><header><span>{label}</span><button type="button" aria-label="Закрыть" onClick={() => setOpen(false)}>×</button></header><div className="imperia-choice-options">{options.map((option) => <button type="button" key={option.value || "empty"} className={value === option.value ? "selected" : ""} onClick={() => { setValue(option.value); setOpen(false); }}><span>{option.label}</span>{value === option.value && <b>✓</b>}</button>)}</div></section></div>}
  </div>;
}
