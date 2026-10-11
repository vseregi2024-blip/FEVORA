import { redirect } from "next/navigation";

/** Legacy dashboard compatibility route. The current FEVORA home is /family. */
export default function DashboardPage() { redirect("/family"); }
