import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Kiosco",
    short_name: "Mi Kiosco",
    description: "Punto de venta y gestión del kiosco",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#087c59",
    lang: "es-AR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
