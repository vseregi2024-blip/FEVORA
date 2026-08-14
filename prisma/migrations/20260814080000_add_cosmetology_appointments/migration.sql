-- Preserve already completed visits while allowing new planned appointments.
CREATE TYPE "CosmetologyVisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "CosmetologyClient" ADD COLUMN "displayName" TEXT;
UPDATE "CosmetologyClient" SET "displayName" = trim(concat_ws(' ', "lastName", "firstName")) WHERE "displayName" IS NULL;
ALTER TABLE "CosmetologyVisit" ADD COLUMN "status" "CosmetologyVisitStatus" NOT NULL DEFAULT 'COMPLETED', ADD COLUMN "scheduledTime" TEXT;
ALTER TABLE "CosmetologyVisit" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
ALTER TABLE "CosmetologyVisit" ALTER COLUMN "incomeTransactionId" DROP NOT NULL;
CREATE INDEX "CosmetologyVisit_userId_status_operationDate_deletedAt_idx" ON "CosmetologyVisit"("userId", "status", "operationDate", "deletedAt");
