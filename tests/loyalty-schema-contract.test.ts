import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const clientModel = schema.match(/model CosmetologyClient \{[\s\S]*?\n\}/)?.[0] ?? "";

describe("FEVORA loyalty link schema", () => {
  it("stores only a unique external client link", () => {
    expect(clientModel).toContain("loyaltyClientId");
    expect(clientModel).toContain("@unique");
  });

  it("does not duplicate Beauty Bonus Club balances or levels", () => {
    expect(clientModel).not.toContain("bonusBalance");
    expect(clientModel).not.toContain("pendingBonusBalance");
    expect(clientModel).not.toContain("levelBonusPercent");
    expect(clientModel).not.toContain("totalReferrals");
  });

  it("uses only server-side BOT_CLIENT_API variables", () => {
    const serverSource = readFileSync(new URL("../src/server/loyalty.ts", import.meta.url), "utf8");
    const exampleEnv = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
    expect(serverSource).toContain("BOT_CLIENT_API_URL");
    expect(serverSource).toContain("BOT_CLIENT_API_SECRET");
    expect(serverSource).not.toContain("NEXT_PUBLIC_");
    expect(serverSource).not.toContain("BEAUTY_BONUS_API_");
    expect(exampleEnv).toContain("BOT_CLIENT_API_URL=\nBOT_CLIENT_API_SECRET=");
    expect(exampleEnv).not.toContain("BEAUTY_BONUS_API_");
  });
});
