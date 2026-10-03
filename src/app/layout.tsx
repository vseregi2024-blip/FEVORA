import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";

import "./globals.css";
import "./family.css";
import "./imperia-design-system.css";

export const metadata: Metadata = {
  title: "FEVORA",
  description: "Личный финансовый учёт",
  applicationName: "FEVORA",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/fevora-crown-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/fevora-crown-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/fevora-crown-192.png",
    apple: [{ url: "/icons/fevora-crown-apple-touch.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "FEVORA", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b0920" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><PwaRegister/>{children}</body></html>;
}
