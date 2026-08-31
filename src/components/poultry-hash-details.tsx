"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PoultryHashDetails() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const openTarget = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (target instanceof HTMLDetailsElement) target.open = true;
    };
    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, [pathname, searchParams]);

  return null;
}
