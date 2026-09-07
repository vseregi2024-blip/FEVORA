import { FinanceModule, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const normalizedName = (name: string) =>
  name
    .trim()
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKC")
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");

async function main() {
  const [categories, orphanOperations] = await Promise.all([
    prisma.category.findMany({
      where: { module: FinanceModule.FAMILY },
      select: {
        id: true,
        userId: true,
        name: true,
        icon: true,
        kind: true,
        isArchived: true,
        _count: { select: { transactions: true, recurringPayments: true } },
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { module: FinanceModule.FAMILY, categoryId: null, deletedAt: null },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const groups = new Map<string, typeof categories>();
  for (const category of categories) {
    const key = `${category.userId ?? "GLOBAL"}:${normalizedName(category.name)}`;
    groups.set(key, [...(groups.get(key) ?? []), category]);
  }

  const exactDuplicates = [...groups.values()].filter((items) => items.length > 1);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "READ_ONLY",
    totals: {
      categories: categories.length,
      active: categories.filter((item) => !item.isArchived).length,
      archived: categories.filter((item) => item.isArchived).length,
      global: categories.filter((item) => item.userId === null).length,
      exactDuplicateGroups: exactDuplicates.length,
      uncategorizedOperations: orphanOperations.reduce((sum, item) => sum + item._count._all, 0),
    },
    exactDuplicates,
    categories,
    uncategorizedOperations: orphanOperations.map((item) => ({
      userId: item.userId,
      count: item._count._all,
      amount: item._sum.amount?.toString() ?? "0.00",
    })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
