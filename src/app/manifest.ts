import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FEVORA IMPERIA",
    short_name: "FEVORA",
    description: "Личный семейный финансовый учёт",
    start_url: "/family",
    scope: "/",
    display: "standalone",
    background_color: "#0b0920",
    theme_color: "#0b0920",
    orientation: "any",
    icons: [
      { src: "/icons/fevora-crown-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/fevora-crown-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/fevora-crown-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
