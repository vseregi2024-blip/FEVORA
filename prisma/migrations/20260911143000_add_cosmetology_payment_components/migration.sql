ALTER TYPE "CosmetologyWallet" ADD VALUE IF NOT EXISTS 'OTHER';

CREATE TYPE "CosmetologyPaymentMethod" AS ENUM ('CASH', 'MONOBANK', 'PRIVATBANK', 'OTHER');

CREATE TABLE "CosmetologyPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UAH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CosmetologyPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CosmetologyPaymentComponent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "method" "CosmetologyPaymentMethod" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "operationDate" DATE NOT NULL,
    "comment" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CosmetologyPaymentComponent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction" ADD COLUMN "cosmetologyPaymentId" TEXT;
ALTER TABLE "CosmetologyWalletMovement" ADD COLUMN "paymentComponentId" TEXT;

CREATE UNIQUE INDEX "CosmetologyPayment_visitId_key" ON "CosmetologyPayment"("visitId");
CREATE INDEX "CosmetologyPayment_userId_createdAt_idx" ON "CosmetologyPayment"("userId", "createdAt");
CREATE INDEX "CosmetologyPaymentComponent_paymentId_operationDate_createdAt_idx" ON "CosmetologyPaymentComponent"("paymentId", "operationDate", "createdAt");
CREATE INDEX "CosmetologyPaymentComponent_method_operationDate_idx" ON "CosmetologyPaymentComponent"("method", "operationDate");
CREATE INDEX "CosmetologyPaymentComponent_transactionId_idx" ON "CosmetologyPaymentComponent"("transactionId");
CREATE INDEX "Transaction_cosmetologyPaymentId_operationDate_idx" ON "Transaction"("cosmetologyPaymentId", "operationDate");
CREATE UNIQUE INDEX "CosmetologyWalletMovement_paymentComponentId_key" ON "CosmetologyWalletMovement"("paymentComponentId");

ALTER TABLE "CosmetologyPayment" ADD CONSTRAINT "CosmetologyPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyPayment" ADD CONSTRAINT "CosmetologyPayment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyPaymentComponent" ADD CONSTRAINT "CosmetologyPaymentComponent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CosmetologyPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyPaymentComponent" ADD CONSTRAINT "CosmetologyPaymentComponent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cosmetologyPaymentId_fkey" FOREIGN KEY ("cosmetologyPaymentId") REFERENCES "CosmetologyPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_paymentComponentId_fkey" FOREIGN KEY ("paymentComponentId") REFERENCES "CosmetologyPaymentComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The production legacy audit found one unambiguous paid visit. The backfill is
-- deliberately limited to positive, active payment movements tied to a visit.
INSERT INTO "CosmetologyPayment" ("id", "userId", "visitId", "currency", "createdAt", "updatedAt")
SELECT 'legacy-payment-' || v."id", v."userId", v."id", 'UAH', MIN(m."createdAt"), CURRENT_TIMESTAMP
FROM "CosmetologyVisit" v
JOIN "CosmetologyWalletMovement" m ON m."visitId" = v."id"
WHERE v."deletedAt" IS NULL
  AND m."deletedAt" IS NULL
  AND m."amount" > 0
  AND m."wallet" IN ('CASH', 'MONO', 'PRIVAT')
  AND m."type" IN ('PREPAYMENT', 'SETTLEMENT', 'DEBT_PAYMENT')
GROUP BY v."id", v."userId"
ON CONFLICT ("visitId") DO NOTHING;

INSERT INTO "CosmetologyPaymentComponent" ("id", "paymentId", "method", "amount", "operationDate", "comment", "transactionId", "createdAt")
SELECT
  'legacy-component-' || m."id",
  'legacy-payment-' || m."visitId",
  CASE m."wallet"::text
    WHEN 'CASH' THEN 'CASH'::"CosmetologyPaymentMethod"
    WHEN 'MONO' THEN 'MONOBANK'::"CosmetologyPaymentMethod"
    WHEN 'PRIVAT' THEN 'PRIVATBANK'::"CosmetologyPaymentMethod"
  END,
  m."amount",
  m."operationDate",
  m."description",
  m."transactionId",
  m."createdAt"
FROM "CosmetologyWalletMovement" m
JOIN "CosmetologyPayment" p ON p."visitId" = m."visitId"
WHERE m."deletedAt" IS NULL
  AND m."amount" > 0
  AND m."wallet" IN ('CASH', 'MONO', 'PRIVAT')
  AND m."type" IN ('PREPAYMENT', 'SETTLEMENT', 'DEBT_PAYMENT')
ON CONFLICT ("id") DO NOTHING;

UPDATE "Transaction" t
SET "cosmetologyPaymentId" = p."id"
FROM "CosmetologyWalletMovement" m
JOIN "CosmetologyPayment" p ON p."visitId" = m."visitId"
WHERE m."transactionId" = t."id"
  AND m."deletedAt" IS NULL
  AND m."amount" > 0;

UPDATE "CosmetologyWalletMovement" m
SET "paymentComponentId" = 'legacy-component-' || m."id"
WHERE EXISTS (
  SELECT 1 FROM "CosmetologyPaymentComponent" c
  WHERE c."id" = 'legacy-component-' || m."id"
);
