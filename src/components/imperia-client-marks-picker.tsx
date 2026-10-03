"use client";

import { useState } from "react";

type ImperiaClientMarksPickerProps = {
  marks: readonly string[];
  selectedMarks: readonly string[];
};

export function ImperiaClientMarksPicker({ marks, selectedMarks }: ImperiaClientMarksPickerProps) {
  const [selected, setSelected] = useState(() => new Set(selectedMarks));
  const selectedLabels = marks.filter((mark) => selected.has(mark));
  const summary = selectedLabels.length ? selectedLabels.join(", ") : "Не выбраны";

  const [open, setOpen] = useState(false);
  const toggle = (mark: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(mark)) next.delete(mark); else next.add(mark);
    return next;
  });

  return <details className="imperia-client-marks-picker">
    {[...selected].map((mark) => <input key={mark} type="hidden" name="specialMarks" value={mark}/>) }
    <summary className="imperia-choice-trigger" onClick={(event) => { event.preventDefault(); setOpen(true); }} aria-haspopup="dialog" aria-expanded={open}><span>Особые отметки</span><b>{summary}</b><i aria-hidden="true">›</i></summary>
    {open && <div className="imperia-choice-backdrop" onMouseDown={() => setOpen(false)}><section className="imperia-choice-dialog imperia-marks-dialog" role="dialog" aria-modal="true" aria-label="Особые отметки" onMouseDown={(event) => event.stopPropagation()}><div className="imperia-choice-handle"/><header><span>Особые отметки</span><button type="button" aria-label="Закрыть" onClick={() => setOpen(false)}>×</button></header><p>Выберите подходящие метки клиента.</p><div className="imperia-choice-options">{marks.map((mark) => <button type="button" key={mark} className={selected.has(mark) ? "selected" : ""} onClick={() => toggle(mark)}><span>{mark}</span>{selected.has(mark) && <b>✓</b>}</button>)}</div><button type="button" className="button primary wide" onClick={() => setOpen(false)}>Готово</button></section></div>}
  </details>;
}
