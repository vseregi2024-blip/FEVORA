"use client";

export default function PrivateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="empty-state" role="alert"><span className="empty-mark">!</span><h2>Не удалось открыть этот раздел</h2><p>Данные не изменены. Попробуйте обновить страницу.</p><button className="button secondary" type="button" onClick={reset}>Повторить</button></main>;
}
