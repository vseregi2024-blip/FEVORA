CREATE TYPE "CosmetologyWallet" AS ENUM ('CASH', 'MONO', 'PRIVAT', 'PROCUREMENT');
CREATE TYPE "CosmetologyWalletMovementType" AS ENUM ('PREPAYMENT', 'SETTLEMENT', 'DEBT_PAYMENT', 'REFUND', 'PURCHASE', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT');
ALTER TYPE "CosmetologyVisitStatus" ADD VALUE 'NO_SHOW';

ALTER TABLE "CosmetologyClient" ADD COLUMN "referrerId" TEXT;
ALTER TABLE "CosmetologyInventoryItem" ADD COLUMN "minimumQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0;
ALTER TABLE "CosmetologyInventoryLot" ADD COLUMN "supplier" TEXT;
ALTER TABLE "CosmetologyVisit" ADD COLUMN "durationMinutes" INTEGER, ADD COLUMN "plannedAmount" DECIMAL(18,2), ADD COLUMN "paidAmount" DECIMAL(18,2) NOT NULL DEFAULT 0;
UPDATE "CosmetologyVisit" SET "plannedAmount" = "paymentAmount", "paidAmount" = "paymentAmount" WHERE "status" = 'COMPLETED';

CREATE TABLE "CosmetologyWalletMovement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "wallet" "CosmetologyWallet" NOT NULL,
  "type" "CosmetologyWalletMovementType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "operationDate" DATE NOT NULL,
  "description" TEXT,
  "visitId" TEXT,
  "transactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CosmetologyWalletMovement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CosmetologyWalletMovement_transactionId_key" ON "CosmetologyWalletMovement"("transactionId");
CREATE INDEX "CosmetologyWalletMovement_userId_wallet_operationDate_deletedAt_idx" ON "CosmetologyWalletMovement"("userId", "wallet", "operationDate", "deletedAt");
CREATE INDEX "CosmetologyWalletMovement_userId_visitId_idx" ON "CosmetologyWalletMovement"("userId", "visitId");
ALTER TABLE "CosmetologyClient" ADD CONSTRAINT "CosmetologyClient_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "CosmetologyClient"("id") ON DELETE SET NULL;
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE SET NULL;
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL;
