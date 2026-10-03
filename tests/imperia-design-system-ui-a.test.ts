import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");
const shell = readFileSync(new URL("../src/components/imperia-app-shell.tsx", import.meta.url), "utf8");
const primitives = readFileSync(new URL("../src/components/ui/imperia.tsx", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-A design system", () => {
  it("defines the approved dark gradient and semantic tokens", () => {
    for (const token of ["--imp-bg", "--imp-surface", "--imp-gradient-brand", "--imp-text", "--imp-success", "--imp-warning", "--imp-danger", "--imp-radius-card", "--imp-touch-target"]) expect(css).toContain(token);
    for (const color of ["#8138ff", "#c936e7", "#f447a2", "#ff7a3d", "#0b0920"]) expect(css.toLowerCase()).toContain(color);
  });

  it("provides reusable cards, controls and resilient states", () => {
    for (const component of ["ImperiaCard", "StatCard", "QuickActionCard", "ProgressCard", "ProjectCard", "ImperiaSectionHeader", "ImperiaStatusBadge", "GradientButton", "IconCircle", "LoadingState", "EmptyState", "ErrorState"]) expect(primitives).toContain(`function ${component}`);
    expect(css).toContain(".imperia-skeleton");
    expect(css).toContain("min-height: var(--imp-touch-target)");
  });

  it("keeps the approved shell destinations consistent", () => {
    for (const label of ["Кабинет", "Клиенты", "Календарь", "Препараты"]) expect(shell).toContain(`label: "${label}"`);
    for (const label of ["Дом", "Клиенты", "Добавить", "Сейф", "Настройки"]) expect(navigation).toContain(`"${label}"`);
    expect(shell).toContain("Больше, чем бизнес. Это ты.");
    expect(shell).toContain('pathname === "/projects"');
  });

  it("contains explicit mobile regression breakpoints", () => {
    for (const width of ["430px", "390px", "375px"]) expect(css).toContain(`max-width: ${width}`);
    expect(css).toContain("overflow-x: clip");
  });
});
