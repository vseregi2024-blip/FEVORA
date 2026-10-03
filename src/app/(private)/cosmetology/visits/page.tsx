import { CosmetologyBookings } from "@/components/cosmetology-bookings";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCosmetologyAppointments, getCosmetologyDashboard } from "@/server/cosmetology";

import { createCosmetologyAppointmentAction } from "../actions";

export default async function VisitsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date : undefined;
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

  return <div className="imperia-calendar-page">
    <CosmetologyBookings appointments={calendarAppointments} clients={dashboard.clients.map((client) => ({ id: client.id, name: client.displayName ?? `${client.lastName} ${client.firstName}`, phone: client.phone }))} templates={dashboard.templates.map((template) => ({ id: template.id, name: template.name, basePrice: template.basePrice?.toString() ?? null }))} today={todayInputValue()} initialDate={initialDate} createAppointment={createCosmetologyAppointmentAction}/>
  </div>;
}
