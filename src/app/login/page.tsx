import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/family");
  const production = process.env.NODE_ENV === "production";
  return <main className="imperia-login-shell">
    <span className="imperia-login-orb is-purple" aria-hidden="true" />
    <span className="imperia-login-orb is-pink" aria-hidden="true" />
    <div className="imperia-login-layout">
      <header className="imperia-login-brand">
        <Image className="imperia-login-logo" src="/icons/fevora-crown-512.png" alt="" width={128} height={128} priority />
        <div>
          <p>FEVORA <em>IMPERIA</em></p>
          <span>Больше, чем бизнес. Это ты.</span>
        </div>
      </header>

      <section className="imperia-login-intro" aria-label="FEVORA IMPERIA">
        <p className="imperia-login-kicker">Личное пространство владельца</p>
        <h1>Всё важное<br />в одной Империи.</h1>
        <p>Клиенты, проекты и финансы — в спокойном пространстве, созданном для вашего ритма.</p>
        <div className="imperia-login-pills" aria-hidden="true"><span>Клиенты</span><span>Финансы</span><span>Проекты</span></div>
      </section>

      <section className="imperia-login-card" aria-labelledby="login-title">
        <p className="imperia-login-overline">Вход в IMPERIA</p>
        <h2 id="login-title">Добро пожаловать</h2>
        <p className="imperia-login-copy">{production ? "Введите email и пароль, чтобы продолжить." : "Введите шестизначный код, чтобы продолжить."}</p>
        <LoginForm production={production} />
        <p className="imperia-login-security"><span aria-hidden="true">◆</span> Защищённый доступ к вашим данным</p>
      </section>
    </div>
  </main>;
}
