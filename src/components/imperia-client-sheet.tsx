"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AppIcon } from "@/components/ui/icons";

type ImperiaClientSheetProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  trigger: ReactNode;
  children: ReactNode;
  variant?: "primary" | "secondary" | "card";
};

export function ImperiaClientSheet({ title, eyebrow = "Карточка клиента", description, trigger, children, variant = "secondary" }: ImperiaClientSheetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <>
    <button type="button" className={`imperia-client-sheet-trigger ${variant}`} onClick={() => setOpen(true)}>{trigger}{variant !== "card" && <AppIcon name="arrow"/>}</button>
    {open && <div className="imperia-client-sheet-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section className="imperia-client-sheet" role="dialog" aria-modal="true" aria-labelledby="imperia-client-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p>{eyebrow}</p><h2 id="imperia-client-sheet-title">{title}</h2>{description && <span>{description}</span>}</div><button type="button" onClick={() => setOpen(false)} aria-label="Закрыть окно">×</button></header>
        <div className="imperia-client-sheet-body">{children}</div>
      </section>
    </div>}
  </>;
}
