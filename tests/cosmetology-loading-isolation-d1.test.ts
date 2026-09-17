import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const clientsPage = readFileSync(new URL("../src/app/(private)/cosmetology/clients/page.tsx", import.meta.url), "utf8");
const cashPage = readFileSync(new URL("../src/app/(private)/cosmetology/cash/page.tsx", import.meta.url), "utf8");
const cosmetology = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");
const loyalty = readFileSync(new URL("../src/server/loyalty.ts", import.meta.url), "utf8");

describe("D1 cosmetology page loading isolation", () => {
  it("keeps the client list and cash report independent of Beauty Bonus reads", () => {
    expect(clientsPage).not.toContain("@/server/loyalty");
    expect(cashPage).not.toContain("@/server/loyalty");
  });

  it("bounds every Beauty Bonus HTTP request and keeps BONUS/CERTIFICATE out of cash", () => {
    expect(loyalty).toContain("AbortSignal.timeout(7000)");
    expect(cosmetology).toMatch(/monetaryPaymentMethods[^=]*= \[CosmetologyPaymentMethod\.CASH, CosmetologyPaymentMethod\.MONOBANK, CosmetologyPaymentMethod\.PRIVATBANK, CosmetologyPaymentMethod\.OTHER\]/);
    expect(cosmetology).toContain("certificateTotal");
    expect(cosmetology).toContain("bonusTotal");
  });
});
