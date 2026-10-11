import type { ReactNode } from "react";

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
  return <details className={`imperia-client-sheet-native ${variant}`}>
    <summary className={`imperia-client-sheet-trigger ${variant}`}>{trigger}{variant !== "card" && <AppIcon name="arrow"/>}</summary>
    <section className="imperia-client-sheet" aria-label={title}>
      <header><div><p>{eyebrow}</p><h2>{title}</h2>{description && <span>{description}</span>}</div></header>
      <div className="imperia-client-sheet-body">{children}</div>
    </section>
  </details>;
}
