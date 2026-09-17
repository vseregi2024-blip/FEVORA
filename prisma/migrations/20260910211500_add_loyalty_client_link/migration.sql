ALTER TABLE "CosmetologyClient"
ADD COLUMN "loyaltyClientId" TEXT;

CREATE UNIQUE INDEX "CosmetologyClient_loyaltyClientId_key"
ON "CosmetologyClient"("loyaltyClientId");
