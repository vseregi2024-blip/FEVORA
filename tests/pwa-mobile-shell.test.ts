import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const manifest = readFileSync(new URL("../src/app/manifest.ts", import.meta.url), "utf8");
const root = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../src/app/(private)/dashboard/page.tsx", import.meta.url), "utf8");
const legacySettings = readFileSync(new URL("../src/app/(private)/settings/page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

describe("PWA mobile shell", () => {
  it("starts the installed app in the current IMPERIA home with the crown icon", () => {
    expect(manifest).toContain('start_url: "/family"');
    expect(manifest).toContain("fevora-crown-192.png?v=2");
    expect(manifest).toContain("fevora-crown-512.png?v=2");
    expect(manifest).toContain('background_color: "#0b0920"');
    expect(root).toContain('redirect((await getCurrentUser()) ? "/family" : "/login")');
  });

  it("keeps legacy entry URLs as redirects instead of rendering the retired light UI", () => {
    expect(dashboard).toContain('redirect("/family")');
    expect(legacySettings).toContain('redirect("/family/settings")');
  });

  it("allows portrait and landscape iPad PWA layouts", () => {
    expect(manifest).toContain('orientation: "any"');
    expect(css).toContain("@media (pointer: coarse) and (min-width:801px)");
    expect(css).toContain(".sidebar{display:none}");
  });
});
