-- Poultry 2.0 is an additive migration. Existing rows are preserved and backfilled.

ALTER TYPE "PoultryBatchSource" ADD VALUE IF NOT EXISTS 'GIFT';

CREATE TYPE "PoultrySaleType" AS ENUM ('LIVE_BIRD', 'CARCASS', 'EGGS', 'OTHER');
CREATE TYPE "PoultrySlaughterPurpose" AS ENUM ('FAMILY', 'SALE');
CREATE TYPE "PoultryOriginType" AS ENUM ('INCUBATION', 'PURCHASE', 'GIFT', 'OTHER');
CREATE TYPE "PoultryCostEntryType" AS ENUM ('ACQUISITION', 'INCUBATION_EGGS', 'TRANSFER_IN', 'TRANSFER_OUT', 'MANUAL');
CREATE TYPE "IncubationEggSource" AS ENUM ('OWN', 'PURCHASED', 'GIFTED');
CREATE TYPE "FeedUnit" AS ENUM ('KG', 'BAG', 'HOUSEHOLD');
CREATE TYPE "FeedAdjustmentType" AS ENUM ('RECONCILIATION', 'CORRECTION');

ALTER TABLE "PoultryBatch"
  ADD COLUMN "acquisitionDate" DATE,
  ADD COLUMN "ageAtAcquisitionDays" INTEGER,
  ADD COLUMN "acquisitionCashCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "acquisitionProductionCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "acquisitionTransactionId" TEXT;

ALTER TABLE "PoultryMovement"
  ADD COLUMN "quantityDelta" INTEGER,
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "transferId" TEXT;

ALTER TABLE "IncubationBatch"
  ADD COLUMN "eggSource" "IncubationEggSource" NOT NULL DEFAULT 'OWN',
  ADD COLUMN "cashCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "productionCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "hatchDate" DATE,
  ADD COLUMN "expenseTransactionId" TEXT;

ALTER TABLE "IncubationBatchItem"
  ALTER COLUMN "breed" DROP NOT NULL,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "FeedProduct"
  ADD COLUMN "householdUnitName" TEXT,
  ADD COLUMN "householdUnitKg" DECIMAL(10,3);

ALTER TABLE "FeedLot"
  ADD COLUMN "purchaseUnit" "FeedUnit" NOT NULL DEFAULT 'BAG',
  ADD COLUMN "purchaseQuantity" DECIMAL(14,3),
  ADD COLUMN "purchasedKg" DECIMAL(14,3),
  ADD COLUMN "availableKg" DECIMAL(14,3),
  ADD COLUMN "costPerKg" DECIMAL(18,4);

ALTER TABLE "FeedUsage"
  ADD COLUMN "unit" "FeedUnit" NOT NULL DEFAULT 'BAG',
  ADD COLUMN "quantity" DECIMAL(14,3),
  ADD COLUMN "quantityKg" DECIMAL(14,3),
  ADD COLUMN "costAmount" DECIMAL(18,2),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "PoultrySale"
  ADD COLUMN "saleType" "PoultrySaleType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "buyerPhone" TEXT,
  ADD COLUMN "slaughterId" TEXT,
  ADD COLUMN "autoSlaughter" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PoultryOperationalExpense"
  ADD COLUMN "incubationBatchId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE TABLE "PoultryBatchBreed" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryBatchBreed_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoultryOrigin" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "PoultryOriginType" NOT NULL,
  "birdType" TEXT NOT NULL,
  "originDate" DATE NOT NULL,
  "initialQuantity" INTEGER NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryOrigin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoultryTransfer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceBatchId" TEXT NOT NULL,
  "destinationBatchId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "transferredCost" DECIMAL(18,2) NOT NULL,
  "operationDate" DATE NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoultryOriginMovement" (
  "id" TEXT NOT NULL,
  "originId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "movementId" TEXT,
  "quantityDelta" INTEGER NOT NULL,
  "operationDate" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryOriginMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoultryCostEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "type" "PoultryCostEntryType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "referenceId" TEXT,
  "operationDate" DATE NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryCostEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoultrySlaughter" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "purpose" "PoultrySlaughterPurpose" NOT NULL,
  "carcassWeightKg" DECIMAL(10,3),
  "operationDate" DATE NOT NULL,
  "comment" TEXT,
  "movementId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultrySlaughter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoultryEggCollection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT,
  "breed" TEXT,
  "quantity" INTEGER NOT NULL,
  "operationDate" DATE NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryEggCollection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedRate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "dailyQuantity" DECIMAL(14,3) NOT NULL,
  "unit" "FeedUnit" NOT NULL,
  "dailyKg" DECIMAL(14,3) NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FeedRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedInventoryAdjustment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "FeedAdjustmentType" NOT NULL DEFAULT 'RECONCILIATION',
  "calculatedKg" DECIMAL(14,3) NOT NULL,
  "actualKg" DECIMAL(14,3) NOT NULL,
  "quantityDeltaKg" DECIMAL(14,3) NOT NULL,
  "operationDate" DATE NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FeedInventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- Preserve legacy semantics in explicit event deltas.
UPDATE "PoultryMovement"
SET "quantityDelta" = CASE
  WHEN "type" IN ('ADD', 'ADJUSTMENT') THEN "quantity"
  ELSE -"quantity"
END
WHERE "quantityDelta" IS NULL;

-- Preserve the exact legacy current quantity while making it reproducible from events.
INSERT INTO "PoultryMovement" ("id", "userId", "batchId", "type", "quantity", "quantityDelta", "operationDate", "reason", "comment", "createdAt", "deletedAt")
SELECT
  'legacy-reconcile-' || batch."id",
  batch."userId",
  batch."id",
  'ADJUSTMENT'::"PoultryMovementType",
  ABS(batch."currentQuantity" - (batch."startingQuantity" + COALESCE(events.delta, 0))),
  batch."currentQuantity" - (batch."startingQuantity" + COALESCE(events.delta, 0)),
  batch."startDate",
  'Миграционная сверка Poultry 1.0',
  'Автоматически создано для сохранения точного production-остатка',
  CURRENT_TIMESTAMP,
  batch."deletedAt"
FROM "PoultryBatch" batch
LEFT JOIN (
  SELECT "batchId", SUM("quantityDelta") AS delta
  FROM "PoultryMovement"
  WHERE "deletedAt" IS NULL
  GROUP BY "batchId"
) events ON events."batchId" = batch."id"
WHERE batch."currentQuantity" <> batch."startingQuantity" + COALESCE(events.delta, 0);

UPDATE "PoultryBatch"
SET "acquisitionDate" = "startDate"
WHERE "acquisitionDate" IS NULL;

UPDATE "FeedLot" lot
SET
  "purchaseQuantity" = lot."purchasedBags",
  "purchasedKg" = CASE WHEN product."bagSizeKg" IS NOT NULL THEN lot."purchasedBags" * product."bagSizeKg" ELSE NULL END,
  "availableKg" = CASE WHEN product."bagSizeKg" IS NOT NULL THEN lot."availableBags" * product."bagSizeKg" ELSE NULL END,
  "costPerKg" = CASE WHEN product."bagSizeKg" IS NOT NULL AND product."bagSizeKg" > 0 THEN lot."costPerBag" / product."bagSizeKg" ELSE NULL END
FROM "FeedProduct" product
WHERE product."id" = lot."productId";

UPDATE "FeedUsage" usage
SET
  "quantity" = usage."bags",
  "quantityKg" = CASE WHEN product."bagSizeKg" IS NOT NULL THEN usage."bags" * product."bagSizeKg" ELSE NULL END,
  "costAmount" = usage."bags" * lot."costPerBag"
FROM "FeedLot" lot, "FeedProduct" product
WHERE lot."id" = usage."lotId" AND product."id" = lot."productId";

UPDATE "PoultrySale" sale
SET "saleType" = CASE
  WHEN EXISTS (SELECT 1 FROM "PoultryMovement" movement WHERE movement."saleId" = sale."id" AND movement."deletedAt" IS NULL) THEN 'LIVE_BIRD'::"PoultrySaleType"
  ELSE 'OTHER'::"PoultrySaleType"
END;

ALTER TABLE "PoultrySale" ALTER COLUMN "saleType" SET DEFAULT 'LIVE_BIRD';
ALTER TABLE "FeedUsage" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "PoultryOperationalExpense" ALTER COLUMN "updatedAt" DROP DEFAULT;

UPDATE "PoultryOperationalExpense" expense
SET "deletedAt" = transaction."deletedAt"
FROM "Transaction" transaction
WHERE transaction."id" = expense."transactionId" AND transaction."deletedAt" IS NOT NULL;

-- One safe legacy origin and current balance per existing group.
INSERT INTO "PoultryOrigin" ("id", "userId", "type", "birdType", "originDate", "initialQuantity", "description", "updatedAt", "deletedAt")
SELECT
  'legacy-origin-' || batch."id",
  batch."userId",
  CASE batch."source"::text
    WHEN 'INCUBATION' THEN 'INCUBATION'::"PoultryOriginType"
    WHEN 'PURCHASE' THEN 'PURCHASE'::"PoultryOriginType"
    WHEN 'GIFT' THEN 'GIFT'::"PoultryOriginType"
    ELSE 'OTHER'::"PoultryOriginType"
  END,
  batch."birdType",
  batch."startDate",
  batch."startingQuantity",
  'Перенесено из Poultry 1.0',
  CURRENT_TIMESTAMP,
  batch."deletedAt"
FROM "PoultryBatch" batch;

INSERT INTO "PoultryOriginMovement" ("id", "originId", "batchId", "quantityDelta", "operationDate", "deletedAt")
SELECT
  'legacy-origin-balance-' || batch."id",
  'legacy-origin-' || batch."id",
  batch."id",
  batch."currentQuantity",
  batch."startDate",
  batch."deletedAt"
FROM "PoultryBatch" batch;

INSERT INTO "PoultryBatchBreed" ("id", "batchId", "name", "quantity", "updatedAt", "deletedAt")
SELECT
  'legacy-breed-' || batch."id",
  batch."id",
  COALESCE(NULLIF(batch."breed", ''), 'Неизвестно'),
  batch."currentQuantity",
  CURRENT_TIMESTAMP,
  batch."deletedAt"
FROM "PoultryBatch" batch;

CREATE UNIQUE INDEX "PoultryBatch_acquisitionTransactionId_key" ON "PoultryBatch"("acquisitionTransactionId");
CREATE UNIQUE INDEX "IncubationBatch_expenseTransactionId_key" ON "IncubationBatch"("expenseTransactionId");
CREATE UNIQUE INDEX "PoultrySale_slaughterId_key" ON "PoultrySale"("slaughterId");
CREATE UNIQUE INDEX "PoultrySlaughter_movementId_key" ON "PoultrySlaughter"("movementId");

CREATE INDEX "PoultryBatchBreed_batchId_deletedAt_idx" ON "PoultryBatchBreed"("batchId", "deletedAt");
CREATE INDEX "PoultryOrigin_userId_originDate_deletedAt_idx" ON "PoultryOrigin"("userId", "originDate", "deletedAt");
CREATE INDEX "PoultryOriginMovement_originId_batchId_deletedAt_idx" ON "PoultryOriginMovement"("originId", "batchId", "deletedAt");
CREATE INDEX "PoultryOriginMovement_movementId_idx" ON "PoultryOriginMovement"("movementId");
CREATE INDEX "PoultryTransfer_userId_operationDate_deletedAt_idx" ON "PoultryTransfer"("userId", "operationDate", "deletedAt");
CREATE INDEX "PoultryTransfer_sourceBatchId_destinationBatchId_idx" ON "PoultryTransfer"("sourceBatchId", "destinationBatchId");
CREATE INDEX "PoultryCostEntry_batchId_operationDate_deletedAt_idx" ON "PoultryCostEntry"("batchId", "operationDate", "deletedAt");
CREATE INDEX "PoultryCostEntry_referenceId_idx" ON "PoultryCostEntry"("referenceId");
CREATE INDEX "PoultrySlaughter_userId_operationDate_deletedAt_idx" ON "PoultrySlaughter"("userId", "operationDate", "deletedAt");
CREATE INDEX "PoultryEggCollection_userId_operationDate_deletedAt_idx" ON "PoultryEggCollection"("userId", "operationDate", "deletedAt");
CREATE INDEX "PoultryEggCollection_batchId_operationDate_idx" ON "PoultryEggCollection"("batchId", "operationDate");
CREATE INDEX "FeedRate_batchId_productId_effectiveFrom_deletedAt_idx" ON "FeedRate"("batchId", "productId", "effectiveFrom", "deletedAt");
CREATE INDEX "FeedInventoryAdjustment_userId_productId_operationDate_deletedAt_idx" ON "FeedInventoryAdjustment"("userId", "productId", "operationDate", "deletedAt");

ALTER TABLE "PoultryBatch" ADD CONSTRAINT "PoultryBatch_acquisitionTransactionId_fkey" FOREIGN KEY ("acquisitionTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoultryMovement" ADD CONSTRAINT "PoultryMovement_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "PoultryTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncubationBatch" ADD CONSTRAINT "IncubationBatch_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoultrySale" ADD CONSTRAINT "PoultrySale_slaughterId_fkey" FOREIGN KEY ("slaughterId") REFERENCES "PoultrySlaughter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PoultryOperationalExpense" ADD CONSTRAINT "PoultryOperationalExpense_incubationBatchId_fkey" FOREIGN KEY ("incubationBatchId") REFERENCES "IncubationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PoultryBatchBreed" ADD CONSTRAINT "PoultryBatchBreed_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOrigin" ADD CONSTRAINT "PoultryOrigin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOriginMovement" ADD CONSTRAINT "PoultryOriginMovement_originId_fkey" FOREIGN KEY ("originId") REFERENCES "PoultryOrigin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOriginMovement" ADD CONSTRAINT "PoultryOriginMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOriginMovement" ADD CONSTRAINT "PoultryOriginMovement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "PoultryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PoultryTransfer" ADD CONSTRAINT "PoultryTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryTransfer" ADD CONSTRAINT "PoultryTransfer_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "PoultryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoultryTransfer" ADD CONSTRAINT "PoultryTransfer_destinationBatchId_fkey" FOREIGN KEY ("destinationBatchId") REFERENCES "PoultryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoultryCostEntry" ADD CONSTRAINT "PoultryCostEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryCostEntry" ADD CONSTRAINT "PoultryCostEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultrySlaughter" ADD CONSTRAINT "PoultrySlaughter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultrySlaughter" ADD CONSTRAINT "PoultrySlaughter_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoultrySlaughter" ADD CONSTRAINT "PoultrySlaughter_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "PoultryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoultryEggCollection" ADD CONSTRAINT "PoultryEggCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryEggCollection" ADD CONSTRAINT "PoultryEggCollection_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeedRate" ADD CONSTRAINT "FeedRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedRate" ADD CONSTRAINT "FeedRate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedRate" ADD CONSTRAINT "FeedRate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FeedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedInventoryAdjustment" ADD CONSTRAINT "FeedInventoryAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedInventoryAdjustment" ADD CONSTRAINT "FeedInventoryAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FeedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
