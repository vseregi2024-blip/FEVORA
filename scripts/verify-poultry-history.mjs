import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TAG = "FEVORA-HISTORY-2026-08-31";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length !== 1) throw new Error(`Ожидался один пользователь, найдено ${users.length}`);
  const userId = users[0].id;
  const [batches, incubations, sales, lots, products] = await Promise.all([
    prisma.poultryBatch.findMany({ where: { userId, deletedAt: null, comment: { contains: TAG } }, orderBy: { name: "asc" }, select: { name: true, currentQuantity: true, startingQuantity: true, status: true, source: true } }),
    prisma.incubationBatch.findMany({ where: { userId, deletedAt: null, comment: { contains: TAG } }, orderBy: { setDate: "asc" }, select: { name: true, setDate: true, hatchDate: true, cashCost: true, items: { where: { deletedAt: null }, select: { breed: true, setQuantity: true, hatchedQuantity: true } } } }),
    prisma.poultrySale.findMany({ where: { userId, deletedAt: null, comment: { contains: TAG } }, select: { totalAmount: true, saleType: true } }),
    prisma.feedLot.findMany({ where: { userId, deletedAt: null, comment: { contains: TAG } }, select: { productId: true } }),
    prisma.feedProduct.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);
  const touched = new Set(lots.map((item) => item.productId));
  const feed = [];
  for (const product of products.filter((item) => touched.has(item.id))) {
    const [purchased, used, adjusted] = await Promise.all([
      prisma.feedLot.aggregate({ where: { userId, productId: product.id, deletedAt: null, purchaseTransaction: { deletedAt: null } }, _sum: { purchasedKg: true } }),
      prisma.feedUsage.aggregate({ where: { lot: { userId, productId: product.id }, deletedAt: null }, _sum: { quantityKg: true } }),
      prisma.feedInventoryAdjustment.aggregate({ where: { userId, productId: product.id, deletedAt: null }, _sum: { quantityDeltaKg: true } }),
    ]);
    const currentKg = Number(purchased._sum.purchasedKg ?? 0) - Number(used._sum.quantityKg ?? 0) + Number(adjusted._sum.quantityDeltaKg ?? 0);
    feed.push({ name: product.name, currentKg: Math.round(currentKg * 1000) / 1000 });
  }
  const activeTotal = batches.filter((item) => item.status === "ACTIVE").reduce((sum, item) => sum + item.currentQuantity, 0);
  const saleIncome = sales.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const duplicateIds = await prisma.$queryRaw`SELECT id, COUNT(*)::int AS count FROM "PoultryBatch" WHERE comment LIKE ${`%${TAG}%`} GROUP BY id HAVING COUNT(*) > 1`;
  console.log(JSON.stringify({
    importTag: TAG,
    batches,
    activeTotalBeforeManualSale: activeTotal,
    expectedAfterManualSale: activeTotal - 1,
    incubations: incubations.map((item) => ({ ...item, cashCost: Number(item.cashCost), setTotal: item.items.reduce((sum, row) => sum + row.setQuantity, 0), hatchedTotal: item.items.reduce((sum, row) => sum + row.hatchedQuantity, 0) })),
    taggedSales: sales.length,
    taggedSaleIncome: saleIncome,
    feedProducts: feed.length,
    nonZeroFeedBalances: feed.filter((item) => Math.abs(item.currentKg) > 0.0001),
    duplicateBatchIds: duplicateIds.length,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
