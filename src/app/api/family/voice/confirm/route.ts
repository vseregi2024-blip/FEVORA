import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { missingVoiceFields, voiceDraftSchema } from "@/features/family/voice";
import { getCurrentUser } from "@/server/auth";
import { createVoiceFamilyOperation, familyOperationSchema } from "@/server/family";

const confirmSchema = z.object({ requestId: z.string().uuid(), draft: voiceDraftSchema });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужно войти в FEVORA." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён." }, { status: 403 });
  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный голосовой черновик." }, { status: 400 });
  if (missingVoiceFields(parsed.data.draft).length) return NextResponse.json({ error: "Заполнены не все обязательные поля." }, { status: 400 });
  const { draft, requestId } = parsed.data;
  const operation = await createVoiceFamilyOperation(user.id, requestId, familyOperationSchema.parse({ type: draft.operationType, amount: draft.amount, operationDate: draft.date, categoryId: draft.categoryId, accountId: null, description: draft.comment || "" }));
  ["/dashboard", "/family", "/family/operations", "/family/analytics", "/reports", "/finance"].forEach((path) => revalidatePath(path));
  return NextResponse.json({ id: operation.id });
}
