"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { authenticateLocalPin } from "@/server/auth";

export type LoginState = { error?: string };

const pinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "Введите шестизначный код."),
});

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = pinSchema.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Перевірте дані." };

  const result = await authenticateLocalPin(parsed.data.pin);
  if ("error" in result) return { error: result.error };
  redirect("/family");
}
