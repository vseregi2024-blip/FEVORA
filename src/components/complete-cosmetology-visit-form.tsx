"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./complete-cosmetology-visit-form.module.css";

type Template = {
  id: string;
  name: string;
  basePrice: string | null;
  materialsCount: number;
};

type Item = {
  id: string;
  name: string;
  quantity: string;
};

type Props = {
  visit: { id: string; procedureName: string; procedureTemplateId: string | null; plannedAmount: string | null; comment: string | null };
  templates: Template[];
  items: Item[];
  today: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function CompleteCosmetologyVisitForm({ visit, templates, items, today, action }: Props) {
  const [rows, setRows] = useState(() => [{ key: "initial", value: visit.procedureTemplateId ?? "" }]);

  return <form action={action} className="compact-form"><input type="hidden" name="id" value={visit.id}/><fieldset className={styles.services}><legend>Фактически выполненные услуги</legend><p>Выберите техкарту для каждой процедуры. Расходники всех выбранных техкарт спишутся вместе.</p>{rows.map((row, index) => <div className={styles.serviceRow} key={row.key}><label>Услуга {index + 1}<select name="procedureTemplateIds" defaultValue={row.value}><option value="">Без техкарты</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${template.basePrice} грн` : ""}</option>)}</select></label>{rows.length > 1 && <button type="button" className="text-button" onClick={() => setRows(rows.filter((item) => item.key !== row.key))}>Убрать</button>}</div>)}<button type="button" className="button secondary" onClick={() => setRows([...rows, { key: `service-${Date.now()}`, value: "" }])}>＋ Добавить услугу</button><Link href="/cosmetology/procedures" className="text-link">Настроить техкарты</Link></fieldset><label>Название вручную <small>Нужно только если услуги нет в списке.</small><input name="procedureName" defaultValue={visit.procedureName}/></label><label>Итоговая цена за все услуги<input name="paymentAmount" required inputMode="decimal" defaultValue={visit.plannedAmount ?? ""} placeholder="1400"/></label><fieldset><legend>Получено сейчас</legend><div className="form-grid"><label>Наличные<input name="cashAmount" inputMode="decimal" defaultValue="0"/></label><label>Monobank<input name="monoAmount" inputMode="decimal" defaultValue="0"/></label><label>ПриватБанк<input name="privatAmount" inputMode="decimal" defaultValue="0"/></label></div></fieldset><div className="form-grid"><label>Дополнительный материал<select name="itemId" defaultValue=""><option value="">Не использовать</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · остаток {item.quantity}</option>)}</select></label><label>Количество<input name="usageQuantity" inputMode="decimal" placeholder="Например, 2"/></label></div><label>Дата выполнения<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment" defaultValue={visit.comment ?? ""}/></label><button className="button primary">Закрыть процедуру</button></form>;
}
