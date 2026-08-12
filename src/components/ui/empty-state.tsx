import Link from "next/link";

export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <section className="empty-state"><span className="empty-mark">✦</span><h2>{title}</h2><p>{description}</p>{href && action && <Link href={href} className="button primary">{action}</Link>}</section>;
}
