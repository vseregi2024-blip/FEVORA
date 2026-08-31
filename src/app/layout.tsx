import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";
import "./family.css";

export const metadata: Metadata = {
  title: "FEVORA",
  description: "Личный финансовый учёт",
  applicationName: "FEVORA",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  appleWebApp: { capable: true, title: "FEVORA", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#547967" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><PwaRegister/>{children}</body></html>;
}
