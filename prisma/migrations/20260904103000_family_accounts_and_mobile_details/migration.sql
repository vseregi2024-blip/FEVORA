CREATE TABLE "FamilyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyAccount_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction" ADD COLUMN "familyAccountId" TEXT;
ALTER TABLE "RecurringPayment" ADD COLUMN "familyAccountId" TEXT;
ALTER TABLE "SavingsGoal" ADD COLUMN "targetDate" DATE;

CREATE UNIQUE INDEX "FamilyAccount_userId_name_key" ON "FamilyAccount"("userId", "name");
CREATE INDEX "FamilyAccount_userId_isArchived_sortOrder_idx" ON "FamilyAccount"("userId", "isArchived", "sortOrder");
CREATE INDEX "Transaction_familyAccountId_idx" ON "Transaction"("familyAccountId");
CREATE INDEX "RecurringPayment_familyAccountId_idx" ON "RecurringPayment"("familyAccountId");

ALTER TABLE "FamilyAccount" ADD CONSTRAINT "FamilyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringPayment" ADD CONSTRAINT "RecurringPayment_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
