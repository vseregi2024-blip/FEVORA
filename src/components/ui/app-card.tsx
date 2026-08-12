import type { HTMLAttributes, PropsWithChildren } from "react";

export function AppCard({ children, className = "", ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return <article className={`app-card ${className}`.trim()} {...props}>{children}</article>;
}

export function StatusBadge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: "neutral" | "success" | "soon" | "warning" }>) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}
