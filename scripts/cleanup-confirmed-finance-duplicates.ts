import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function day(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function main() {
  const goals = await prisma.savingsGoal.findMany({
    where: { name: "На море", targetAmount: "10000", status: "ACTIVE" },
    include: { movements: { include: { transaction: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (goals.length !== 2 || goals.some((goal) => goal.movements.length !== 1 || goal.movements[0].direction !== "SAVING_IN" || goal.movements[0].amount.toFixed(2) !== "2000.00" || goal.movements[0].transaction.deletedAt)) {
    throw new Error("Набор дублей целей «На море» изменился. Очистка остановлена без изменений.");
  }

  const payment = await prisma.recurringPayment.findFirst({
    where: { name: "За телефон", isActive: true, archivedAt: null },
    include: { transactions: { where: { deletedAt: null }, orderBy: { operationDate: "asc" } } },
  });
  if (!payment || payment.amount.toFixed(2) !== "3499.00" || payment.transactions.length !== 2 || payment.transactions.some((transaction) => transaction.type !== "EXPENSE" || transaction.amount.toFixed(2) !== "3499.00") || payment.transactions.map((transaction) => day(transaction.operationDate)).join(",") !== "2026-10-31,2026-11-30") {
    throw new Error("Набор автоматических операций «За телефон» изменился. Очистка остановлена без изменений.");
  }

  const plan = {
    duplicateGoals: goals.map((goal) => ({ id: goal.id, movementId: goal.movements[0].id, transactionId: goal.movements[0].transactionId })),
    automaticRecurringTransactions: payment.transactions.map((transaction) => ({ id: transaction.id, operationDate: day(transaction.operationDate), amount: transaction.amount.toFixed(2) })),
    recurringPayment: { id: payment.id, restoredNextDueDate: "2026-10-31" },
  };

  if (!APPLY) {
    console.log(JSON.stringify({ mode: "dry-run", plan }, null, 2));
    return;
  }

  const deletedAt = new Date();
  await prisma.$transaction(async (db) => {
    await db.transaction.updateMany({ where: { id: { in: goals.map((goal) => goal.movements[0].transactionId) }, deletedAt: null }, data: { deletedAt } });
    await db.savingsGoal.deleteMany({ where: { id: { in: goals.map((goal) => goal.id) } } });
    await db.transaction.updateMany({ where: { id: { in: payment.transactions.map((transaction) => transaction.id) }, deletedAt: null }, data: { deletedAt } });
    await db.recurringPayment.update({ where: { id: payment.id }, data: { nextDueDate: new Date("2026-10-31T00:00:00.000Z") } });
  });

  console.log(JSON.stringify({ mode: "applied", deletedAt: deletedAt.toISOString(), plan }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
