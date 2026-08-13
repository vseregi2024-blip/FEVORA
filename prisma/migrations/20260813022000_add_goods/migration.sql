-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('PIECE', 'PACKAGE', 'JAR', 'BOTTLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductInventoryMovementType" AS ENUM ('PURCHASE', 'SALE', 'WRITE_OFF', 'ADJUSTMENT');

-- AlterEnum
ALTER TYPE "FinanceModule" ADD VALUE 'GOODS';

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "brand" TEXT,
    "unit" "ProductUnit" NOT NULL DEFAULT 'PIECE',
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPurchasePrice" DECIMAL(18,2) NOT NULL,
    "deliveryAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deliveryInCost" BOOLEAN NOT NULL DEFAULT false,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "supplier" TEXT,
    "operationDate" DATE NOT NULL,
    "comment" TEXT,
    "expenseTransactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInventoryLot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "adjustmentMovementId" TEXT,
    "initialQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "receivedDate" DATE NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductInventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitSalePrice" DECIMAL(18,2) NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "costOfGoods" DECIMAL(18,2) NOT NULL,
    "profitAmount" DECIMAL(18,2) NOT NULL,
    "buyer" TEXT,
    "operationDate" DATE NOT NULL,
    "comment" TEXT,
    "incomeTransactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInventoryMovement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ProductInventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "operationDate" DATE NOT NULL,
    "comment" TEXT,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductInventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInventoryAllocation" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "saleId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(18,2) NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductInventoryAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsOperationalExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsOperationalExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCategory_isArchived_sortOrder_idx" ON "ProductCategory"("isArchived", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_userId_name_key" ON "ProductCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "Product_userId_status_deletedAt_idx" ON "Product"("userId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_userId_name_key" ON "Product"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPurchase_expenseTransactionId_key" ON "ProductPurchase"("expenseTransactionId");

-- CreateIndex
CREATE INDEX "ProductPurchase_userId_productId_operationDate_deletedAt_idx" ON "ProductPurchase"("userId", "productId", "operationDate", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventoryLot_purchaseId_key" ON "ProductInventoryLot"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventoryLot_adjustmentMovementId_key" ON "ProductInventoryLot"("adjustmentMovementId");

-- CreateIndex
CREATE INDEX "ProductInventoryLot_userId_productId_receivedDate_deletedAt_idx" ON "ProductInventoryLot"("userId", "productId", "receivedDate", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSale_incomeTransactionId_key" ON "ProductSale"("incomeTransactionId");

-- CreateIndex
CREATE INDEX "ProductSale_userId_productId_operationDate_deletedAt_idx" ON "ProductSale"("userId", "productId", "operationDate", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventoryMovement_purchaseId_key" ON "ProductInventoryMovement"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventoryMovement_saleId_key" ON "ProductInventoryMovement"("saleId");

-- CreateIndex
CREATE INDEX "ProductInventoryMovement_userId_productId_operationDate_del_idx" ON "ProductInventoryMovement"("userId", "productId", "operationDate", "deletedAt");

-- CreateIndex
CREATE INDEX "ProductInventoryAllocation_lotId_deletedAt_idx" ON "ProductInventoryAllocation"("lotId", "deletedAt");

-- CreateIndex
CREATE INDEX "ProductInventoryAllocation_movementId_deletedAt_idx" ON "ProductInventoryAllocation"("movementId", "deletedAt");

-- CreateIndex
CREATE INDEX "ProductInventoryAllocation_saleId_deletedAt_idx" ON "ProductInventoryAllocation"("saleId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsOperationalExpense_transactionId_key" ON "GoodsOperationalExpense"("transactionId");

CREATE UNIQUE INDEX "GoodsOperationalExpense_purchaseId_key" ON "GoodsOperationalExpense"("purchaseId");

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryLot" ADD CONSTRAINT "ProductInventoryLot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryLot" ADD CONSTRAINT "ProductInventoryLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryLot" ADD CONSTRAINT "ProductInventoryLot_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ProductPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryLot" ADD CONSTRAINT "ProductInventoryLot_adjustmentMovementId_fkey" FOREIGN KEY ("adjustmentMovementId") REFERENCES "ProductInventoryMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSale" ADD CONSTRAINT "ProductSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSale" ADD CONSTRAINT "ProductSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSale" ADD CONSTRAINT "ProductSale_incomeTransactionId_fkey" FOREIGN KEY ("incomeTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryMovement" ADD CONSTRAINT "ProductInventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryMovement" ADD CONSTRAINT "ProductInventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryMovement" ADD CONSTRAINT "ProductInventoryMovement_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ProductPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryMovement" ADD CONSTRAINT "ProductInventoryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "ProductSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryAllocation" ADD CONSTRAINT "ProductInventoryAllocation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ProductInventoryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryAllocation" ADD CONSTRAINT "ProductInventoryAllocation_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "ProductInventoryMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventoryAllocation" ADD CONSTRAINT "ProductInventoryAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "ProductSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsOperationalExpense" ADD CONSTRAINT "GoodsOperationalExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsOperationalExpense" ADD CONSTRAINT "GoodsOperationalExpense_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoodsOperationalExpense" ADD CONSTRAINT "GoodsOperationalExpense_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ProductPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
