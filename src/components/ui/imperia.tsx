import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { AppIcon, type AppIconName } from "@/components/ui/icons";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ImperiaCard({ children, className, interactive = false, ...props }: HTMLAttributes<HTMLElement> & { interactive?: boolean }) {
  return <article className={joinClassNames("imperia-card", interactive && "is-interactive", className)} {...props}>{children}</article>;
}

export function IconCircle({ icon, tone = "primary", size = "medium", className }: { icon: AppIconName; tone?: "primary" | "pink" | "orange" | "cyan" | "success"; size?: "small" | "medium" | "large"; className?: string }) {
  return <span className={joinClassNames("imperia-icon-circle", `tone-${tone}`, `size-${size}`, className)} aria-hidden="true"><AppIcon name={icon}/></span>;
}

export function StatCard({ label, value, meta, icon, tone = "primary", trend }: { label: string; value: string; meta?: string; icon?: AppIconName; tone?: "primary" | "pink" | "orange" | "cyan" | "success"; trend?: string }) {
  return <ImperiaCard className="imperia-stat-card">{icon && <IconCircle icon={icon} tone={tone}/>}<span className="imperia-stat-copy"><small>{label}</small><strong>{value}</strong>{meta && <span>{meta}</span>}</span>{trend && <em className={`tone-${tone}`}>{trend}</em>}</ImperiaCard>;
}

export function QuickActionCard({ href, title, subtitle, icon, tone = "primary", active = false }: { href: string; title: string; subtitle?: string; icon: AppIconName; tone?: "primary" | "pink" | "orange" | "cyan" | "success"; active?: boolean }) {
  return <Link href={href} className={joinClassNames("imperia-quick-card", `tone-${tone}`, active && "is-active")} aria-current={active ? "page" : undefined}><IconCircle icon={icon} tone={tone}/><span><b>{title}</b>{subtitle && <small>{subtitle}</small>}</span></Link>;
}

export function ProgressCard({ title, value, progress, meta, icon = "target", tone = "pink" }: { title: string; value?: string; progress: number; meta?: string; icon?: AppIconName; tone?: "primary" | "pink" | "orange" | "cyan" | "success" }) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  return <ImperiaCard className="imperia-progress-card"><IconCircle icon={icon} tone={tone}/><div><span><b>{title}</b>{value && <strong>{value}</strong>}</span>{meta && <small>{meta}</small>}<div className="imperia-progress-track" aria-label={`${title}: ${safeProgress}%`}><i style={{ width: `${safeProgress}%` }}/></div></div><em>{safeProgress}%</em></ImperiaCard>;
}

export function ProjectCard({ href, title, value, meta, icon = "projects", tone = "primary" }: { href: string; title: string; value?: string; meta?: string; icon?: AppIconName; tone?: "primary" | "pink" | "orange" | "cyan" | "success" }) {
  return <Link href={href} className="imperia-project-card"><IconCircle icon={icon} tone={tone}/><span><b>{title}</b>{value && <strong>{value}</strong>}{meta && <small>{meta}</small>}</span><AppIcon name="arrow"/></Link>;
}

export function ImperiaSectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="imperia-section-header"><div>{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2>{description && <span>{description}</span>}</div>{action}</header>;
}

export function ImperiaStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`imperia-status-badge tone-${tone}`}>{children}</span>;
}

export function GradientButton({ children, href, icon, className, type = "button" }: { children: ReactNode; href?: string; icon?: AppIconName; className?: string; type?: "button" | "submit" | "reset" }) {
  const content = <>{icon && <AppIcon name={icon}/>}<span>{children}</span></>;
  const classes = joinClassNames("imperia-gradient-button", className);
  return href ? <Link href={href} className={classes}>{content}</Link> : <button type={type} className={classes}>{content}</button>;
}

export function LoadingState({ title = "Загружаем FEVORA", description = "Проверяем актуальные данные." }: { title?: string; description?: string }) {
  return <section className="imperia-state imperia-loading-state" aria-live="polite" aria-busy="true"><span className="imperia-loader" aria-hidden="true"><i/><i/><i/></span><h2>{title}</h2><p>{description}</p><div className="imperia-skeleton" aria-hidden="true"><i/><i/><i/></div></section>;
}

export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <section className="imperia-state"><IconCircle icon="sparkles" tone="primary" size="large"/><h2>{title}</h2><p>{description}</p>{href && action && <GradientButton href={href}>{action}</GradientButton>}</section>;
}

export function ErrorState({ title = "Не удалось открыть этот раздел", description = "Данные не изменены. Попробуйте ещё раз.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <section className="imperia-state imperia-error-state" role="alert"><IconCircle icon="warning" tone="pink" size="large"/><h2>{title}</h2><p>{description}</p>{action}</section>;
}
