import type { PropsWithChildren, ReactNode } from "react";

export function SectionHeader({ eyebrow, title, action, children }: PropsWithChildren<{ eyebrow?: string; title: string; action?: ReactNode }>) {
  return <section className="section-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{children}</div>{action}</section>;
}
