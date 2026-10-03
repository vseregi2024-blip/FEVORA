import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/family");
  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">FEVORA IMPERIA</p><h1>Добро пожаловать</h1><p className="muted">Введите ваш шестизначный код, чтобы открыть Империю.</p><LoginForm /></section></main>;
}
