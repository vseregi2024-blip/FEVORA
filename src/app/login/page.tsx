import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">FEVORA</p><h1>Ваші гроші — ясно.</h1><p className="muted">Під час першого входу використовуйте облікові дані з <code>.env</code>.</p><LoginForm /></section></main>;
}
