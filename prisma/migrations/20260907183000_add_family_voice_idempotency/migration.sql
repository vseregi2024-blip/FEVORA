ALTER TABLE "Transaction" ADD COLUMN "voiceRequestId" TEXT;

CREATE UNIQUE INDEX "Transaction_userId_voiceRequestId_key"
ON "Transaction"("userId", "voiceRequestId");
