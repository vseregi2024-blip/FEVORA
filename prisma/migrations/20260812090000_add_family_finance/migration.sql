CREATE TYPE "RecurringFrequency" AS ENUM ('MONTHLY', 'WEEKLY');
CREATE TYPE "SavingsGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

CREATE TABLE "Receipt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "description" TEXT,
  "operationDate" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecurringPayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'UAH',
  "categoryId" TEXT,
  "frequency" "RecurringFrequency" NOT NULL DEFAULT 'MONTHLY',
  "nextDueDate" DATE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringPayment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SavingsGoal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetAmount" DECIMAL(18,2),
  "status" "SavingsGoalStatus" NOT NULL DEFAULT 'ACTIVE',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SavingsMovement" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "direction" "TransactionType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavingsMovement_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Transaction" ADD COLUMN "receiptId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "recurringPaymentId" TEXT;
CREATE UNIQUE INDEX "SavingsMovement_transactionId_key" ON "SavingsMovement"("transactionId");
CREATE INDEX "Receipt_userId_operationDate_idx" ON "Receipt"("userId", "operationDate");
CREATE INDEX "RecurringPayment_userId_isActive_nextDueDate_idx" ON "RecurringPayment"("userId", "isActive", "nextDueDate");
CREATE INDEX "SavingsGoal_userId_status_idx" ON "SavingsGoal"("userId", "status");
CREATE INDEX "SavingsMovement_goalId_createdAt_idx" ON "SavingsMovement"("goalId", "createdAt");
CREATE INDEX "Transaction_receiptId_idx" ON "Transaction"("receiptId");
CREATE INDEX "Transaction_recurringPaymentId_idx" ON "Transaction"("recurringPaymentId");
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringPayment" ADD CONSTRAINT "RecurringPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringPayment" ADD CONSTRAINT "RecurringPayment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavingsMovement" ADD CONSTRAINT "SavingsMovement_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavingsMovement" ADD CONSTRAINT "SavingsMovement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringPaymentId_fkey" FOREIGN KEY ("recurringPaymentId") REFERENCES "RecurringPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
