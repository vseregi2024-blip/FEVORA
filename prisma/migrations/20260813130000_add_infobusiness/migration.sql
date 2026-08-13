-- CreateEnum
CREATE TYPE "InfoProductFormat" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');
CREATE TYPE "InfoProductStatus" AS ENUM ('PREPARATION', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "FinanceModule" ADD VALUE 'INFOBUSINESS';

-- CreateTable
CREATE TABLE "InfoProduct" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "format" "InfoProductFormat" NOT NULL,
  "basePrice" DECIMAL(18,2),
  "startDate" DATE,
  "endDate" DATE,
  "status" "InfoProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InfoProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InfoSale" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "buyer" TEXT,
  "seats" INTEGER NOT NULL DEFAULT 1,
  "comment" TEXT,
  "incomeTransactionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InfoSale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InfoExpenseCategory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InfoExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InfoExpense" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "productId" TEXT,
  "serviceName" TEXT,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InfoExpense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InfoProduct_userId_name_key" ON "InfoProduct"("userId", "name");
CREATE INDEX "InfoProduct_userId_status_deletedAt_idx" ON "InfoProduct"("userId", "status", "deletedAt");
CREATE UNIQUE INDEX "InfoSale_incomeTransactionId_key" ON "InfoSale"("incomeTransactionId");
CREATE INDEX "InfoSale_userId_productId_deletedAt_idx" ON "InfoSale"("userId", "productId", "deletedAt");
CREATE UNIQUE INDEX "InfoExpenseCategory_userId_name_key" ON "InfoExpenseCategory"("userId", "name");
CREATE INDEX "InfoExpenseCategory_userId_isArchived_sortOrder_idx" ON "InfoExpenseCategory"("userId", "isArchived", "sortOrder");
CREATE UNIQUE INDEX "InfoExpense_transactionId_key" ON "InfoExpense"("transactionId");
CREATE INDEX "InfoExpense_userId_productId_categoryId_deletedAt_idx" ON "InfoExpense"("userId", "productId", "categoryId", "deletedAt");

ALTER TABLE "InfoProduct" ADD CONSTRAINT "InfoProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfoSale" ADD CONSTRAINT "InfoSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfoSale" ADD CONSTRAINT "InfoSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InfoProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InfoSale" ADD CONSTRAINT "InfoSale_incomeTransactionId_fkey" FOREIGN KEY ("incomeTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfoExpenseCategory" ADD CONSTRAINT "InfoExpenseCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfoExpense" ADD CONSTRAINT "InfoExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfoExpense" ADD CONSTRAINT "InfoExpense_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfoExpense" ADD CONSTRAINT "InfoExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InfoExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InfoExpense" ADD CONSTRAINT "InfoExpense_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InfoProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
