import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/cosmetology/visits/page.tsx", import.meta.url), "utf8");
const calendar = readFileSync(new URL("../src/components/cosmetology-calendar.tsx", import.meta.url), "utf8");
const bookings = readFileSync(new URL("../src/components/cosmetology-bookings.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/cosmetology-calendar.module.css", import.meta.url), "utf8");
const bottomNavigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");
const safeNewPage = readFileSync(new URL("../src/app/(private)/safe/new/page.tsx", import.meta.url), "utf8");

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
    for (const label of ["Календарь", "Ближайшие записи", "Что добавить?", "Запись клиента", "Доход", "Расход", "Финансовые события дня", "Запланировано", "Выполнено", "Отменено", "Не пришла"]) expect(calendar).toContain(label);
    expect(calendar).toContain("/cosmetology/visits/${item.id}");
  });

  it("uses scoped IMPERIA calendar styles", () => {
    for (const selector of [".hero", ".monthCard", ".upcoming", ".agenda", ".timelineCard", ".listCard"]) expect(css).toContain(selector);
  });

  it("makes the lower calendar add menu open an appointment form, income, or expense action", () => {
    expect(bottomNavigation).toContain('aria-label="Добавить запись, доход или расход"');
    expect(bottomNavigation).toContain('"/cosmetology/visits?new=appointment"');
    expect(bottomNavigation).toContain("module=COSMETOLOGY");
    expect(page).toContain('openAppointment={query.new === "appointment"}');
    expect(bookings).toContain("useState(openAppointment)");
    expect(safeNewPage).toContain("const selectedModule");
  });

  it("supports touch time slots and searchable client selection", () => {
    expect(calendar).toContain("Создать запись на");
    expect(calendar).toContain("weekSlotButton");
    expect(bookings).toContain("последние 4 цифры телефона");
    expect(bookings).toContain("matchingClients");
    expect(css).toContain(".weekWrap{width:100%;max-width:100%;overflow-x:auto");
  });
});
