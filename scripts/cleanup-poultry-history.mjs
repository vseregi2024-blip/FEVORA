import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const batches = await prisma.poultryBatch.findMany({
    where: { deletedAt: null, OR: [{ comment: { contains: "FEVORA-HISTORY-2026-08-31:P-005" } }, { comment: { contains: "FEVORA-HISTORY-2026-08-31:P-006" } }] },
    select: { id: true, name: true, breeds: { where: { deletedAt: null }, select: { id: true, name: true, quantity: true } } },
  });
  const removable = batches.flatMap((batch) => batch.breeds.filter((breed) => !breed.id.startsWith("hist-breed-")).map((breed) => ({ ...breed, batchId: batch.id, batchName: batch.name })));
  const legacyPkLots = await prisma.feedLot.findMany({
    where: { deletedAt: null, product: { name: "ПК3-4" }, purchaseDate: new Date("2026-08-09T00:00:00.000Z") },
    select: { id: true, purchaseTransactionId: true, usages: { where: { deletedAt: null }, select: { id: true } } },
  });
  const [adultLayers, youngLayers, ksmLot] = await Promise.all([
    prisma.poultryBatch.findFirst({ where: { deletedAt: null, comment: { contains: "FEVORA-HISTORY-2026-08-31:P-001" } }, select: { id: true } }),
    prisma.poultryBatch.findFirst({ where: { deletedAt: null, comment: { contains: "FEVORA-HISTORY-2026-08-31:P-002" } }, select: { id: true } }),
    prisma.feedLot.findFirst({ where: { deletedAt: null, comment: { contains: "FEVORA-HISTORY-2026-08-31:F-0809-KSM" } }, select: { id: true, usages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, batchId: true } } } }),
  ]);
  if (APPLY) {
    await prisma.$transaction(async (db) => {
      if (removable.length) await db.poultryBatchBreed.updateMany({ where: { id: { in: removable.map((item) => item.id) } }, data: { deletedAt: new Date() } });
      for (const lot of legacyPkLots) {
        if (lot.usages.length) await db.feedUsage.updateMany({ where: { id: { in: lot.usages.map((item) => item.id) } }, data: { deletedAt: new Date() } });
        await db.feedLot.update({ where: { id: lot.id }, data: { deletedAt: new Date(), availableBags: 0, availableKg: 0 } });
        await db.transaction.update({ where: { id: lot.purchaseTransactionId }, data: { deletedAt: new Date() } });
      }
      if (ksmLot && adultLayers && youngLayers) {
        if (ksmLot.usages[0]) await db.feedUsage.update({ where: { id: ksmLot.usages[0].id }, data: { batchId: adultLayers.id, comment: "[FEVORA-HISTORY-2026-08-31:KSM-P001] 25 кг взрослым несушкам" } });
        if (ksmLot.usages[1]) await db.feedUsage.update({ where: { id: ksmLot.usages[1].id }, data: { batchId: youngLayers.id, comment: "[FEVORA-HISTORY-2026-08-31:KSM-P002] 25 кг молодым несушкам" } });
      }
    });
  }
  console.log(JSON.stringify({
    mode: APPLY ? "APPLIED" : "DRY_RUN",
    removableBreeds: removable.map(({ batchName, name, quantity }) => ({ batchName, name, quantity })),
    legacyPkLots: legacyPkLots.length,
    ksmUsagesToRelink: ksmLot?.usages.length ?? 0,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
