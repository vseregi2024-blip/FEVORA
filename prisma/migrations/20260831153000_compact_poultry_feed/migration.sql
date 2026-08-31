ALTER TABLE "FeedLot"
  ADD COLUMN "deliveryAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "supplier" TEXT;

ALTER TABLE "FeedProduct"
  ADD COLUMN "minimumStockKg" DECIMAL(14,3) NOT NULL DEFAULT 25;

ALTER TABLE "FeedUsage" DROP CONSTRAINT "FeedUsage_batchId_fkey";
ALTER TABLE "FeedUsage" ALTER COLUMN "batchId" DROP NOT NULL;
ALTER TABLE "FeedUsage"
  ADD CONSTRAINT "FeedUsage_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- These rows were a one-time technical placeholder created during the history
-- import when no physical feed balance had been supplied. They are not a real
-- inventory count and incorrectly cancel every historic purchase. Preserve the
-- audit trail through soft deletion and let stock be rebuilt from operations.
UPDATE "FeedInventoryAdjustment"
SET "deletedAt" = NOW()
WHERE "deletedAt" IS NULL
  AND "operationDate" = DATE '2026-08-31'
  AND "actualKg" = 0
  AND "comment" LIKE '%[FEVORA-HISTORY-2026-08-31:FEED-ZERO]%';
