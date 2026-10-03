/*
  Warnings:

  - You are about to drop the column `purpose` on the `FeedUsage` table. All the data in the column will be lost.
  - You are about to drop the column `collector` on the `PoultryEggCollection` table. All the data in the column will be lost.
  - You are about to drop the `PoultryBreed` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CosmetologyClient" DROP CONSTRAINT "CosmetologyClient_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyClient" DROP CONSTRAINT "CosmetologyClient_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyClientPhoto" DROP CONSTRAINT "CosmetologyClientPhoto_clientId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyExpense" DROP CONSTRAINT "CosmetologyExpense_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyExpense" DROP CONSTRAINT "CosmetologyExpense_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyExpense" DROP CONSTRAINT "CosmetologyExpense_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyExpenseCategory" DROP CONSTRAINT "CosmetologyExpenseCategory_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryItem" DROP CONSTRAINT "CosmetologyInventoryItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryLot" DROP CONSTRAINT "CosmetologyInventoryLot_expenseTransactionId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryLot" DROP CONSTRAINT "CosmetologyInventoryLot_itemId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryLot" DROP CONSTRAINT "CosmetologyInventoryLot_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryMovement" DROP CONSTRAINT "CosmetologyInventoryMovement_itemId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryMovement" DROP CONSTRAINT "CosmetologyInventoryMovement_lotId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryMovement" DROP CONSTRAINT "CosmetologyInventoryMovement_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyInventoryMovement" DROP CONSTRAINT "CosmetologyInventoryMovement_visitId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyProcedureMaterialTemplate" DROP CONSTRAINT "CosmetologyProcedureMaterialTemplate_itemId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyProcedureMaterialTemplate" DROP CONSTRAINT "CosmetologyProcedureMaterialTemplate_templateId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyProcedureMaterialUsage" DROP CONSTRAINT "CosmetologyProcedureMaterialUsage_itemId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyProcedureMaterialUsage" DROP CONSTRAINT "CosmetologyProcedureMaterialUsage_lotId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyProcedureMaterialUsage" DROP CONSTRAINT "CosmetologyProcedureMaterialUsage_visitId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyProcedureTemplate" DROP CONSTRAINT "CosmetologyProcedureTemplate_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyTreatmentPlanItem" DROP CONSTRAINT "CosmetologyTreatmentPlanItem_clientId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyVisit" DROP CONSTRAINT "CosmetologyVisit_clientId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyVisit" DROP CONSTRAINT "CosmetologyVisit_incomeTransactionId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyVisit" DROP CONSTRAINT "CosmetologyVisit_procedureTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyVisit" DROP CONSTRAINT "CosmetologyVisit_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyWalletMovement" DROP CONSTRAINT "CosmetologyWalletMovement_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyWalletMovement" DROP CONSTRAINT "CosmetologyWalletMovement_userId_fkey";

-- DropForeignKey
ALTER TABLE "CosmetologyWalletMovement" DROP CONSTRAINT "CosmetologyWalletMovement_visitId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsOperationalExpense" DROP CONSTRAINT "GoodsOperationalExpense_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "PoultryBreed" DROP CONSTRAINT "PoultryBreed_userId_fkey";

-- DropIndex
DROP INDEX "MoneyAccount_categoryId_idx";

-- AlterTable
ALTER TABLE "FeedUsage" DROP COLUMN "purpose";

-- AlterTable
ALTER TABLE "MoneyLedgerEntry" ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "PoultryEggCollection" DROP COLUMN "collector";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "moneyAccountId" TEXT;

-- DropTable
DROP TABLE "PoultryBreed";

-- CreateIndex
CREATE INDEX "CosmetologyClientPhoto_userId_clientId_deletedAt_idx" ON "CosmetologyClientPhoto"("userId", "clientId", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyExpense_userId_categoryId_deletedAt_idx" ON "CosmetologyExpense"("userId", "categoryId", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyExpenseCategory_userId_isArchived_sortOrder_idx" ON "CosmetologyExpenseCategory"("userId", "isArchived", "sortOrder");

-- CreateIndex
CREATE INDEX "CosmetologyInventoryItem_userId_category_deletedAt_idx" ON "CosmetologyInventoryItem"("userId", "category", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyInventoryMovement_userId_itemId_operationDate_de_idx" ON "CosmetologyInventoryMovement"("userId", "itemId", "operationDate", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyProcedureMaterialUsage_visitId_deletedAt_idx" ON "CosmetologyProcedureMaterialUsage"("visitId", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyProcedureMaterialUsage_itemId_deletedAt_idx" ON "CosmetologyProcedureMaterialUsage"("itemId", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyProcedureTemplate_userId_isArchived_deletedAt_idx" ON "CosmetologyProcedureTemplate"("userId", "isArchived", "deletedAt");

-- CreateIndex
CREATE INDEX "CosmetologyTreatmentPlanItem_userId_clientId_status_deleted_idx" ON "CosmetologyTreatmentPlanItem"("userId", "clientId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "MoneyLedgerEntry_transactionId_idx" ON "MoneyLedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "Transaction_moneyAccountId_idx" ON "Transaction"("moneyAccountId");

-- AddForeignKey
ALTER TABLE "MoneyLedgerEntry" ADD CONSTRAINT "MoneyLedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_moneyAccountId_fkey" FOREIGN KEY ("moneyAccountId") REFERENCES "MoneyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsOperationalExpense" ADD CONSTRAINT "GoodsOperationalExpense_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ProductPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyClient" ADD CONSTRAINT "CosmetologyClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyClient" ADD CONSTRAINT "CosmetologyClient_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "CosmetologyClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyClientPhoto" ADD CONSTRAINT "CosmetologyClientPhoto_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CosmetologyClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyProcedureTemplate" ADD CONSTRAINT "CosmetologyProcedureTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyProcedureMaterialTemplate" ADD CONSTRAINT "CosmetologyProcedureMaterialTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CosmetologyProcedureTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyProcedureMaterialTemplate" ADD CONSTRAINT "CosmetologyProcedureMaterialTemplate_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmetologyInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryItem" ADD CONSTRAINT "CosmetologyInventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryLot" ADD CONSTRAINT "CosmetologyInventoryLot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryLot" ADD CONSTRAINT "CosmetologyInventoryLot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmetologyInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryLot" ADD CONSTRAINT "CosmetologyInventoryLot_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryMovement" ADD CONSTRAINT "CosmetologyInventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryMovement" ADD CONSTRAINT "CosmetologyInventoryMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmetologyInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryMovement" ADD CONSTRAINT "CosmetologyInventoryMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CosmetologyInventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyInventoryMovement" ADD CONSTRAINT "CosmetologyInventoryMovement_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyVisit" ADD CONSTRAINT "CosmetologyVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyVisit" ADD CONSTRAINT "CosmetologyVisit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CosmetologyClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyVisit" ADD CONSTRAINT "CosmetologyVisit_procedureTemplateId_fkey" FOREIGN KEY ("procedureTemplateId") REFERENCES "CosmetologyProcedureTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyVisit" ADD CONSTRAINT "CosmetologyVisit_incomeTransactionId_fkey" FOREIGN KEY ("incomeTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyWalletMovement" ADD CONSTRAINT "CosmetologyWalletMovement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyProcedureMaterialUsage" ADD CONSTRAINT "CosmetologyProcedureMaterialUsage_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyProcedureMaterialUsage" ADD CONSTRAINT "CosmetologyProcedureMaterialUsage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CosmetologyInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyProcedureMaterialUsage" ADD CONSTRAINT "CosmetologyProcedureMaterialUsage_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CosmetologyInventoryLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyExpenseCategory" ADD CONSTRAINT "CosmetologyExpenseCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyExpense" ADD CONSTRAINT "CosmetologyExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyExpense" ADD CONSTRAINT "CosmetologyExpense_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyExpense" ADD CONSTRAINT "CosmetologyExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CosmetologyExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmetologyTreatmentPlanItem" ADD CONSTRAINT "CosmetologyTreatmentPlanItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CosmetologyClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "CosmetologyInventoryLot_userId_itemId_purchaseDate_deletedAt_id" RENAME TO "CosmetologyInventoryLot_userId_itemId_purchaseDate_deletedA_idx";

-- RenameIndex
ALTER INDEX "CosmetologyPaymentComponent_paymentId_operationDate_createdAt_i" RENAME TO "CosmetologyPaymentComponent_paymentId_operationDate_created_idx";

-- RenameIndex
ALTER INDEX "CosmetologyWalletMovement_userId_wallet_operationDate_deletedAt" RENAME TO "CosmetologyWalletMovement_userId_wallet_operationDate_delet_idx";

-- RenameIndex
ALTER INDEX "FeedInventoryAdjustment_userId_productId_operationDate_deletedA" RENAME TO "FeedInventoryAdjustment_userId_productId_operationDate_dele_idx";
