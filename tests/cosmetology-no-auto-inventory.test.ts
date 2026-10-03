import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const server = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");
const form = readFileSync(new URL("../src/components/complete-cosmetology-visit-form.tsx", import.meta.url), "utf8");

describe("cosmetology procedure completion inventory boundary", () => {
  it("does not ask for or deduct materials when a procedure is completed", () => {
    expect(form).not.toContain('name="itemId"');
    expect(form).not.toContain('name="usageQuantity"');
    expect(form).toContain("Препараты при проведении процедуры не списываются");
    const completion = server.slice(server.indexOf("async function completeCosmetologyVisitWithoutBonus"), server.indexOf("async function completeCosmetologyVisitWithBonus"));
    expect(completion).not.toContain("createVisitUsages");
    expect(completion).toContain("costAmount: zero");
  });
});
