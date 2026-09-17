"use client";

import { useState } from "react";

export function ClientAnamnesisFields({ allergies = "", contraindications = "", medicalNotes = "" }: { allergies?: string; contraindications?: string; medicalNotes?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="anamnesis-open-button" onClick={() => setOpen(true)}><span><b>Анамнез</b><small>Аллергии, противопоказания и важная информация</small></span><strong>Открыть →</strong></button>
    <div className={`anamnesis-backdrop${open ? " open" : ""}`} aria-hidden={!open} onMouseDown={() => setOpen(false)}><section className="anamnesis-dialog" role="dialog" aria-modal="true" aria-labelledby="anamnesis-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Карточка пациента</p><h2 id="anamnesis-title">Анамнез</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">×</button></header><p className="muted">Заполните со слов клиента. Позже сюда можно добавить ваш полный перечень вопросов.</p><label>Аллергии<textarea name="allergies" defaultValue={allergies} placeholder="Есть ли аллергические реакции и на что?"/></label><label>Противопоказания<textarea name="contraindications" defaultValue={contraindications} placeholder="Известные противопоказания"/></label><label>Важная информация о пациенте<textarea name="medicalNotes" defaultValue={medicalNotes} placeholder="Ответы клиента и медицинские заметки"/></label><button type="button" className="button primary wide" onClick={() => setOpen(false)}>Готово</button></section></div>
  </>;
}
