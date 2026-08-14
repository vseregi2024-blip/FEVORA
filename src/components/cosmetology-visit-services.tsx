"use client";

import Link from "next/link";

import { formatMoney } from "@/lib/money";

import styles from "./cosmetology-visit-services.module.css";

type Template = { id: string; name: string; basePrice: string | null; durationMinutes: number | null; materials: string[] };
type Service = { id: string; templateId: string | null; name: string; price: string; durationMinutes: number | null; materials: string[] };
type Props = {
  visitId: string;
  services: Service[];
  templates: Template[];
  addAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
};

function duration(value: number | null) { return value ? `${value} мин` : "длительность не указана"; }

export function CosmetologyVisitServices({ visitId, services, templates, addAction, updateAction, removeAction }: Props) {
  const total = services.reduce((sum, service) => sum + Number(service.price), 0);
  return <section className={styles.services}><div className={styles.header}><div><p className="eyebrow">Услуги записи</p><h2>Что будет выполнено</h2></div><strong>{formatMoney(total.toFixed(2))}</strong></div><p className="muted">Цену, длительность и техкарту можно изменить до закрытия процедуры.</p><div className={styles.list}>{services.map((service, index) => <article className={styles.card} key={service.id}><div className={styles.cardHeader}><div><b>{index + 1}. {service.name}</b><span>{formatMoney(service.price)} · {duration(service.durationMinutes)}</span></div>{services.length > 1 && <form action={removeAction}><input type="hidden" name="visitId" value={visitId}/><input type="hidden" name="serviceId" value={service.id}/><button className="text-button" aria-label={`Убрать ${service.name}`}>Убрать</button></form>}</div>{service.materials.length > 0 && <p className={styles.materials}>Техкарта: {service.materials.join(", ")}</p>}<details><summary>Изменить услугу</summary><form action={updateAction} className="compact-form"><input type="hidden" name="visitId" value={visitId}/><input type="hidden" name="serviceId" value={service.id}/><label>Услуга / техкарта<select name="templateId" defaultValue={service.templateId ?? ""}><option value="">Ввести вручную</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${template.basePrice} грн` : ""}</option>)}</select></label><div className="form-grid"><label>Название<input name="name" defaultValue={service.name}/></label><label>Цена<input name="price" inputMode="decimal" defaultValue={service.price}/></label></div><label>Длительность, минут<select name="durationMinutes" defaultValue={service.durationMinutes?.toString() ?? ""}><option value="">Не указывать</option>{[15, 30, 45, 60, 75, 90, 120, 150, 180].map((minutes) => <option key={minutes} value={minutes}>{minutes} мин</option>)}</select></label><button className="button secondary">Сохранить услугу</button></form></details></article>)}</div><details className={styles.add}><summary>＋ Добавить ещё услугу</summary><form action={addAction} className="compact-form"><input type="hidden" name="visitId" value={visitId}/><label>Услуга / техкарта<select name="templateId" defaultValue=""><option value="">Ввести вручную</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${template.basePrice} грн` : ""}</option>)}</select></label><div className="form-grid"><label>Название вручную<input name="name" placeholder="Например, чистка"/></label><label>Цена<input name="price" inputMode="decimal" placeholder="Из прайса"/></label></div><label>Длительность, минут<select name="durationMinutes" defaultValue=""><option value="">Из услуги</option>{[15, 30, 45, 60, 75, 90, 120, 150, 180].map((minutes) => <option key={minutes} value={minutes}>{minutes} мин</option>)}</select></label><button className="button primary">Добавить услугу</button></form></details><Link href="/cosmetology/procedures" className="text-link">Настроить услуги и техкарты →</Link></section>;
}
