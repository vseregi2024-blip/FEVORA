import { FinanceModule, MoneyAccountKind } from "@prisma/client";
import Link from "next/link";

import { MoneyAccountForm } from "@/components/money-account-form";
import { createMoneyAccountAction } from "../actions";

const codes = new Set<FinanceModule>(Object.values(FinanceModule).filter((code) => code !== "GENERAL"));
export default async function NewMoneyAccountPage({ searchParams }: { searchParams: Promise<{ project?: string; kind?: string; error?: string }> }) {
  const query = await searchParams;
  const project = codes.has(query.project as FinanceModule) ? query.project! : FinanceModule.FAMILY;
  const kind = query.kind === MoneyAccountKind.ENVELOPE ? MoneyAccountKind.ENVELOPE : MoneyAccountKind.WALLET;
  return <><header className="page-header"><div><Link href={`/money?project=${project}`} className="eyebrow">← Назад</Link><h1>{kind === "WALLET" ? "Новый кошелёк" : "Новый конверт"}</h1><p className="muted">{kind === "WALLET" ? "Реальное место хранения денег." : "Назначение уже имеющихся денег."}</p></div></header>{query.error && <p className="form-error">{query.error}</p>}<MoneyAccountForm action={createMoneyAccountAction} projectCode={project} kind={kind} submitLabel={kind === "WALLET" ? "Сохранить кошелёк" : "Создать конверт"}/></>;
}
