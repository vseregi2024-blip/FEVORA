"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Введите имя.").max(80, "Имя слишком длинное."),
  timezone: z.enum(["Europe/Kyiv", "Europe/Warsaw", "Europe/London", "UTC"]),
  defaultCurrency: z.enum(["UAH", "USD", "EUR"]),
});

export async function updateProfileSettingsAction(formData: FormData) {
  const user = await requireUser();
  const input = profileSchema.safeParse({ name: formData.get("name"), timezone: formData.get("timezone"), defaultCurrency: formData.get("defaultCurrency") });
  if (!input.success) redirect(`/family/settings/profile?error=${encodeURIComponent(input.error.issues[0]?.message ?? "Проверьте данные.")}`);
  await prisma.user.update({ where: { id: user.id }, data: input.data });
  ["/family/settings", "/family/settings/profile", "/family", "/safe", "/capital", "/analytics"].forEach((path) => revalidatePath(path));
  redirect("/family/settings/profile?updated=1");
}
