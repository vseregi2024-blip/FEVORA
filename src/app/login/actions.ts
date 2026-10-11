"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { authenticateLocalPin, authenticateOwner } from "@/server/auth";

export type LoginState = { error?: string };

const pinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "Введите шестизначный код."),
});

const ownerCredentialsSchema = z.object({
  email: z.string().trim().email("Введите корректный email."),
  password: z.string().min(1, "Введите пароль."),
  name: z.string().trim().max(120, "Имя слишком длинное.").optional(),
});

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  if (process.env.NODE_ENV === "production") {
    const parsed = ownerCredentialsSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте данные." };

    const result = await authenticateOwner(parsed.data.email, parsed.data.password, parsed.data.name);
    if ("error" in result) return { error: result.error };
    redirect("/family");
  }

  const parsed = pinSchema.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Перевірте дані." };

  const result = await authenticateLocalPin(parsed.data.pin);
  if ("error" in result) return { error: result.error };
  redirect("/family");
}
