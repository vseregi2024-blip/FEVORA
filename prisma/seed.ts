import { CategoryKind, FinanceModule, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["Зарплата", FinanceModule.GENERAL, CategoryKind.INCOME],
  ["Інші доходи", FinanceModule.GENERAL, CategoryKind.INCOME],
  ["Повсякденні витрати", FinanceModule.GENERAL, CategoryKind.EXPENSE],
  ["Накопичення", FinanceModule.GENERAL, CategoryKind.BOTH],
  ["Продаж особистих речей", FinanceModule.FAMILY, CategoryKind.INCOME],
  ["Разовий дохід", FinanceModule.FAMILY, CategoryKind.INCOME],
  ["Інший дохід", FinanceModule.FAMILY, CategoryKind.INCOME],
  ["Продукти", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Дім", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Автомобіль", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Діти", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Лікування", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Подарунки", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Розваги та подорожі", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Одяг", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Проче", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Продукти", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Дім", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Транспорт", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Розваги", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Подорожі", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Обов'язкові платежі", FinanceModule.FAMILY, CategoryKind.EXPENSE],
  ["Інше", FinanceModule.FAMILY, CategoryKind.BOTH],
  ["Корм", FinanceModule.POULTRY, CategoryKind.EXPENSE],
  ["Птахи", FinanceModule.POULTRY, CategoryKind.BOTH],
  ["Обладнання", FinanceModule.POULTRY, CategoryKind.EXPENSE],
  ["Ветеринарія", FinanceModule.POULTRY, CategoryKind.EXPENSE],
  ["Продаж продукції", FinanceModule.POULTRY, CategoryKind.INCOME],
];

const archivedFamilyCategories = ["Здоров'я", "Транспорт", "Розваги", "Подорожі", "Обов'язкові платежі", "Інше"];

async function main() {
  for (const [name, module, kind] of categories) {
    const sortOrder = categories.findIndex((category) => category[0] === name && category[1] === module);
    const existing = await prisma.category.findFirst({ where: { userId: null, module, name } });

    if (existing) {
      await prisma.category.update({ where: { id: existing.id }, data: { kind, sortOrder } });
    } else {
      await prisma.category.create({ data: { name, module, kind, sortOrder } });
    }
  }

  await prisma.category.updateMany({
    where: { userId: null, module: FinanceModule.FAMILY, name: { in: archivedFamilyCategories } },
    data: { isArchived: true },
  });
}

main().finally(() => prisma.$disconnect());
