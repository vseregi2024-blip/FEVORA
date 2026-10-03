"use client";

import { ErrorState } from "@/components/ui/imperia";

export default function PrivateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main><ErrorState action={<button className="imperia-secondary-button" type="button" onClick={reset}>Повторить</button>}/></main>;
}
