import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/cosmetology/clients/page.tsx", import.meta.url), "utf8");
const clients = readFileSync(new URL("../src/components/imperia-clients.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../src/app/(private)/cosmetology/clients/[id]/page.tsx", import.meta.url), "utf8");
const create = readFileSync(new URL("../src/app/(private)/cosmetology/clients/new/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-C Clients", () => {
  it("keeps the existing server search and client data source", () => {
    expect(page).toContain("getCosmetologyClients");
    expect(page).toContain("params.q");
    expect(page).toContain("requireUser");
  });

  it("implements the approved clients composition", () => {
    for (const label of ["Всего клиентов", "Мои клиенты", "Все клиенты", "Поиск клиентов, тегов, телефона", "Применить поиск"]) expect(clients).toContain(label);
    expect(clients).toContain('name="q"');
    expect(clients).toContain('name="filter"');
    expect(clients).toContain("/cosmetology/clients/new");
    expect(clients).toContain("/cosmetology/clients/${client.id}");
  });

  it("preserves profile, loyalty and create-client functionality", () => {
    expect(profile).toContain("LoyaltyClientCard");
    expect(profile).toContain("updateCosmetologyClientAction");
    expect(profile).toContain("createTreatmentPlanAction");
    expect(create).toContain("createCosmetologyClientAction");
    expect(create).toContain("ClientAnamnesisFields");
  });

  it("lets a birthday be typed without scrolling through calendar years", () => {
    expect(create).toContain('mode="birthDate"');
    expect(profile).toContain('mode="birthDate"');
    expect(readFileSync(new URL("../src/components/imperia-date-field.tsx", import.meta.url), "utf8")).toContain("дд.мм.гггг");
  });

  it("keeps special client marks in a compact expandable picker", () => {
    expect(profile).toContain("ImperiaClientMarksPicker");
    expect(readFileSync(new URL("../src/components/imperia-client-marks-picker.tsx", import.meta.url), "utf8")).toContain("<details");
  });

  it("uses the compact client profile composition without duplicate contact actions", () => {
    for (const label of ["Контакты клиента", "Соцсети", "Откуда пришёл", "СЛЕДУЮЩАЯ ЗАПИСЬ", "ПОСЛЕДНИЙ ВИЗИТ", "История посещений", "Все процедуры", "Оплачено всего", "План клиента", "Beauty Bonus Club"]) expect(profile).toContain(label);
    expect(profile).not.toContain("Нет ссылки");
    expect(profile).not.toContain("Написать");
    expect(profile).not.toContain("imperia-profile-sticky-actions");
  });

  it("uses scoped reusable UI-C styles", () => {
    for (const selector of [".imperia-client-search", ".imperia-clients-total", ".imperia-client-card", ".imperia-client-profile"]) expect(css).toContain(selector);
  });
});
