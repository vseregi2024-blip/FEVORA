-- C2: additive FEVORA-side redemption saga. No existing payments, components,
-- financial transactions, loyalty deliveries, or balances are transformed.
ALTER TYPE "CosmetologyPaymentMethod" ADD VALUE IF NOT EXISTS 'BONUS';

CREATE TYPE "CosmetologyBonusRedemptionStatus" AS ENUM (
  'PENDING',
  'SENDING',
  'REMOTE_CONFIRMED',
  'APPLIED',
  'FAILED_RETRYABLE',
  'FAILED_FINAL',
  'CONFLICT'
);

CREATE TABLE "CosmetologyBonusRedemption" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "visitId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "paymentComponentId" TEXT,
  "requestKey" TEXT NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "loyaltyClientId" TEXT NOT NULL,
  "bonusAmount" DECIMAL(18,2) NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "paymentSnapshot" JSONB NOT NULL,
  "status" "CosmetologyBonusRedemptionStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "remoteRedemptionId" TEXT,
  "balanceBefore" INTEGER,
  "balanceAfter" INTEGER,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CosmetologyBonusRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CosmetologyBonusRedemption_paymentComponentId_key" ON "CosmetologyBonusRedemption"("paymentComponentId");
CREATE UNIQUE INDEX "CosmetologyBonusRedemption_externalEventId_key" ON "CosmetologyBonusRedemption"("externalEventId");
CREATE UNIQUE INDEX "CosmetologyBonusRedemption_visitId_requestKey_key" ON "CosmetologyBonusRedemption"("visitId", "requestKey");
-- At most one unresolved redemption may exist per visit. After APPLIED or a final failure, a later partial payment can create a new one.
CREATE UNIQUE INDEX "CosmetologyBonusRedemption_one_open_per_visit" ON "CosmetologyBonusRedemption"("visitId")
WHERE "status" IN ('PENDING', 'SENDING', 'REMOTE_CONFIRMED', 'FAILED_RETRYABLE');
CREATE INDEX "CosmetologyBonusRedemption_visitId_status_idx" ON "CosmetologyBonusRedemption"("visitId", "status");
CREATE INDEX "CosmetologyBonusRedemption_status_lastAttemptAt_idx" ON "CosmetologyBonusRedemption"("status", "lastAttemptAt");
CREATE INDEX "CosmetologyBonusRedemption_paymentId_idx" ON "CosmetologyBonusRedemption"("paymentId");

ALTER TABLE "CosmetologyBonusRedemption" ADD CONSTRAINT "CosmetologyBonusRedemption_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyBonusRedemption" ADD CONSTRAINT "CosmetologyBonusRedemption_visitId_fkey"
FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyBonusRedemption" ADD CONSTRAINT "CosmetologyBonusRedemption_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "CosmetologyPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyBonusRedemption" ADD CONSTRAINT "CosmetologyBonusRedemption_paymentComponentId_fkey"
FOREIGN KEY ("paymentComponentId") REFERENCES "CosmetologyPaymentComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
