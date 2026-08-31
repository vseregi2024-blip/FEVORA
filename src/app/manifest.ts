import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FEVORA",
    short_name: "FEVORA",
    description: "Личный семейный финансовый учёт",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f5ef",
    theme_color: "#547967",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
