import Link from "next/link";
import type { ReactNode } from "react";

export function PoultryFormActions({ cancelHref, children }: { cancelHref: string; children: ReactNode }) {
  return <div className="poultry-form-actions">{children}<Link href={cancelHref} className="button secondary">Отмена / Назад</Link></div>;
}
