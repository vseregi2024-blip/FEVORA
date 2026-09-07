import { NextResponse } from "next/server";

import { applyVoicePatch, missingVoiceFields, voiceParseRequestSchema, voicePatchSchema, voiceQuestion } from "@/features/family/voice";
import { todayInputValue } from "@/lib/dates";
import { getCurrentUser } from "@/server/auth";
import { getFamilyCategories } from "@/server/family";

export const runtime = "nodejs";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};

function responseText(result: OpenAIResponse) {
  if (result.output_text) return result.output_text;
  for (const item of result.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return null;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.headers.get("host"); } catch { return false; }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нужно войти в FEVORA." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Запрос отклонён." }, { status: 403 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Голосовой ввод ещё не настроен." }, { status: 503 });
  const parsed = voiceParseRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный голосовой черновик." }, { status: 400 });

  const categories = await getFamilyCategories(user.id);
  const categoryOptions = categories.map((item) => ({ id: item.id, name: item.name, kind: item.kind }));
  const schema = {
    type: "object", additionalProperties: false,
    properties: {
      intent: { type: "string", enum: ["UPDATE", "CONFIRM", "CANCEL", "UNKNOWN"] },
      changedFields: { type: "array", items: { type: "string", enum: ["operationType", "amount", "categoryId", "comment", "date"] } },
      operationType: { type: ["string", "null"], enum: ["INCOME", "EXPENSE", null] },
      amount: { type: ["number", "null"] },
      categoryId: { type: ["string", "null"] },
      comment: { type: ["string", "null"] },
      date: { type: ["string", "null"] },
    },
    required: ["intent", "changedFields", "operationType", "amount", "categoryId", "comment", "date"],
  };
  const instructions = `Ты узкий приёмщик финансовых операций Family. Не давай советов и не отвечай на вопросы. В input находится JSON с transcript, текущим draft и awaitingField. Всегда сначала прочитай transcript пользователя.
Извлекай только расход/доход, сумму UAH, одну существующую категорию, комментарий и дату. Сегодня в Europe/Kyiv: ${todayInputValue()}. Категории: ${JSON.stringify(categoryOptions)}. Никогда не придумывай categoryId.
Если это первое описание и поля draft пустые, intent=UPDATE, а changedFields обязательно содержит каждое распознанное поле. Например «потратила 450 на продукты в АТБ» означает operationType=EXPENSE, amount=450, categoryId категории «Продукты», comment="АТБ" и changedFields=["operationType","amount","categoryId","comment"]. Не оставляй распознанные значения null.
Если это исправление существующего draft, intent=UPDATE и changedFields содержит только реально исправляемые поля; остальные значения не меняй. Если пользователь отвечает коротко на awaitingField, трактуй ответ как это поле.
Для подтверждения («да», «сохрани», «подтверждаю») используй CONFIRM и changedFields=[]. Для отмены используй CANCEL и changedFields=[]. Магазин, аптека или источник дохода обычно являются comment, а не новой категорией. Дату добавляй в changedFields только если пользователь назвал дату или относительный день.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_VOICE_PARSER_MODEL || "gpt-5-mini", store: false, instructions, input: JSON.stringify(parsed.data), text: { format: { type: "json_schema", name: "family_voice_patch", strict: true, schema } } }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) { console.error("OpenAI voice parser failed", response.status, await response.text()); return NextResponse.json({ error: "Не удалось разобрать запись. Повторите, пожалуйста." }, { status: 502 }); }
    const result = await response.json() as OpenAIResponse;
    const patch = voicePatchSchema.parse(JSON.parse(responseText(result) || "{}"));
    if (patch.intent === "CANCEL") return NextResponse.json({ intent: "CANCEL" });
    let draft = applyVoicePatch(parsed.data.draft, patch, categoryOptions);
    if (draft.categoryId) {
      const selected = categories.find((item) => item.id === draft.categoryId);
      if (!selected || (draft.operationType && selected.kind !== "BOTH" && selected.kind !== draft.operationType)) draft = { ...draft, categoryId: null, categoryName: null };
    }
    const question = voiceQuestion(draft);
    const canConfirm = missingVoiceFields(draft).length === 0;
    return NextResponse.json({ intent: patch.intent === "CONFIRM" && canConfirm ? "CONFIRM" : "UPDATE", draft, question: question.text, awaitingField: question.awaitingField, canConfirm });
  } catch (error) {
    console.error("OpenAI voice parser error", error);
    return NextResponse.json({ error: "Не удалось обработать голосовую запись." }, { status: 502 });
  }
}
