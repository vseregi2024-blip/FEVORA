import Link from "next/link";
import { FinanceModule, MoneyAccountKind, Prisma } from "@prisma/client";

import { CosmetologyCabinet } from "@/components/cosmetology-cabinet";
import { todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getCosmetologyAppointments, getCosmetologyDashboard } from "@/server/cosmetology";
import { getMoneyWorkspace } from "@/server/money";

export default async function CosmetologyPage() {
  const user = await requireUser();
  const today = todayInputValue();
  const [month, daily, appointments, money] = await Promise.all([
    getCosmetologyDashboard(user.id, "MONTH"), getCosmetologyDashboard(user.id, "TODAY"), getCosmetologyAppointments(user.id), getMoneyWorkspace(user.id, FinanceModule.COSMETOLOGY),
  ]);
  const procurementEnvelope = money.accounts.find((account) => account.kind === MoneyAccountKind.ENVELOPE && account.isActive && /закуп/i.test(account.name));
  const todayStart = new Date(`${today}T00:00:00.000Z`);
  const todayEnd = new Date(`${today}T23:59:59.999Z`);
  const procurementToday = procurementEnvelope ? await prisma.moneyLedgerEntry.aggregate({
    where: { accountId: procurementEnvelope.id, reversedAt: null, amount: { gt: 0 }, operationDate: { gte: todayStart, lte: todayEnd } },
    _sum: { amount: true },
  }) : null;
  const todayProcurement = new Prisma.Decimal(procurementToday?._sum.amount?.toString() ?? "0");
  const todayIncome = new Prisma.Decimal(daily.report.income);
  const reserve = procurementEnvelope ? formatMoney(minorUnitsToMoney(procurementEnvelope.balanceMinor), procurementEnvelope.currency) : formatMoney("0");
  const monthExpense = new Prisma.Decimal(month.report.cashExpense);
  const currentMonthStart = new Date(`${today.slice(0, 8)}01T00:00:00.000Z`);
  return <><header className="page-header cosmetology-cabinet-header"><div><p className="eyebrow">Косметология</p><h1>Мой кабинет</h1><p className="muted">Записи, клиенты, препараты и финансы</p></div><div className="button-row"><Link className="button secondary" href="/cosmetology/clients/new">＋ Клиент</Link><Link className="button primary" href="/cosmetology/visits">＋ Запись</Link></div></header><CosmetologyCabinet today={today} appointments={appointments.map((appointment) => ({ date: appointment.operationDate.toISOString().slice(0, 10), status: appointment.status }))} todayIncome={formatMoney(todayIncome.toString())} todayProcurement={formatMoney(todayProcurement.toString())} todayFree={formatMoney(todayIncome.sub(todayProcurement).toString())} monthIncome={formatMoney(month.report.income)} monthExpense={formatMoney(monthExpense.toString())} monthResult={formatMoney(new Prisma.Decimal(month.report.income).sub(monthExpense).toString())} reserve={reserve} reserveHref={procurementEnvelope ? "/cosmetology/procurement-reserve" : "/money?project=COSMETOLOGY#envelopes"} clients={month.clients.length} newClients={month.clients.filter((client) => client.createdAt >= currentMonthStart).length} inventoryItems={month.items.length} lowStock={month.items.filter((item) => item.currentQuantity.lte(item.minimumQuantity)).length}/></>;
}
