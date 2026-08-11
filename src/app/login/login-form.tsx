"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="auth-form">
      <label>Ім&apos;я <span className="muted">(лише під час першого входу)</span><input name="name" autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Пароль<input name="password" type="password" required minLength={8} autoComplete="current-password" /></label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="button primary" disabled={pending}>{pending ? "Перевіряємо…" : "Увійти"}</button>
    </form>
  );
}
