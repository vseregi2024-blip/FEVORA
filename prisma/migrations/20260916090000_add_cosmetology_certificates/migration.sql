ALTER TYPE "CosmetologyPaymentMethod" ADD VALUE IF NOT EXISTS 'CERTIFICATE';

CREATE TYPE "CosmetologyCertificateStatus" AS ENUM ('ACTIVE', 'FULLY_USED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "CosmetologyCertificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "certificateNumber" TEXT NOT NULL,
    "initialAmount" DECIMAL(18,2) NOT NULL,
    "remainingAmount" DECIMAL(18,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UAH',
    "status" "CosmetologyCertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATE,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CosmetologyCertificate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CosmetologyPaymentComponent" ADD COLUMN "certificateId" TEXT;

CREATE UNIQUE INDEX "CosmetologyCertificate_userId_certificateNumber_key" ON "CosmetologyCertificate"("userId", "certificateNumber");
CREATE INDEX "CosmetologyCertificate_userId_status_expiresAt_idx" ON "CosmetologyCertificate"("userId", "status", "expiresAt");
CREATE INDEX "CosmetologyCertificate_userId_clientId_idx" ON "CosmetologyCertificate"("userId", "clientId");
CREATE INDEX "CosmetologyPaymentComponent_certificateId_idx" ON "CosmetologyPaymentComponent"("certificateId");

ALTER TABLE "CosmetologyCertificate" ADD CONSTRAINT "CosmetologyCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyCertificate" ADD CONSTRAINT "CosmetologyCertificate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CosmetologyClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CosmetologyPaymentComponent" ADD CONSTRAINT "CosmetologyPaymentComponent_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "CosmetologyCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
