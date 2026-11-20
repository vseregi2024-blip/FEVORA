import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("production startup contract", () => {
  it("starts Next.js without automatic database mutations", () => {
    const entrypoint = readProjectFile("docker-entrypoint.sh");

    expect(entrypoint).not.toMatch(/prisma\s+migrate/);
    expect(entrypoint).not.toMatch(/prisma(?::|\s+db\s+)seed/);
    expect(entrypoint).not.toContain("RUN_PRISMA_SEED");
    expect(entrypoint).toMatch(/^exec npm run start$/m);
  });

  it("uses the reviewed entrypoint and keeps database maintenance manual", () => {
    const dockerfile = readProjectFile("Dockerfile");
    const railwayConfig = readProjectFile("railway.toml");
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(dockerfile).toContain('CMD ["./docker-entrypoint.sh"]');
    expect(railwayConfig).not.toMatch(/preDeployCommand|startCommand/);
    expect(packageJson.scripts["prisma:migrate:deploy"]).toBe("prisma migrate deploy");
    expect(packageJson.scripts["prisma:seed"]).toBe("prisma db seed");
  });
});
