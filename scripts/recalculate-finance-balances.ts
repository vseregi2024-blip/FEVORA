import { FinanceModule, MoneyAccountKind, MoneyAccountType, PrismaClient } from "@prisma/client";
import { minorUnitsToMoney, moneyToMinorUnits } from "../src/lib/money";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const reports = [];
  for (const user of users) {
    const project = await prisma.project.upsert({
      where: { userId_code: { userId: user.id, code: FinanceModule.FAMILY } },
      update: {},
      create: { userId: user.id, code: FinanceModule.FAMILY, name: "Семья", sortOrder: 10 },
    });
    const transactions = await prisma.transaction.findMany({ where: { userId: user.id, module: FinanceModule.FAMILY, currency: "UAH", deletedAt: null }, select: { amount: true, type: true } });
    const availableMinor = transactions.reduce((total, transaction) => {
      const amount = moneyToMinorUnits(transaction.amount.toString());
      return total + (transaction.type === "EXPENSE" ? -amount : transaction.type === "INCOME" ? amount : 0n);
    }, 0n);
    await prisma.moneyAccount.upsert({
      where: { projectId_name: { projectId: project.id, name: "Доступно семье" } },
      update: { openingBalance: minorUnitsToMoney(availableMinor), isActive: true, isPrimary: true },
      create: { userId: user.id, projectId: project.id, name: "Доступно семье", kind: MoneyAccountKind.WALLET, type: MoneyAccountType.CASH, currency: "UAH", openingBalance: minorUnitsToMoney(availableMinor), isPrimary: true, sortOrder: -1 },
    });
    const accounts = await prisma.moneyAccount.findMany({ where: { userId: user.id }, include: { moneyLedgerEntries: { where: { reversedAt: null }, select: { amount: true } } }, orderBy: { createdAt: "asc" } });
    const totals = new Map<string, bigint>();
    const accountRows = accounts.map((account) => {
      const balance = account.moneyLedgerEntries.reduce((total, entry) => total + moneyToMinorUnits(entry.amount.toString()), moneyToMinorUnits(account.openingBalance.toString()));
      totals.set(account.currency, (totals.get(account.currency) ?? 0n) + balance);
      return { id: account.id, name: account.name, kind: account.kind, currency: account.currency, balance: minorUnitsToMoney(balance) };
    });
    reports.push({
      user: user.name ?? user.id,
      totals: [...totals.entries()].map(([currency, total]) => ({ currency, total: minorUnitsToMoney(total) })),
      accounts: accountRows,
    });
  }
  console.log(JSON.stringify(reports, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
