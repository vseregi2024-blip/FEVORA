CREATE TYPE "CosmetologyLoyaltyDeliveryStatus" AS ENUM ('NOT_SENT', 'SENDING', 'SENT', 'FAILED');

CREATE TABLE "CosmetologyLoyaltyDelivery" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "loyaltyClientId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "CosmetologyLoyaltyDeliveryStatus" NOT NULL DEFAULT 'NOT_SENT',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "remotePaymentId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CosmetologyLoyaltyDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CosmetologyLoyaltyDelivery_visitId_key"
ON "CosmetologyLoyaltyDelivery"("visitId");

CREATE UNIQUE INDEX "CosmetologyLoyaltyDelivery_externalEventId_key"
ON "CosmetologyLoyaltyDelivery"("externalEventId");

CREATE INDEX "CosmetologyLoyaltyDelivery_status_lastAttemptAt_idx"
ON "CosmetologyLoyaltyDelivery"("status", "lastAttemptAt");

ALTER TABLE "CosmetologyLoyaltyDelivery"
ADD CONSTRAINT "CosmetologyLoyaltyDelivery_visitId_fkey"
FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
