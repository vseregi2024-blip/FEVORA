-- Goals were audited before this migration. There are no active Goal or
-- SavingsMovement records to carry forward; envelopes already hold the target
-- amount, target date and reserved balance.
ALTER TABLE "MoneyAccount" ADD COLUMN "icon" TEXT;
ALTER TABLE "MoneyAccount" ADD COLUMN "categoryId" TEXT;

CREATE INDEX "MoneyAccount_categoryId_idx" ON "MoneyAccount"("categoryId");
ALTER TABLE "MoneyAccount"
  ADD CONSTRAINT "MoneyAccount_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE "SavingsMovement";
DROP TABLE "SavingsGoal";
DROP TYPE "SavingsGoalStatus";
