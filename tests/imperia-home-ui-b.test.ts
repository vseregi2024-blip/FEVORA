import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/family/page.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/components/imperia-home.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-B Home", () => {
  it("uses the approved Home composition", () => {
    for (const label of ["Капитал", "Конверты", "Аналитика", "Идея дня"]) expect(home).toContain(label);
    expect(home).not.toContain("Достижения");
  });

  it("renders real finance and savings data without demo amounts", () => {
    expect(page).toContain("getFamilyAnalytics");
    expect(page).toContain("getMoneyWorkspace");
    expect(home).not.toMatch(/84\s?350|12\s?450|4\s?300/);
  });

  it("keeps Home destinations wired to existing routes", () => {
    for (const route of ["/money", "/money/new?project=FAMILY&kind=ENVELOPE", "/family/analytics"]) expect(home).toContain(route);
  });

  it("includes dedicated responsive Home styles", () => {
    for (const selector of [".imperia-home-capital", ".imperia-home-goals", ".imperia-home-analytics", ".imperia-home-idea"]) expect(css).toContain(selector);
    expect(css).toContain("iPhone 17 Pro Max = 440 × 956 CSS px, 3× DPR");
    expect(css).toContain("env(safe-area-inset-top)");
    expect(css).toContain("env(safe-area-inset-bottom)");
  });
});
