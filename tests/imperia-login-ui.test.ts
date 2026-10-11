import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/login/page.tsx", import.meta.url), "utf8");
const form = readFileSync(new URL("../src/app/login/login-form.tsx", import.meta.url), "utf8");
const action = readFileSync(new URL("../src/app/login/actions.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");

describe("FEVORA IMPERIA login", () => {
  it("uses the current IMPERIA identity and a responsive glass login layout", () => {
    expect(page).toContain("imperia-login-shell");
    expect(page).toContain("/icons/fevora-crown-512.png");
    expect(page).toContain("Больше, чем бизнес. Это ты.");
    for (const selector of [".imperia-login-layout", ".imperia-login-card", ".imperia-login-submit", "@media (max-width: 760px)"]) expect(css).toContain(selector);
  });

  it("preserves production credentials, first-entry name and local PIN", () => {
    for (const field of ['name="email"', 'name="password"', 'name="name"', 'name="pin"']) expect(form).toContain(field);
    expect(form).toContain("useActionState(loginAction");
    expect(form).toContain("Первый вход? Укажите имя");
    expect(action).toContain("authenticateOwner");
    expect(action).toContain("authenticateLocalPin");
    expect(action).toContain('redirect("/family")');
  });

  it("keeps accessible labels, errors and pending-state protection", () => {
    for (const id of ["login-email", "login-password", "login-name", "login-pin"]) expect(form).toContain(`htmlFor="${id}"`);
    expect(form).toContain('role="alert"');
    expect(form).toContain('aria-live="polite"');
    expect(form).toContain("disabled={pending}");
  });
});
