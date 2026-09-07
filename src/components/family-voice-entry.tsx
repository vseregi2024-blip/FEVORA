"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { VoiceDraft, VoiceMissingField } from "@/features/family/voice";

type Phase = "idle" | "listening" | "processing" | "review" | "saving" | "saved" | "error";
const todayKyiv = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const emptyDraft = (): VoiceDraft => ({ operationType: null, amount: null, categoryId: null, categoryName: null, comment: null, date: todayKyiv() });

export function FamilyVoiceEntry() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [draft, setDraft] = useState<VoiceDraft>(emptyDraft);
  const [question, setQuestion] = useState("Расскажите о расходе или доходе.");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [awaitingField, setAwaitingField] = useState<VoiceMissingField | null>(null);
  const requestId = useRef("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const ignoreStoppedRecording = useRef(false);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "ru-RU"; utterance.rate = .96;
    window.speechSynthesis.speak(utterance);
  };
  const cleanupRecorder = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; recorder.current = null; };
  const close = () => {
    ignoreStoppedRecording.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    cleanupRecorder(); window.speechSynthesis?.cancel(); setOpen(false); setPhase("idle");
  };
  const fail = (message: string) => { cleanupRecorder(); setError(message); setPhase("error"); speak(message); };

  const confirm = async (nextDraft = draft) => {
    if (saving.current) return;
    saving.current = true; setPhase("saving"); setError("");
    try {
      const response = await fetch("/api/family/voice/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: requestId.current, draft: nextDraft }) });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "Не удалось сохранить операцию.");
      setPhase("saved"); setQuestion("Сохранено"); speak("Сохранено"); router.refresh();
      window.setTimeout(() => { setOpen(false); setPhase("idle"); }, 900);
    } catch (cause) { fail(cause instanceof Error ? cause.message : "Не удалось сохранить операцию."); }
    finally { saving.current = false; }
  };

  const parseTranscript = async (text: string) => {
    const response = await fetch("/api/family/voice/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript: text, awaitingField, draft }) });
    const result = await response.json() as { intent?: "UPDATE" | "CONFIRM" | "CANCEL"; draft?: VoiceDraft; question?: string; awaitingField?: VoiceMissingField | null; canConfirm?: boolean; error?: string };
    if (!response.ok) throw new Error(result.error || "Не удалось разобрать запись.");
    if (result.intent === "CANCEL") { speak("Отменено"); close(); return; }
    if (!result.draft || !result.question) throw new Error("Получен неполный ответ.");
    setDraft(result.draft); setQuestion(result.question); setAwaitingField(result.awaitingField ?? null);
    if (result.intent === "CONFIRM" && result.canConfirm) { await confirm(result.draft); return; }
    setPhase("review"); speak(result.question);
  };

  const processAudio = async (blob: Blob) => {
    setPhase("processing"); setError("");
    try {
      const body = new FormData(); body.set("audio", blob, blob.type.includes("mp4") ? "family-voice.mp4" : "family-voice.webm");
      const response = await fetch("/api/family/voice/transcribe", { method: "POST", body });
      const result = await response.json() as { transcript?: string; error?: string };
      if (!response.ok || !result.transcript) throw new Error(result.error || "Не расслышала. Повторите, пожалуйста.");
      setTranscript(result.transcript); await parseTranscript(result.transcript);
    } catch (cause) { fail(cause instanceof Error ? cause.message : "Не расслышала. Повторите, пожалуйста."); }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) { fail("Голосовая запись не поддерживается этим браузером."); return; }
    window.speechSynthesis?.cancel(); setError(""); ignoreStoppedRecording.current = false;
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const preferred = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const nextRecorder = new MediaRecorder(stream.current, preferred ? { mimeType: preferred } : undefined); chunks.current = [];
      nextRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      nextRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: nextRecorder.mimeType || preferred || "audio/webm" });
        cleanupRecorder();
        if (!ignoreStoppedRecording.current) void processAudio(blob);
      };
      recorder.current = nextRecorder; nextRecorder.start(); setPhase("listening");
      timer.current = setTimeout(() => { if (nextRecorder.state === "recording") nextRecorder.stop(); }, 20_000);
    } catch { fail("Нет доступа к микрофону. Разрешите его в настройках браузера."); }
  };
  const openVoice = () => { requestId.current = crypto.randomUUID(); setDraft(emptyDraft()); setTranscript(""); setQuestion("Расскажите о расходе или доходе."); setAwaitingField(null); setError(""); setOpen(true); setPhase("idle"); void startRecording(); };
  const stopRecording = () => { if (recorder.current?.state === "recording") recorder.current.stop(); };

  return <>
    <button type="button" className="family-voice-trigger" aria-label="Добавить голосом" onClick={openVoice}><span aria-hidden="true">🎙</span><small>Голос</small></button>
    {open && <div className="family-voice-backdrop"><section className="family-voice-sheet" role="dialog" aria-modal="true" aria-labelledby="family-voice-title"><header><div><p>AI-приёмщик</p><h2 id="family-voice-title">Голосовая операция</h2></div><button type="button" onClick={close} aria-label="Закрыть">×</button></header>
      <div className={`family-voice-status ${phase}`}><i aria-hidden="true">🎙</i><b>{phase === "listening" ? "Слушаю…" : phase === "processing" ? "Обрабатываю…" : phase === "saving" ? "Сохраняю…" : phase === "saved" ? "Сохранено" : phase === "error" ? "Нужен повтор" : "Проверьте операцию"}</b></div>
      <article className="family-voice-card"><span>{draft.operationType === "EXPENSE" ? "РАСХОД" : draft.operationType === "INCOME" ? "ДОХОД" : "ТИП НЕ ОПРЕДЕЛЁН"}</span><strong>{draft.amount ? `${Number(draft.amount).toLocaleString("ru-RU")} ₴` : "Сумма не указана"}</strong><dl><div><dt>Категория</dt><dd>{draft.categoryName || "Не выбрана"}</dd></div><div><dt>Комментарий</dt><dd>{draft.comment || "—"}</dd></div><div><dt>Дата</dt><dd>{draft.date === todayKyiv() ? "Сегодня" : draft.date}</dd></div></dl></article>
      {transcript && <p className="family-voice-transcript">«{transcript}»</p>}<p className="family-voice-question">{question}</p>{error && <p className="family-voice-error">{error}</p>}
      <div className="family-voice-actions">{phase === "listening" ? <button type="button" className="voice-stop" onClick={stopRecording}>Остановить запись</button> : phase === "processing" || phase === "saving" || phase === "saved" ? <button type="button" disabled>Подождите…</button> : <><button type="button" className="voice-listen" onClick={() => void startRecording()}>🎙 {error ? "Повторить" : "Ответить голосом"}</button><button type="button" className="voice-confirm" disabled={!draft.operationType || !draft.amount || !draft.categoryId} onClick={() => void confirm()}>Сохранить</button></>}<button type="button" className="voice-cancel" onClick={close}>Отмена</button></div>
      <small className="family-voice-note">Операция не попадёт в журнал до вашего подтверждения.</small>
    </section></div>}
  </>;
}
