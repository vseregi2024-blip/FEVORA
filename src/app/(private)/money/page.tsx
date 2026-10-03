import { FinanceModule } from "@prisma/client";

import { ImperiaFinance } from "@/components/imperia-finance";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getInternalTransfer, getMoneyOverview, getMoneyProjects, getMoneyWorkspace } from "@/server/money";

const allowed = new Set<FinanceModule>([FinanceModule.FAMILY, FinanceModule.POULTRY, FinanceModule.GOODS, FinanceModule.INFOBUSINESS, FinanceModule.COSMETOLOGY]);
const icons = { CASH: "₴", BANK: "Б", CARD: "◈", OTHER: "•••" } as const;

export default async function MoneyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const query = await searchParams;
  const projects = await getMoneyProjects(user.id);
  const requested = query.project as FinanceModule | undefined;
  const code = requested && allowed.has(requested) ? requested : (projects[0]?.code ?? FinanceModule.FAMILY);
  const [data, overview, completedTransfer] = await Promise.all([
    getMoneyWorkspace(user.id, code),
    getMoneyOverview(user.id),
    query.transfer ? getInternalTransfer(user.id, query.transfer) : Promise.resolve(null),
  ]);
  const active = data.accounts.filter((account) => account.isActive);
  const wallets = active.filter((account) => account.kind === "WALLET");
  const envelopes = active.filter((account) => account.kind === "ENVELOPE");
  const archived = data.accounts.filter((account) => !account.isActive);
  const notice = query.created === "WALLET" ? "Кошелёк создан ✓" : query.created === "ENVELOPE" ? "Конверт создан ✓" : query.allocated ? "Деньги распределены ✓" : query.updated ? "Изменения сохранены ✓" : query.archived ? "Счёт перемещён в архив ✓" : query.deleted ? "Неиспользованный счёт удалён ✓" : null;
  const defaultValue = formatMoney("0.00", user.defaultCurrency);
  const accountView = (account: (typeof data.accounts)[number]) => {
    const targetMinor = account.targetAmount ? moneyToMinorUnits(account.targetAmount.toString()) : null;
    const progress = targetMinor && targetMinor > 0n ? Math.min(100, Number(account.balanceMinor * 100n / targetMinor)) : null;
    const remaining = targetMinor ? (targetMinor - account.balanceMinor > 0n ? targetMinor - account.balanceMinor : 0n) : null;
    return ({
    id: account.id,
    name: account.name,
    subtitle: account.kind === "ENVELOPE" ? targetMinor ? `Накоплено ${formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)} из ${formatMoney(account.targetAmount!.toString(), account.currency)} · ${progress}% · осталось ${formatMoney(minorUnitsToMoney(remaining!), account.currency)}` : `Зарезервировано ${formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)}` : account.type === "CASH" ? "Наличные" : account.type === "BANK" ? "Банковский счёт" : account.type === "CARD" ? "Карта" : "Другой кошелёк",
    value: formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency),
    icon: account.kind === "ENVELOPE" ? account.icon || "✦" : icons[account.type],
    primary: account.isPrimary,
    });
  };

  return <ImperiaFinance
    projectName={data.project.name}
    defaultValue={defaultValue}
    notice={notice}
    completedTransfer={completedTransfer ? {
      source: `${completedTransfer.sourceAccount.project.name} / ${completedTransfer.sourceAccount.name} −${formatMoney(completedTransfer.sourceAmount.toString(), completedTransfer.sourceCurrency)}`,
      target: `${completedTransfer.targetAccount.project.name} / ${completedTransfer.targetAccount.name} +${formatMoney(completedTransfer.targetAmount.toString(), completedTransfer.targetCurrency)}`,
    } : null}
    globalSummaries={overview.summaries.map((summary) => ({ currency: summary.currency, value: formatMoney(minorUnitsToMoney(summary.total), summary.currency) }))}
    summaries={data.summaries.map((summary) => ({ currency: summary.currency, total: formatMoney(minorUnitsToMoney(summary.total), summary.currency), free: formatMoney(minorUnitsToMoney(summary.free), summary.currency), allocated: formatMoney(minorUnitsToMoney(summary.allocated), summary.currency) }))}
    projectBalances={projects.map((project) => {
      const balances = overview.accounts.filter((account) => account.projectId === project.id && account.isActive && account.kind === "WALLET").reduce<Record<string, bigint>>((result, account) => ({ ...result, [account.currency]: (result[account.currency] ?? 0n) + account.balanceMinor }), {});
      const value = Object.entries(balances).map(([currency, total]) => formatMoney(minorUnitsToMoney(total), currency)).join(" · ") || defaultValue;
      return { code: project.code, name: project.name, value, active: project.code === code };
    })}
    transferSummary={data.transferSummary.map((summary) => ({ currency: summary.currency, incoming: `+${formatMoney(minorUnitsToMoney(summary.incoming), summary.currency)}`, outgoing: `−${formatMoney(minorUnitsToMoney(summary.outgoing), summary.currency)}` }))}
    legacySummary={data.legacySummary.map((summary) => ({ currency: summary.currency, income: formatMoney(minorUnitsToMoney(summary.income), summary.currency), expense: formatMoney(minorUnitsToMoney(summary.expense), summary.currency), result: formatMoney(minorUnitsToMoney(summary.result), summary.currency) }))}
    wallets={wallets.map(accountView)}
    envelopes={envelopes.map(accountView)}
    archived={archived.map(accountView)}
  />;
}
