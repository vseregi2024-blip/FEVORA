import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth";
import { getFamilyCategories } from "@/server/family";

export const runtime = "nodejs";

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

  const input = await request.formData();
  const audio = input.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return NextResponse.json({ error: "Запись звука пустая." }, { status: 400 });
  if (audio.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Запись слишком длинная." }, { status: 413 });

  const categories = await getFamilyCategories(user.id);
  const body = new FormData();
  body.set("file", audio, audio.name || "family-voice.webm");
  body.set("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-transcribe");
  body.set("response_format", "json");
  body.set("prompt", `Финансовая запись на русском или украинском, возможна смешанная речь. Категории пользователя: ${categories.map((item) => item.name).join(", ")}. Валюта: гривна, UAH.`);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body, signal: AbortSignal.timeout(45_000) });
    if (!response.ok) { console.error("OpenAI transcription failed", response.status, await response.text()); return NextResponse.json({ error: "Не удалось распознать речь. Попробуйте ещё раз." }, { status: 502 }); }
    const result = await response.json() as { text?: string };
    const transcript = result.text?.trim();
    if (!transcript) return NextResponse.json({ error: "Не расслышала. Повторите, пожалуйста." }, { status: 422 });
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("OpenAI transcription error", error);
    return NextResponse.json({ error: "Сервис распознавания временно недоступен." }, { status: 502 });
  }
}
