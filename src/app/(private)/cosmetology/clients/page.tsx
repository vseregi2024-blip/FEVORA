import { ImperiaClients } from "@/components/imperia-clients";
import { requireUser } from "@/server/auth";
import { getCosmetologyClients } from "@/server/cosmetology";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const clients = await getCosmetologyClients(user.id, query);
  return <ImperiaClients clients={clients} query={query}/>;
}
