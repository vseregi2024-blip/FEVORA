"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { authenticateOwner } from "@/server/auth";

export type LoginState = { error?: string };

const credentialsSchema = z.object({
  email: z.string().email("Вкажіть коректний email."),
  password: z.string().min(8, "Пароль має містити щонайменше 8 символів."),
  name: z.string().trim().max(80).optional(),
});

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Перевірте дані." };

  const result = await authenticateOwner(parsed.data.email, parsed.data.password, parsed.data.name);
  if ("error" in result) return { error: result.error };
  redirect("/dashboard");
}
