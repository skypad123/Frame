import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arcadia",
    short_name: "Arcadia",
    description:
      "Arcadia has been wound down. Thank you to our supporters — more projects to come.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a1628",
    theme_color: "#0a1628",
    lang: "en",
    categories: ["lifestyle"],
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
