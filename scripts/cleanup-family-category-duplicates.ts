import { FinanceModule, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const duplicateTargets = [
  { id: "cmsozqqfv0005mp3cvlta531v", name: "Здоров'я", keep: "Здоровье / лечение" },
  { id: "cmth8mcq3000cpa3c34aslm9d", name: "Інше", keep: "Прочее" },
  { id: "cmspstidk0002s13cx4wnb52l", name: "Інший дохід", keep: "Другой доход" },
  { id: "cmth8mcpw000bpa3ccqndivmo", name: "Обов'язкові платежі", keep: "Обязательные платежи" },
  { id: "cmth8mcoi0007pa3ccwoy5jlf", name: "Одяг", keep: "Одежда" },
  { id: "cmth8mcpo000apa3cr0fi0d2b", name: "Подорожі", keep: "Путешествия" },
  { id: "cmspstif30006s13cwu7nc2u6", name: "Развлечения и путешествия", keep: "Путешествия / Развлечения" },
  { id: "cmth8mcoa0006pa3cnn7owywt", name: "Розваги та подорожі", keep: "Путешествия / Развлечения" },
  { id: "cmsozqqgh000cmp3cqjm175v6", name: "Другое", keep: "Прочее / Другой доход" },
] as const;

async function main() {
  const apply = process.env.APPLY_FAMILY_CATEGORY_CLEANUP === "1";
  const ids = duplicateTargets.map((item) => item.id);

  await prisma.$transaction(async (database) => {
    const categories = await database.category.findMany({
      where: { id: { in: ids }, module: FinanceModule.FAMILY },
      select: {
        id: true,
        name: true,
        isArchived: true,
        _count: { select: { transactions: true, recurringPayments: true } },
      },
      orderBy: { name: "asc" },
    });

    if (categories.length !== duplicateTargets.length) {
      throw new Error(`Ожидалось ${duplicateTargets.length} категорий, найдено ${categories.length}. Удаление остановлено.`);
    }

    for (const expected of duplicateTargets) {
      const actual = categories.find((item) => item.id === expected.id);
      if (!actual || actual.name !== expected.name) throw new Error(`Категория ${expected.id} изменилась. Удаление остановлено.`);
      if (actual._count.transactions > 0 || actual._count.recurringPayments > 0) {
        throw new Error(`Категория «${actual.name}» уже используется. Удаление остановлено.`);
      }
    }

    console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", categories: duplicateTargets.map((target) => ({ ...target, usage: 0 })) }, null, 2));
    if (!apply) return;

    const deleted = await database.category.deleteMany({
      where: {
        id: { in: ids },
        module: FinanceModule.FAMILY,
        transactions: { none: {} },
        recurringPayments: { none: {} },
      },
    });
    if (deleted.count !== duplicateTargets.length) throw new Error(`Удалено ${deleted.count} из ${duplicateTargets.length}. Транзакция отменена.`);
    console.log(`Удалено пустых дублей: ${deleted.count}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
