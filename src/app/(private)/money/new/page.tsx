import { FinanceModule, MoneyAccountKind } from "@prisma/client";
import Link from "next/link";

import { MoneyAccountForm } from "@/components/money-account-form";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { createMoneyAccountAction } from "../actions";

const codes = new Set<FinanceModule>(Object.values(FinanceModule).filter((code) => code !== "GENERAL"));
export default async function NewMoneyAccountPage({ searchParams }: { searchParams: Promise<{ project?: string; kind?: string; error?: string; returnTo?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const project = codes.has(query.project as FinanceModule) ? query.project! : FinanceModule.FAMILY;
  const kind = query.kind === MoneyAccountKind.ENVELOPE ? MoneyAccountKind.ENVELOPE : MoneyAccountKind.WALLET;
  const categories = kind === "ENVELOPE" ? await getCategories(user.id, project as FinanceModule) : [];
  const returnTo = query.returnTo === "/family/settings/money" ? query.returnTo : undefined;
  const backHref = returnTo ?? (kind === "ENVELOPE" ? "/money/envelopes" : "/safe");
  return <><header className="page-header"><div><Link href={backHref} className="eyebrow">← Назад</Link><h1>{kind === "WALLET" ? "Новый кошелёк" : "Новый конверт"}</h1><p className="muted">{kind === "WALLET" ? "Реальное место хранения денег." : "Резерв денег и финансовая цель в одном месте."}</p></div></header>{query.error && <p className="form-error">{query.error}</p>}<MoneyAccountForm action={createMoneyAccountAction} projectCode={project} kind={kind} categories={categories} returnTo={returnTo} submitLabel={kind === "WALLET" ? "Сохранить кошелёк" : "Создать конверт"}/></>;
}
