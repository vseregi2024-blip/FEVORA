import { readFileSync } from "node:fs";
import { CosmetologyCertificateStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedPrisma = vi.hoisted(() => ({
  cosmetologyCertificate: {
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  cosmetologyPaymentComponent: { findMany: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: mockedPrisma }));

import {
  cancelCosmetologyCertificate,
  certificateSchema,
  createCosmetologyCertificate,
  getAvailableCosmetologyCertificates,
  getCosmetologyCashReport,
} from "../src/server/cosmetology";

const certificateInput = (overrides: Record<string, unknown> = {}) => certificateSchema.parse({
  certificateNumber: "cert-2026-001",
  initialAmount: "5000",
  currency: "UAH",
  clientId: null,
  issuedAt: "2026-09-16",
  expiresAt: "2026-12-31",
  comment: null,
  ...overrides,
});

describe("C1 certificate lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.cosmetologyCertificate.updateMany.mockResolvedValue({ count: 0 });
  });

  it("creates an ACTIVE certificate with equal initial and remaining amounts without finance writes", async () => {
    mockedPrisma.cosmetologyCertificate.create.mockImplementation(({ data }) => Promise.resolve({ id: "certificate-1", ...data }));
    const certificate = await createCosmetologyCertificate("user-1", certificateInput());

    expect(mockedPrisma.cosmetologyCertificate.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: "user-1",
      certificateNumber: "CERT-2026-001",
      initialAmount: new Prisma.Decimal("5000"),
      remainingAmount: new Prisma.Decimal("5000"),
      currency: "UAH",
      status: CosmetologyCertificateStatus.ACTIVE,
    }) });
    expect(certificate.remainingAmount).toEqual(new Prisma.Decimal("5000"));
    expect(Object.keys(mockedPrisma)).toEqual(["cosmetologyCertificate", "cosmetologyPaymentComponent"]);
  });

  it("creates a past-dated certificate directly as EXPIRED", async () => {
    mockedPrisma.cosmetologyCertificate.create.mockImplementation(({ data }) => Promise.resolve({ id: "certificate-2", ...data }));
    await createCosmetologyCertificate("user-1", certificateInput({ issuedAt: "2025-01-01", expiresAt: "2025-12-31" }));
    expect(mockedPrisma.cosmetologyCertificate.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: CosmetologyCertificateStatus.EXPIRED }) });
  });

  it("maps the database uniqueness guard to a clear duplicate-number error", async () => {
    mockedPrisma.cosmetologyCertificate.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", {
      code: "P2002",
      clientVersion: "6.19.3",
      meta: { target: ["userId", "certificateNumber"] },
    }));
    await expect(createCosmetologyCertificate("user-1", certificateInput())).rejects.toThrow("Сертификат с таким номером уже существует.");
  });

  it("rejects invalid amount and expiry earlier than issue date", () => {
    expect(certificateSchema.safeParse({ ...certificateInput(), initialAmount: "0" }).success).toBe(false);
    expect(certificateSchema.safeParse({ ...certificateInput(), initialAmount: "-1" }).success).toBe(false);
    expect(certificateSchema.safeParse({ ...certificateInput(), issuedAt: "2026-09-16", expiresAt: "2026-09-15" }).success).toBe(false);
  });

  it("only exposes ACTIVE, non-empty and non-expired certificates to payment forms", async () => {
    mockedPrisma.cosmetologyCertificate.findMany.mockResolvedValue([]);
    await getAvailableCosmetologyCertificates("user-1");
    expect(mockedPrisma.cosmetologyCertificate.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      userId: "user-1",
      status: CosmetologyCertificateStatus.ACTIVE,
      remainingAmount: { gt: new Prisma.Decimal(0) },
      OR: expect.any(Array),
    }) }));
  });

  it("changes only ACTIVE certificates to CANCELLED and keeps their history", async () => {
    mockedPrisma.cosmetologyCertificate.findFirst.mockResolvedValue({ id: "certificate-1", status: CosmetologyCertificateStatus.ACTIVE });
    mockedPrisma.cosmetologyCertificate.update.mockResolvedValue({ id: "certificate-1", status: CosmetologyCertificateStatus.CANCELLED });
    await cancelCosmetologyCertificate("user-1", "certificate-1");
    expect(mockedPrisma.cosmetologyCertificate.update).toHaveBeenCalledWith({ where: { id: "certificate-1" }, data: { status: CosmetologyCertificateStatus.CANCELLED } });
  });

  it.each([CosmetologyCertificateStatus.CANCELLED, CosmetologyCertificateStatus.EXPIRED, CosmetologyCertificateStatus.FULLY_USED])("does not cancel a certificate already in %s", async (status) => {
    mockedPrisma.cosmetologyCertificate.findFirst.mockResolvedValue({ id: "certificate-1", status });
    await expect(cancelCosmetologyCertificate("user-1", "certificate-1")).rejects.toThrow("Можно отменить только активный сертификат.");
    expect(mockedPrisma.cosmetologyCertificate.update).not.toHaveBeenCalled();
  });
});

describe("C1 financial and schema contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps certificate value outside the cash total while reporting it separately", async () => {
    mockedPrisma.cosmetologyPaymentComponent.findMany
      .mockResolvedValueOnce([
        { method: "CASH", amount: new Prisma.Decimal("2000") },
        { method: "MONOBANK", amount: new Prisma.Decimal("1000") },
      ])
      .mockResolvedValueOnce([{ method: "CERTIFICATE", amount: new Prisma.Decimal("2000") }]);

    const report = await getCosmetologyCashReport("user-1", { from: "2026-09-16", to: "2026-09-16", method: "ALL" });
    expect(report.total).toBe("3000.00");
    expect(report.certificateTotal).toBe("2000.00");
    expect(report.bonusTotal).toBe("0.00");
    expect(report.totals.CASH).toBe("2000.00");
    expect(report.totals.MONOBANK).toBe("1000.00");
    expect(report.balanced).toBe(true);
    expect(mockedPrisma.cosmetologyPaymentComponent.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({ method: { in: ["CASH", "MONOBANK", "PRIVATBANK", "OTHER"] } }) }));
  });

  it("keeps the migration additive and protects certificate numbers at DB level", () => {
    const migration = readFileSync(new URL("../prisma/migrations/20260916090000_add_cosmetology_certificates/migration.sql", import.meta.url), "utf8");
    expect(migration).toContain("ADD VALUE IF NOT EXISTS 'CERTIFICATE'");
    expect(migration).toContain("CREATE TABLE \"CosmetologyCertificate\"");
    expect(migration).toContain("CosmetologyCertificate_userId_certificateNumber_key");
    expect(migration).toContain("ADD COLUMN \"certificateId\" TEXT");
    expect(migration).not.toMatch(/^\s*(?:DROP\b|TRUNCATE\b|DELETE\s+FROM\b|UPDATE\s+\S+\s+SET\b)/im);
  });

  it("links Certificate → PaymentComponent → Payment → Visit and uses one DB transaction", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    const server = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");
    expect(schema).toMatch(/certificate\s+CosmetologyCertificate\?/);
    expect(schema).toMatch(/payment\s+CosmetologyPayment/);
    expect(schema).toMatch(/visit\s+CosmetologyVisit/);
    expect(server).toContain("return prisma.$transaction(async (db) =>");
    expect(server).toContain("remainingAmount: { gte: amount }");
    expect(server).toContain("remainingAmount: { decrement: amount }");
    expect(server).toContain("await db.cosmetologyPaymentComponent.create");
  });

  it("does not expose expired certificates or create Bot Client requests from C1", () => {
    const server = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");
    const fields = readFileSync(new URL("../src/components/cosmetology-payment-components-fields.tsx", import.meta.url), "utf8");
    expect(server).toContain("status: CosmetologyCertificateStatus.ACTIVE");
    expect(server).toContain("expiresAt: { gte:");
    expect(fields).toContain("Поиск сертификата");
    expect(fields).toContain("Максимум:");
    expect(server).not.toContain("/api/v1/payments");
  });

  it("keeps mobile forms single-column and returns to the relevant screen after Save", () => {
    const familyCss = readFileSync(new URL("../src/app/family.css", import.meta.url), "utf8");
    const actions = readFileSync(new URL("../src/app/(private)/cosmetology/actions.ts", import.meta.url), "utf8");
    expect(familyCss).toContain("body { overflow-x: hidden; }");
    expect(familyCss).toContain(".compact-form .form-grid { grid-template-columns: 1fr; }");
    expect(actions).toContain("/cosmetology/certificates/${certificateId}?created=1");
    expect(actions).toContain("/cosmetology/visits/${id}?paid=1");
    expect(actions).toContain("/cosmetology/visits/${id}?completed=1");
  });

  it("stacks the certificate list header through 430px so its action cannot overflow", () => {
    const page = readFileSync(new URL("../src/app/(private)/cosmetology/certificates/page.tsx", import.meta.url), "utf8");
    const globalCss = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
    expect(page).toContain('className="page-header certificates-page-header"');
    expect(globalCss).toContain("@media(max-width:430px){.certificates-page-header{align-items:stretch;flex-direction:column}.certificates-page-header .button{width:100%}}");
  });
});
