-- Envelope presentation metadata.
--
-- SavingsGoal and SavingsMovement are intentionally preserved as legacy tables.
-- Their records require a separate, audited migration to envelopes; this release
-- must never delete, merge or invent user reserves automatically.

ALTER TABLE "MoneyAccount" ADD COLUMN "icon" TEXT;
ALTER TABLE "MoneyAccount" ADD COLUMN "categoryId" TEXT;

CREATE INDEX "MoneyAccount_categoryId_idx" ON "MoneyAccount"("categoryId");

ALTER TABLE "MoneyAccount"
  ADD CONSTRAINT "MoneyAccount_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
