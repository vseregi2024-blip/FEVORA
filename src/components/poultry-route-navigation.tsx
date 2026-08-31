"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PoultryRouteNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nested = pathname !== "/poultry";
  const requested = searchParams.get("returnTo");
  const returnTo = requested?.startsWith("/poultry") && !requested.startsWith("//") ? requested : null;

  return <nav className="poultry-route-navigation" aria-label="Переходы Птицеводства">
    {nested && (returnTo ? <Link href={returnTo} className="text-link">← Назад</Link> : <button type="button" className="text-link" onClick={() => router.back()}>← Назад</button>)}
    {nested && <Link href="/poultry" className="text-link">Poultry · Обзор</Link>}
    <Link href="/projects" className="text-link">← FEVORA · Проекты</Link>
  </nav>;
}
