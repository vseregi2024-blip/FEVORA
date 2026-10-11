"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ production }: { production: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="imperia-login-form">
      {production ? <>
        <label htmlFor="login-email">
          <span>Email</span>
          <input id="login-email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
        </label>
        <label htmlFor="login-password">
          <span>Пароль</span>
          <input id="login-password" name="password" type="password" required autoComplete="current-password" placeholder="Ваш пароль" />
        </label>
        <details className="imperia-login-first-entry">
          <summary>Первый вход? Укажите имя</summary>
          <label htmlFor="login-name">
            <span>Ваше имя <small>профиль создаётся один раз</small></span>
            <input id="login-name" name="name" type="text" autoComplete="name" placeholder="Например: Алина" />
          </label>
        </details>
      </> : <label htmlFor="login-pin">
        <span>Код доступа</span>
        <input id="login-pin" className="imperia-login-pin" name="pin" type="password" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="current-password" placeholder="••••••" />
      </label>}
      {state.error && <p className="imperia-login-error" role="alert" aria-live="polite">{state.error}</p>}
      <button className="imperia-login-submit" type="submit" disabled={pending}>{pending ? "Открываем…" : production ? "Войти в IMPERIA" : "Открыть IMPERIA"}<span aria-hidden="true">→</span></button>
    </form>
  );
}
