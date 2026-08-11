import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  redirect((await getCurrentUser()) ? "/dashboard" : "/login");
}
