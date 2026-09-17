import { moneyToMinorUnits } from "../../lib/money";

export type MoneyEntry = { amount: string; reversedAt?: Date | null };
export type MoneyAccountSnapshot = {
  kind: "WALLET" | "ENVELOPE";
  openingBalance: string;
  entries: MoneyEntry[];
};

export function calculateMoneyAccountBalance(account: Pick<MoneyAccountSnapshot, "openingBalance" | "entries">) {
  return account.entries.reduce(
    (total, entry) => entry.reversedAt ? total : total + moneyToMinorUnits(entry.amount),
    moneyToMinorUnits(account.openingBalance),
  );
}

export function summarizeProjectMoney(accounts: MoneyAccountSnapshot[]) {
  return accounts.reduce((summary, account) => {
    const balance = calculateMoneyAccountBalance(account);
    summary.total += balance;
    if (account.kind === "ENVELOPE") summary.allocated += balance;
    else summary.free += balance;
    return summary;
  }, { total: 0n, allocated: 0n, free: 0n });
}

export function assertAllocationKeepsCapital(before: MoneyAccountSnapshot[], after: MoneyAccountSnapshot[]) {
  return summarizeProjectMoney(before).total === summarizeProjectMoney(after).total;
}

export type AllocationAccount = {
  id: string;
  projectId: string;
  kind: "WALLET" | "ENVELOPE";
  currency: string;
  isActive: boolean;
  balanceMinor: bigint;
};

export function validateInternalAllocation(source: AllocationAccount, target: AllocationAccount, amountMinor: bigint) {
  if (source.id === target.id) throw new Error("Выберите два разных счёта.");
  if (!source.isActive || !target.isActive) throw new Error("Архивный счёт нельзя использовать.");
  if (source.currency !== target.currency) throw new Error("Распределение между разными валютами пока недоступно.");
  if (source.projectId === target.projectId && source.kind === target.kind) throw new Error("Внутри проекта перемещайте деньги между кошельком и конвертом.");
  if (amountMinor <= 0n) throw new Error("Введите сумму больше нуля.");
  if (source.balanceMinor < amountMinor) throw new Error("Недостаточно свободных средств.");
}

export function validateTransferCancellation(targetBalanceMinor: bigint, targetAmountMinor: bigint) {
  if (targetBalanceMinor < targetAmountMinor) throw new Error("Перевод нельзя отменить: часть денег уже использована.");
}
