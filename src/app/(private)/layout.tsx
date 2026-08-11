import Link from "next/link";

import { logoutAction } from "./actions";
import { requireUser } from "@/server/auth";

export const dynamic = "force-dynamic";

const links = [
  ["/dashboard", "Головна"],
  ["/finance", "Фінанси"],
  ["/family", "Сімʼя"],
  ["/poultry", "Птахівництво"],
  ["/settings", "Налаштування"],
] as const;

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <div className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand">FEVORA</Link><nav>{links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav><div className="profile"><span>{user.name || user.email}</span><form action={logoutAction}><button className="text-button">Вийти</button></form></div></aside><main className="app-main">{children}</main><nav className="bottom-nav">{links.slice(0, 3).map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav></div>;
}
