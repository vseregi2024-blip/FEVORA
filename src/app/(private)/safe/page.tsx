import { MoneyAccountKind } from "@prisma/client";

import { ImperiaSafe } from "@/components/imperia-safe";
import { formatMoney, minorUnitsToMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getSafeOverview } from "@/server/money";

export default async function SafePage() {
  const user = await requireUser(); const data = await getSafeOverview(user.id);
  const totals = new Map(data.summaries.map((item) => [item.currency, item.total]));
  const currencies = [...new Set([...totals.keys(), ...data.allocations.keys(), user.defaultCurrency])];
  const allocations = currencies.map((currency) => { const total = totals.get(currency) ?? 0n; const allocated = data.allocations.get(currency) ?? 0n; return { currency, total: formatMoney(minorUnitsToMoney(total), currency), allocated: formatMoney(minorUnitsToMoney(allocated), currency), free: formatMoney(minorUnitsToMoney(total - allocated), currency) }; });
  return <ImperiaSafe todayIncome={formatMoney(minorUnitsToMoney(data.today.income), user.defaultCurrency)} todayExpense={formatMoney(minorUnitsToMoney(data.today.expense), user.defaultCurrency)} todayResult={formatMoney(minorUnitsToMoney(data.today.income - data.today.expense), user.defaultCurrency)} wallets={data.accounts.filter((account) => account.isActive && account.kind === MoneyAccountKind.WALLET).map((account) => ({ id: account.id, name: account.name, currency: account.currency, balance: formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency), type: account.type }))} allocations={allocations}/>;
}
