import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const testName = /(test|тест|demo|демо|mock|seed|sample|пример|пробн|чернов)/i;
const normalize = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase("ru").replace(/\s+/g, " ");
const amount = (value: Prisma.Decimal | null) => value?.toFixed(2) ?? null;
const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? null;

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const report = [];

  for (const user of users) {
    const [transactions, categories, accounts, ledgerEntries, transfers, recurringPayments, familyAccounts, poultrySales, feedLots, poultryExpenses, productPurchases, productSales, goodsExpenses, infoSales, infoExpenses, cosmetologyPayments, cosmetologyExpenses, cosmetologyWalletMovements] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: [{ operationDate: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, type: true, amount: true, operationDate: true, module: true, description: true,
          source: true, deletedAt: true, recurringPaymentId: true, familyAccountId: true,
          category: { select: { name: true } },
          poultrySale: { select: { id: true } }, productSale: { select: { id: true } }, infoSale: { select: { id: true } },
          cosmetologyPayment: { select: { id: true } }, cosmetologyVisit: { select: { id: true } },
        },
      }),
      prisma.category.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, module: true, kind: true, isArchived: true, createdAt: true } }),
      prisma.moneyAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, kind: true, currency: true, openingBalance: true, isActive: true, createdAt: true, project: { select: { code: true } }, moneyLedgerEntries: { where: { reversedAt: null }, select: { amount: true } }, _count: { select: { outgoingTransfers: true, incomingTransfers: true } } } }),
      prisma.moneyLedgerEntry.findMany({ where: { userId: user.id }, orderBy: { operationDate: "asc" }, select: { id: true, type: true, amount: true, operationDate: true, reversedAt: true, account: { select: { name: true } } } }),
      prisma.internalTransfer.findMany({ where: { userId: user.id }, orderBy: { operationDate: "asc" }, select: { id: true, sourceAmount: true, targetAmount: true, operationDate: true, status: true, sourceAccount: { select: { name: true } }, targetAccount: { select: { name: true } } } }),
      prisma.recurringPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, amount: true, nextDueDate: true, isActive: true, archivedAt: true, category: { select: { name: true } } } }),
      prisma.familyAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, isArchived: true } }),
      prisma.poultrySale.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.feedLot.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.poultryOperationalExpense.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.productPurchase.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.productSale.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.goodsOperationalExpense.count({ where: { userId: user.id } }),
      prisma.infoSale.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.infoExpense.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.cosmetologyPayment.count({ where: { userId: user.id } }),
      prisma.cosmetologyExpense.count({ where: { userId: user.id, deletedAt: null } }),
      prisma.cosmetologyWalletMovement.count({ where: { userId: user.id, deletedAt: null } }),
    ]);

    const activeTransactions = transactions.filter((transaction) => !transaction.deletedAt);
    const transactionRows = activeTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: amount(transaction.amount),
      date: date(transaction.operationDate),
      module: transaction.module,
      category: transaction.category?.name ?? null,
      description: transaction.description,
      source: transaction.source,
      recurringPaymentId: transaction.recurringPaymentId,
      linked: [transaction.poultrySale && "poultry", transaction.productSale && "goods", transaction.infoSale && "infobusiness", transaction.cosmetologyPayment && "cosmetology-payment", transaction.cosmetologyVisit && "cosmetology-visit"].filter(Boolean),
    }));
    const exactGroups = new Map<string, typeof transactionRows>();
    for (const row of transactionRows) {
      const key = [row.type, row.amount, row.date, row.module, normalize(row.category), normalize(row.description)].join("|");
      exactGroups.set(key, [...(exactGroups.get(key) ?? []), row]);
    }

    const recurringTransactions = transactionRows.filter((transaction) => transaction.recurringPaymentId);
    const testCandidates = {
      transactions: transactionRows.filter((transaction) => testName.test([transaction.category, transaction.description].filter(Boolean).join(" "))),
      categories: categories.filter((category) => testName.test(category.name)).map((category) => ({ ...category, createdAt: date(category.createdAt) })),
        accounts: accounts.filter((account) => testName.test(account.name)).map((account) => ({ ...account, openingBalance: amount(account.openingBalance) })),
    };

    report.push({
      user: { id: user.id, name: user.name ?? null },
      counts: {
        transactions: { active: activeTransactions.length, softDeleted: transactions.length - activeTransactions.length },
        userCategories: categories.length,
        moneyAccounts: accounts.length,
        moneyLedgerEntries: ledgerEntries.length,
        internalTransfers: transfers.length,
        recurringPayments: recurringPayments.length,
        familyAccounts: familyAccounts.length,
        linkedModuleRecords: { poultrySales, feedLots, poultryExpenses, productPurchases, productSales, goodsExpenses, infoSales, infoExpenses, cosmetologyPayments, cosmetologyExpenses, cosmetologyWalletMovements },
      },
      transactions: transactionRows,
      recurringPayments: recurringPayments.map((payment) => ({ ...payment, amount: amount(payment.amount), nextDueDate: date(payment.nextDueDate), archivedAt: date(payment.archivedAt) })),
      potentialExactTransactionDuplicates: [...exactGroups.values()].filter((group) => group.length > 1),
      legacyRecurringTransactionCandidates: recurringTransactions,
      testNameCandidates: testCandidates,
      moneyModel: {
        accounts: accounts.map((account) => {
          const balance = account.moneyLedgerEntries.reduce((total, entry) => total.plus(entry.amount), account.openingBalance);
          return {
            id: account.id,
            name: account.name,
            kind: account.kind,
            project: account.project.code,
            currency: account.currency,
            openingBalance: amount(account.openingBalance),
            balance: amount(balance),
            createdAt: date(account.createdAt),
            isActive: account.isActive,
            relatedLedgerEntries: account.moneyLedgerEntries.length,
            relatedTransfers: account._count.outgoingTransfers + account._count.incomingTransfers,
            relatedModuleReferences: 0,
          };
        }),
        ledgerEntries: ledgerEntries.map((entry) => ({ id: entry.id, account: entry.account.name, type: entry.type, amount: amount(entry.amount), date: date(entry.operationDate), reversedAt: date(entry.reversedAt) })),
        transfers: transfers.map((transfer) => ({ id: transfer.id, source: transfer.sourceAccount.name, target: transfer.targetAccount.name, sourceAmount: amount(transfer.sourceAmount), targetAmount: amount(transfer.targetAmount), date: date(transfer.operationDate), status: transfer.status })),
      },
    });
  }

  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), users: report }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
