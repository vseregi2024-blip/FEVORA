CREATE TYPE "PoultryBatchStatus" AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE "PoultryBatchSource" AS ENUM ('INCUBATION', 'PURCHASE', 'OTHER');
CREATE TYPE "PoultryMovementType" AS ENUM ('ADD', 'SALE', 'MORTALITY', 'FAMILY_USE', 'TRANSFER', 'ADJUSTMENT');
CREATE TYPE "IncubationStatus" AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE "FeedUsageType" AS ENUM ('ASSIGNED', 'FINISHED');

CREATE TABLE "PoultryBatch" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "name" TEXT NOT NULL, "birdType" TEXT NOT NULL,
  "breed" TEXT, "startDate" DATE NOT NULL, "startingQuantity" INTEGER NOT NULL, "currentQuantity" INTEGER NOT NULL,
  "source" "PoultryBatchSource" NOT NULL, "status" "PoultryBatchStatus" NOT NULL DEFAULT 'ACTIVE', "comment" TEXT,
  "incubationBatchId" TEXT, "incubationItemId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PoultryMovement" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "batchId" TEXT NOT NULL, "type" "PoultryMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL, "operationDate" DATE NOT NULL, "comment" TEXT, "saleId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultryMovement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IncubationBatch" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "name" TEXT NOT NULL, "setDate" DATE NOT NULL, "birdType" TEXT NOT NULL,
  "status" "IncubationStatus" NOT NULL DEFAULT 'ACTIVE', "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3), CONSTRAINT "IncubationBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IncubationBatchItem" (
  "id" TEXT NOT NULL, "incubationBatchId" TEXT NOT NULL, "breed" TEXT NOT NULL, "setQuantity" INTEGER NOT NULL,
  "infertileQuantity" INTEGER NOT NULL DEFAULT 0, "lossQuantity" INTEGER NOT NULL DEFAULT 0, "hatchedQuantity" INTEGER NOT NULL DEFAULT 0,
  "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IncubationBatchItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FeedProduct" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT, "bagSizeKg" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedProduct_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FeedLot" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "productId" TEXT NOT NULL, "purchaseTransactionId" TEXT NOT NULL,
  "purchasedBags" INTEGER NOT NULL, "availableBags" INTEGER NOT NULL, "costPerBag" DECIMAL(18,2) NOT NULL, "purchaseDate" DATE NOT NULL,
  "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FeedLot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FeedUsage" (
  "id" TEXT NOT NULL, "lotId" TEXT NOT NULL, "batchId" TEXT NOT NULL, "bags" INTEGER NOT NULL,
  "type" "FeedUsageType" NOT NULL DEFAULT 'ASSIGNED', "operationDate" DATE NOT NULL, "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FeedUsage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PoultrySale" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "batchId" TEXT, "buyer" TEXT, "itemName" TEXT NOT NULL,
  "quantity" INTEGER, "weightKg" DECIMAL(10,3), "price" DECIMAL(18,2), "totalAmount" DECIMAL(18,2) NOT NULL,
  "operationDate" DATE NOT NULL, "comment" TEXT, "incomeTransactionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PoultrySale_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PoultryOperationalExpense" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "transactionId" TEXT NOT NULL, "batchId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PoultryOperationalExpense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PoultryMovement_saleId_key" ON "PoultryMovement"("saleId");
CREATE UNIQUE INDEX "PoultryBatch_incubationItemId_key" ON "PoultryBatch"("incubationItemId");
CREATE UNIQUE INDEX "FeedProduct_userId_name_key" ON "FeedProduct"("userId", "name");
CREATE UNIQUE INDEX "FeedLot_purchaseTransactionId_key" ON "FeedLot"("purchaseTransactionId");
CREATE UNIQUE INDEX "PoultrySale_incomeTransactionId_key" ON "PoultrySale"("incomeTransactionId");
CREATE UNIQUE INDEX "PoultryOperationalExpense_transactionId_key" ON "PoultryOperationalExpense"("transactionId");
CREATE INDEX "PoultryBatch_userId_status_deletedAt_idx" ON "PoultryBatch"("userId", "status", "deletedAt");
CREATE INDEX "PoultryMovement_userId_batchId_operationDate_idx" ON "PoultryMovement"("userId", "batchId", "operationDate");
CREATE INDEX "IncubationBatch_userId_status_deletedAt_idx" ON "IncubationBatch"("userId", "status", "deletedAt");
CREATE INDEX "IncubationBatchItem_incubationBatchId_idx" ON "IncubationBatchItem"("incubationBatchId");
CREATE INDEX "FeedLot_userId_productId_deletedAt_idx" ON "FeedLot"("userId", "productId", "deletedAt");
CREATE INDEX "FeedUsage_lotId_batchId_idx" ON "FeedUsage"("lotId", "batchId");
CREATE INDEX "PoultrySale_userId_operationDate_deletedAt_idx" ON "PoultrySale"("userId", "operationDate", "deletedAt");

ALTER TABLE "PoultryBatch" ADD CONSTRAINT "PoultryBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryBatch" ADD CONSTRAINT "PoultryBatch_incubationBatchId_fkey" FOREIGN KEY ("incubationBatchId") REFERENCES "IncubationBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PoultryBatch" ADD CONSTRAINT "PoultryBatch_incubationItemId_fkey" FOREIGN KEY ("incubationItemId") REFERENCES "IncubationBatchItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PoultryMovement" ADD CONSTRAINT "PoultryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryMovement" ADD CONSTRAINT "PoultryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryMovement" ADD CONSTRAINT "PoultryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "PoultrySale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncubationBatch" ADD CONSTRAINT "IncubationBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncubationBatchItem" ADD CONSTRAINT "IncubationBatchItem_incubationBatchId_fkey" FOREIGN KEY ("incubationBatchId") REFERENCES "IncubationBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedProduct" ADD CONSTRAINT "FeedProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedLot" ADD CONSTRAINT "FeedLot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedLot" ADD CONSTRAINT "FeedLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FeedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedLot" ADD CONSTRAINT "FeedLot_purchaseTransactionId_fkey" FOREIGN KEY ("purchaseTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedUsage" ADD CONSTRAINT "FeedUsage_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "FeedLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedUsage" ADD CONSTRAINT "FeedUsage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultrySale" ADD CONSTRAINT "PoultrySale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultrySale" ADD CONSTRAINT "PoultrySale_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PoultrySale" ADD CONSTRAINT "PoultrySale_incomeTransactionId_fkey" FOREIGN KEY ("incomeTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOperationalExpense" ADD CONSTRAINT "PoultryOperationalExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOperationalExpense" ADD CONSTRAINT "PoultryOperationalExpense_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoultryOperationalExpense" ADD CONSTRAINT "PoultryOperationalExpense_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PoultryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
