import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frame — OCG Price Lookup",
    short_name: "Frame",
    description:
      "Look up going prices for Yu-Gi-Oh! OCG Japanese cards at the shop counter.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0B1F33",
    theme_color: "#0B1F33",
    lang: "en",
    categories: ["business", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
