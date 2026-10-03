import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/cosmetology/visits/page.tsx", import.meta.url), "utf8");
const calendar = readFileSync(new URL("../src/components/cosmetology-calendar.tsx", import.meta.url), "utf8");
const bookings = readFileSync(new URL("../src/components/cosmetology-bookings.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/cosmetology-calendar.module.css", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-D Calendar", () => {
  it("keeps the existing appointment data and create action", () => {
    expect(page).toContain("getCosmetologyAppointments");
    expect(page).toContain("getCosmetologyDashboard");
    expect(page).toContain("createCosmetologyAppointmentAction");
    expect(bookings).toContain("CosmetologyPaymentComponentsFields");
  });

  it("supports month, day, week and list views", () => {
    for (const view of ['"month"', '"day"', '"week"', '"list"']) expect(calendar).toContain(view);
    for (const label of ["Месяц", "День", "Неделя", "Список"]) expect(calendar).toContain(label);
  });

  it("renders the approved calendar hierarchy and statuses", () => {
    for (const label of ["Календарь", "Ближайшие записи", "Добавить запись", "Запланировано", "Выполнено", "Отменено", "Не пришла"]) expect(calendar).toContain(label);
    expect(calendar).toContain("/cosmetology/visits/${item.id}");
  });

  it("uses scoped IMPERIA calendar styles", () => {
    for (const selector of [".hero", ".monthCard", ".upcoming", ".agenda", ".timelineCard", ".listCard"]) expect(css).toContain(selector);
  });
});
