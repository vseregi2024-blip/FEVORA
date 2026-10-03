export const categoryIconPresets = [
  { value: "income-clients", label: "Клиенты" },
  { value: "income-eggs", label: "Яйца" },
  { value: "income-poultry", label: "Птица" },
  { value: "income-procedures", label: "Процедуры" },
  { value: "income-creams", label: "Кремы" },
  { value: "income-learning", label: "Обучение" },
  { value: "income-community", label: "Сообщество" },
  { value: "expense-groceries", label: "Продукты" },
  { value: "expense-car", label: "Автомобиль" },
  { value: "expense-travel", label: "Путешествия" },
  { value: "expense-clothes", label: "Одежда" },
  { value: "expense-children", label: "Дети" },
  { value: "expense-pets", label: "Питомцы" },
  { value: "expense-home", label: "Дом" },
  { value: "expense-pharmacy", label: "Аптека" },
  { value: "expense-phone", label: "Связь" },
  { value: "expense-cafe", label: "Кафе" },
  { value: "expense-shopping", label: "Покупки" },
  { value: "expense-bills", label: "Платежи" },
] as const;

type CategoryIconPreset = (typeof categoryIconPresets)[number]["value"];

const presetIconSources: Record<CategoryIconPreset, string> = Object.fromEntries(
  categoryIconPresets.map(({ value }) => [value, `/assets/category-icons/${value}.png`]),
) as Record<CategoryIconPreset, string>;

const legacyPresetAliases: Record<string, CategoryIconPreset> = {
  cart: "expense-groceries",
  home: "expense-home",
  children: "expense-children",
  health: "expense-pharmacy",
  clothes: "expense-clothes",
  transport: "expense-car",
  fun: "expense-cafe",
  travel: "expense-travel",
  bill: "expense-bills",
  income: "income-clients",
  other: "expense-shopping",
};

export function categoryIconValue(icon: string | null | undefined) {
  if (!icon || icon.startsWith("data:image/")) return icon;
  return legacyPresetAliases[icon] ?? icon;
}

export function categoryIconImage(icon: string | null | undefined) {
  const value = categoryIconValue(icon);
  if (!value) return undefined;
  if (value.startsWith("data:image/")) return value;
  return presetIconSources[value as CategoryIconPreset];
}
