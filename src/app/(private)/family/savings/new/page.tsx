import Link from "next/link";

import { createSavingsGoalAction } from "../../actions";

export default function NewSavingsGoalPage() { return <><header className="page-header"><div><p className="eyebrow">Накопления</p><h1>Новая цель</h1><p className="muted">Начальную сумму можно указать сразу.</p></div><Link href="/family/savings" className="text-link">Закрыть</Link></header><form action={createSavingsGoalAction} className="transaction-form"><label>Название<input name="name" required autoFocus placeholder="Например: резерв"/></label><label>Целевая сумма<input name="targetAmount" inputMode="decimal" placeholder="Необязательно"/></label><label>Уже накоплено<input name="initialAmount" inputMode="decimal" placeholder="0,00"/></label><label>Срок цели <small>необязательно</small><input name="targetDate" type="date"/></label><label>Комментарий<input name="note" maxLength={500} placeholder="Необязательно"/></label><button className="button primary wide">Создать цель</button></form></>; }
