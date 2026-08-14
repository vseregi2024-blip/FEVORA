import Link from "next/link";

import { CosmetologyBookings } from "@/components/cosmetology-bookings";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCosmetologyAppointments, getCosmetologyDashboard } from "@/server/cosmetology";

import { createCosmetologyAppointmentAction } from "../actions";

export default async function VisitsPage() {
  const user = await requireUser();
  const [dashboard, appointments] = await Promise.all([getCosmetologyDashboard(user.id), getCosmetologyAppointments(user.id)]);
  const calendarAppointments = appointments.map((item) => ({
    id: item.id,
    operationDate: item.operationDate.toISOString().slice(0, 10),
    scheduledTime: item.scheduledTime,
    durationMinutes: item.durationMinutes,
    procedureName: item.procedureName,
    clientName: item.client.displayName ?? `${item.client.lastName} ${item.client.firstName}`,
    status: item.status,
  }));

  return <><header className="page-header"><div><p className="eyebrow">Косметология · Календарь</p><h1>Записи клиентов</h1><p className="muted">Запись не создаёт доход и не списывает товар. Закройте процедуру после фактического выполнения.</p></div><Link href="/cosmetology" className="button secondary">Назад</Link></header>
    <CosmetologyBookings appointments={calendarAppointments} clients={dashboard.clients.map((client) => ({ id: client.id, name: client.displayName ?? `${client.lastName} ${client.firstName}`, phone: client.phone }))} templates={dashboard.templates.map((template) => ({ id: template.id, name: template.name, basePrice: template.basePrice?.toString() ?? null }))} today={todayInputValue()} createAppointment={createCosmetologyAppointmentAction}/>
  </>;
}
