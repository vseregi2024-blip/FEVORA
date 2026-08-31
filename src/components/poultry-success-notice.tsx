"use client";

import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  batch: "Группа создана.", movement: "Событие сохранено.", reconciled: "Поголовье сверено.",
  transfer: "Перевод выполнен.", slaughter: "Забой записан.", sale: "Продажа сохранена.",
  updated: "Изменения сохранены.", deleted: "Запись удалена.", purchase: "Покупка корма сохранена.",
  usage: "Кормление записано.", rate: "Норма кормления сохранена.", adjustment: "Остаток корма сверен.",
  created: "Инкубация создана.", result: "Результат вывода сохранён.", hatched: "Группа из вывода создана.",
  collected: "Сбор яиц сохранён.", expense: "Расход сохранён.",
};

export function PoultrySuccessNotice() {
  const params = useSearchParams();
  const message = Object.entries(messages).find(([key]) => params.get(key) === "1")?.[1];
  return message ? <p className="notice poultry-save-notice" role="status">✓ {message}</p> : null;
}
