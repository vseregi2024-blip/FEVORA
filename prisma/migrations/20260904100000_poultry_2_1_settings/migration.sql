CREATE TABLE "PoultryBreed" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PoultryBreed_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PoultryEggCollection" ADD COLUMN "collector" TEXT;
ALTER TABLE "FeedUsage" ADD COLUMN "purpose" TEXT;

CREATE UNIQUE INDEX "PoultryBreed_userId_name_key" ON "PoultryBreed"("userId", "name");
CREATE INDEX "PoultryBreed_userId_isArchived_sortOrder_idx" ON "PoultryBreed"("userId", "isArchived", "sortOrder");
ALTER TABLE "PoultryBreed" ADD CONSTRAINT "PoultryBreed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH source_breeds AS (
  SELECT b."userId", trim(regexp_replace(pb."name", '\s+', ' ', 'g')) AS "name"
  FROM "PoultryBatchBreed" pb
  JOIN "PoultryBatch" b ON b."id" = pb."batchId"
  WHERE pb."deletedAt" IS NULL AND b."deletedAt" IS NULL AND trim(pb."name") <> ''
  UNION ALL
  SELECT b."userId", trim(regexp_replace(b."breed", '\s+', ' ', 'g')) AS "name"
  FROM "PoultryBatch" b
  WHERE b."deletedAt" IS NULL AND b."breed" IS NOT NULL AND trim(b."breed") <> ''
), unique_breeds AS (
  SELECT DISTINCT ON ("userId", lower("name")) "userId", "name"
  FROM source_breeds
  ORDER BY "userId", lower("name"), "name"
)
INSERT INTO "PoultryBreed" ("id", "userId", "name", "sortOrder", "updatedAt")
SELECT
  'breed-' || md5("userId" || lower("name")),
  "userId",
  "name",
  row_number() OVER (PARTITION BY "userId" ORDER BY "name") * 10,
  CURRENT_TIMESTAMP
FROM unique_breeds
ON CONFLICT ("userId", "name") DO NOTHING;
