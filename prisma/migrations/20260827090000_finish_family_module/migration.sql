ALTER TABLE "Receipt" ADD COLUMN "totalAmount" DECIMAL(18,2);

UPDATE "Receipt" AS receipt
SET "totalAmount" = COALESCE((
  SELECT SUM(transaction."amount")
  FROM "Transaction" AS transaction
  WHERE transaction."receiptId" = receipt."id"
    AND transaction."deletedAt" IS NULL
), 0);

ALTER TABLE "Receipt" ALTER COLUMN "totalAmount" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "totalAmount" SET DEFAULT 0;

ALTER TABLE "RecurringPayment" ADD COLUMN "endDate" DATE;
ALTER TABLE "RecurringPayment" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "RecurringPayment_userId_archivedAt_idx" ON "RecurringPayment"("userId", "archivedAt");

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "recurringPaymentId", "operationDate"
    ORDER BY "createdAt", "id"
  ) AS position
  FROM "Transaction"
  WHERE "recurringPaymentId" IS NOT NULL
)
UPDATE "Transaction"
SET "deletedAt" = COALESCE("deletedAt", CURRENT_TIMESTAMP)
WHERE "id" IN (SELECT "id" FROM ranked WHERE position > 1);

CREATE UNIQUE INDEX "Transaction_recurringPaymentId_operationDate_key"
ON "Transaction"("recurringPaymentId", "operationDate");

UPDATE "Category" SET "name" = 'Продукты', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Продукти';
UPDATE "Category" SET "name" = 'Дом', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Дім';
UPDATE "Category" SET "name" = 'Дети', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Діти';
UPDATE "Category" SET "name" = 'Здоровье / лечение', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Лікування';
UPDATE "Category" SET "name" = 'Одежда', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Одяг';
UPDATE "Category" SET "name" = 'Развлечения', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Розваги';
UPDATE "Category" SET "name" = 'Путешествия', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Подорожі';
UPDATE "Category" SET "name" = 'Обязательные платежи', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Обов''язкові платежі';
UPDATE "Category" SET "name" = 'Другое', "isArchived" = false WHERE "module" = 'FAMILY' AND "name" = 'Інше';
UPDATE "Category" SET "name" = 'Автомобиль' WHERE "module" = 'FAMILY' AND "name" = 'Автомобіль';
UPDATE "Category" SET "name" = 'Подарки' WHERE "module" = 'FAMILY' AND "name" = 'Подарунки';
UPDATE "Category" SET "name" = 'Развлечения и путешествия' WHERE "module" = 'FAMILY' AND "name" = 'Розваги та подорожі';
UPDATE "Category" SET "name" = 'Прочее' WHERE "module" = 'FAMILY' AND "name" = 'Проче';
