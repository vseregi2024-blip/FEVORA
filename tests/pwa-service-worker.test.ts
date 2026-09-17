import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

describe("PWA service worker navigation contract", () => {
  it("does not register a no-op fetch listener that delays normal page navigation", () => {
    expect(serviceWorker).not.toMatch(/addEventListener\(["']fetch["']/);
  });
});
