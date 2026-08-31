import { Suspense, type ReactNode } from "react";

import { PoultryRouteNavigation } from "@/components/poultry-route-navigation";
import { PoultrySuccessNotice } from "@/components/poultry-success-notice";
import { PoultryHashDetails } from "@/components/poultry-hash-details";

export default function PoultryLayout({ children }: { children: ReactNode }) {
  return <>
    <Suspense><PoultryRouteNavigation /><PoultrySuccessNotice /><PoultryHashDetails /></Suspense>
    {children}
  </>;
}
