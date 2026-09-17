import Link from "next/link";

import { ImperiaDateField } from "@/components/imperia-date-field";
import { createSavingsGoalAction } from "../../actions";

export default function NewSavingsGoalPage() { return <><header className="page-header"><div><p className="eyebrow">IMPERIA · Накопления</p><h1>Новая цель</h1><p className="muted">Начальную сумму можно указать сразу.</p></div><Link href="/family/savings" className="text-link">Закрыть</Link></header><form action={createSavingsGoalAction} className="transaction-form imperia-form"><label>Название<input name="name" required autoFocus placeholder="Например: резерв"/></label><label>Целевая сумма<input name="targetAmount" inputMode="decimal" placeholder="Необязательно"/></label><label>Уже накоплено<input name="initialAmount" inputMode="decimal" placeholder="0,00"/></label><ImperiaDateField name="targetDate" label="Срок цели" optional/><label>Комментарий<input name="note" maxLength={500} placeholder="Необязательно"/></label><button className="button primary wide">Создать цель</button></form></>; }
