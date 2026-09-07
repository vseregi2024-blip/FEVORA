import { z } from "zod";

export const voiceDraftSchema = z.object({
  operationType: z.enum(["INCOME", "EXPENSE"]).nullable(),
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/).nullable(),
  categoryId: z.string().cuid().nullable(),
  categoryName: z.string().trim().max(80).nullable(),
  comment: z.string().trim().max(500).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type VoiceDraft = z.infer<typeof voiceDraftSchema>;
export type VoiceMissingField = "operationType" | "amount" | "categoryId";

export const voiceParseRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(2_000),
  awaitingField: z.enum(["operationType", "amount", "categoryId"]).nullable().default(null),
  draft: voiceDraftSchema,
});

export const voicePatchSchema = z.object({
  intent: z.enum(["UPDATE", "CONFIRM", "CANCEL", "UNKNOWN"]),
  changedFields: z.array(z.enum(["operationType", "amount", "categoryId", "comment", "date"])),
  operationType: z.enum(["INCOME", "EXPENSE"]).nullable(),
  amount: z.number().positive().max(999_999_999).nullable(),
  categoryId: z.string().nullable(),
  comment: z.string().max(500).nullable(),
  date: z.string().nullable(),
});

export type VoicePatch = z.infer<typeof voicePatchSchema>;

export function applyVoicePatch(current: VoiceDraft, patch: VoicePatch, categories: Array<{ id: string; name: string }>): VoiceDraft {
  const next = { ...current };
  const changed = new Set(patch.changedFields);
  if (changed.has("operationType") && patch.operationType) next.operationType = patch.operationType;
  if (changed.has("amount") && patch.amount) next.amount = patch.amount.toFixed(2);
  if (changed.has("comment")) next.comment = patch.comment?.trim() || null;
  if (changed.has("date") && patch.date && /^\d{4}-\d{2}-\d{2}$/.test(patch.date)) next.date = patch.date;
  if (changed.has("categoryId")) {
    const category = categories.find((item) => item.id === patch.categoryId);
    next.categoryId = category?.id ?? null;
    next.categoryName = category?.name ?? null;
  }
  return next;
}

export function missingVoiceFields(draft: VoiceDraft): VoiceMissingField[] {
  const missing: VoiceMissingField[] = [];
  if (!draft.operationType) missing.push("operationType");
  if (!draft.amount || Number(draft.amount) <= 0) missing.push("amount");
  if (!draft.categoryId) missing.push("categoryId");
  return missing;
}

export function voiceQuestion(draft: VoiceDraft): { text: string; awaitingField: VoiceMissingField | null } {
  const missing = missingVoiceFields(draft);
  if (missing[0] === "operationType") return { text: "Это расход или доход?", awaitingField: "operationType" };
  if (missing[0] === "amount") return { text: "Какая сумма?", awaitingField: "amount" };
  if (missing[0] === "categoryId") return { text: "Какую категорию выбрать?", awaitingField: "categoryId" };
  const type = draft.operationType === "EXPENSE" ? "Расход" : "Доход";
  const amount = Number(draft.amount).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  const comment = draft.comment ? ` Комментарий: ${draft.comment}.` : "";
  return { text: `${type} ${amount} гривен. Категория: ${draft.categoryName}.${comment} Сохранить?`, awaitingField: null };
}
