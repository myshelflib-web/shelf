import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Shelf — Your study library",
    short_name: "Shelf",
    description:
      "Personal study library for UPSC & competitive exams: PDF highlights, Study AI on your notes, planner, and free NCERT curriculum. Install as PWA.",
    start_url: "/my-content",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0c0c0d",
    theme_color: "#0c0c0d",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/pwa/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/shelf-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
