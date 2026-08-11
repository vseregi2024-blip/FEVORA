import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "FEVORA",
  description: "Особистий фінансовий облік",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uk"><body>{children}</body></html>;
}
