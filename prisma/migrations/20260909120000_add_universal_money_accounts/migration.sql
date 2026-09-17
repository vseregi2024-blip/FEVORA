-- Additive foundation for project-scoped wallets, envelopes, and internal allocations.
CREATE TYPE "MoneyAccountKind" AS ENUM ('WALLET', 'ENVELOPE');
CREATE TYPE "MoneyAccountType" AS ENUM ('CASH', 'BANK', 'CARD', 'OTHER');
CREATE TYPE "MoneyLedgerEntryType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "InternalTransferStatus" AS ENUM ('POSTED', 'CANCELLED');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" "FinanceModule" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MoneyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "MoneyAccountKind" NOT NULL,
    "type" "MoneyAccountType" NOT NULL DEFAULT 'OTHER',
    "currency" CHAR(3) NOT NULL DEFAULT 'UAH',
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetAmount" DECIMAL(18,2),
    "targetDate" DATE,
    "note" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MoneyAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MoneyAccount_envelope_opening_zero" CHECK ("kind" = 'WALLET' OR "openingBalance" = 0),
    CONSTRAINT "MoneyAccount_envelope_not_primary" CHECK ("kind" = 'WALLET' OR "isPrimary" = false)
);

CREATE TABLE "InternalTransfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceAccountId" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "sourceAmount" DECIMAL(18,2) NOT NULL,
    "targetAmount" DECIMAL(18,2) NOT NULL,
    "sourceCurrency" CHAR(3) NOT NULL,
    "targetCurrency" CHAR(3) NOT NULL,
    "exchangeRate" DECIMAL(18,8),
    "operationDate" DATE NOT NULL,
    "comment" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "InternalTransferStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "InternalTransfer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InternalTransfer_different_accounts" CHECK ("sourceAccountId" <> "targetAccountId"),
    CONSTRAINT "InternalTransfer_positive_amounts" CHECK ("sourceAmount" > 0 AND "targetAmount" > 0)
);

CREATE TABLE "MoneyLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transferId" TEXT,
    "type" "MoneyLedgerEntryType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "operationDate" DATE NOT NULL,
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoneyLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Project_userId_code_key" ON "Project"("userId", "code");
CREATE INDEX "Project_userId_isActive_sortOrder_idx" ON "Project"("userId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "MoneyAccount_projectId_name_key" ON "MoneyAccount"("projectId", "name");
CREATE INDEX "MoneyAccount_userId_projectId_kind_isActive_sortOrder_idx" ON "MoneyAccount"("userId", "projectId", "kind", "isActive", "sortOrder");
CREATE UNIQUE INDEX "MoneyAccount_one_primary_wallet_per_project" ON "MoneyAccount"("projectId") WHERE "isPrimary" = true AND "isActive" = true;
CREATE UNIQUE INDEX "InternalTransfer_userId_idempotencyKey_key" ON "InternalTransfer"("userId", "idempotencyKey");
CREATE INDEX "InternalTransfer_userId_operationDate_idx" ON "InternalTransfer"("userId", "operationDate");
CREATE INDEX "InternalTransfer_sourceAccountId_operationDate_idx" ON "InternalTransfer"("sourceAccountId", "operationDate");
CREATE INDEX "InternalTransfer_targetAccountId_operationDate_idx" ON "InternalTransfer"("targetAccountId", "operationDate");
CREATE UNIQUE INDEX "MoneyLedgerEntry_transferId_accountId_key" ON "MoneyLedgerEntry"("transferId", "accountId");
CREATE INDEX "MoneyLedgerEntry_userId_projectId_operationDate_idx" ON "MoneyLedgerEntry"("userId", "projectId", "operationDate");
CREATE INDEX "MoneyLedgerEntry_accountId_reversedAt_operationDate_idx" ON "MoneyLedgerEntry"("accountId", "reversedAt", "operationDate");

ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoneyAccount" ADD CONSTRAINT "MoneyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoneyAccount" ADD CONSTRAINT "MoneyAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "MoneyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "MoneyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoneyLedgerEntry" ADD CONSTRAINT "MoneyLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoneyLedgerEntry" ADD CONSTRAINT "MoneyLedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoneyLedgerEntry" ADD CONSTRAINT "MoneyLedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MoneyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MoneyLedgerEntry" ADD CONSTRAINT "MoneyLedgerEntry_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InternalTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing users receive only project containers. Legacy balances and operations are deliberately not copied.
INSERT INTO "Project" ("id", "userId", "code", "name", "sortOrder", "updatedAt")
SELECT 'prj_' || md5(u."id" || ':' || p.code), u."id", p.code::"FinanceModule", p.name, p.sort_order, CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN (VALUES
  ('FAMILY', 'Семья', 10),
  ('POULTRY', 'Птицеводство', 20),
  ('GOODS', 'Товарка', 30),
  ('INFOBUSINESS', 'Инфобизнес', 40),
  ('COSMETOLOGY', 'Косметология', 50)
) AS p(code, name, sort_order)
ON CONFLICT ("userId", "code") DO NOTHING;
