import type { MetadataRoute } from "next";
import {
  LOGO_COMPLETO_SRC,
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from "@/src/constants/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Club Caleb - Conquistadores",
    short_name: "Club Caleb",
    description: "Centro de comando del Club de Conquistadores Caleb",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["education", "lifestyle"],
    icons: [
      {
        src: LOGO_COMPLETO_SRC,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: LOGO_COMPLETO_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: LOGO_COMPLETO_SRC,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
