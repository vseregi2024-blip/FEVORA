"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PoultryRouteNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nested = pathname.split("/").filter(Boolean).length > 2;
  const requested = searchParams.get("returnTo");
  const returnTo = requested?.startsWith("/poultry") && !requested.startsWith("//") ? requested : null;

  if (!nested) return null;
  return <nav className="poultry-route-navigation compact-back" aria-label="Переход назад">
    {nested && (returnTo ? <Link href={returnTo} className="text-link">← Назад</Link> : <button type="button" className="text-link" onClick={() => router.back()}>← Назад</button>)}
  </nav>;
}
