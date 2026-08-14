CREATE TABLE "CosmetologyVisitService" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CosmetologyVisitService_pkey" PRIMARY KEY ("id")
);

INSERT INTO "CosmetologyVisitService" ("id", "visitId", "templateId", "name", "price", "durationMinutes", "sortOrder", "createdAt", "updatedAt")
SELECT CONCAT('legacy_', "id"), "id", "procedureTemplateId", "procedureName", COALESCE("plannedAmount", 0), "durationMinutes", 0, "createdAt", "updatedAt"
FROM "CosmetologyVisit";

CREATE INDEX "CosmetologyVisitService_visitId_sortOrder_idx" ON "CosmetologyVisitService"("visitId", "sortOrder");

ALTER TABLE "CosmetologyVisitService" ADD CONSTRAINT "CosmetologyVisitService_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CosmetologyVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmetologyVisitService" ADD CONSTRAINT "CosmetologyVisitService_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CosmetologyProcedureTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
