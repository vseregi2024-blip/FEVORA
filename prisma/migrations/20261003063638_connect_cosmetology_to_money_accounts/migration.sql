-- Connect new universal-money operations to their one physical Wallet.
--
-- This migration is deliberately additive. Existing Family, Poultry,
-- Cosmetology and legacy-wallet data is retained unchanged. Historical
-- Transaction rows may remain without moneyAccountId until they are audited.

ALTER TABLE "Transaction" ADD COLUMN "moneyAccountId" TEXT;
ALTER TABLE "MoneyLedgerEntry" ADD COLUMN "transactionId" TEXT;

CREATE INDEX "Transaction_moneyAccountId_idx" ON "Transaction"("moneyAccountId");
CREATE INDEX "MoneyLedgerEntry_transactionId_idx" ON "MoneyLedgerEntry"("transactionId");

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_moneyAccountId_fkey"
  FOREIGN KEY ("moneyAccountId") REFERENCES "MoneyAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MoneyLedgerEntry"
  ADD CONSTRAINT "MoneyLedgerEntry_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
