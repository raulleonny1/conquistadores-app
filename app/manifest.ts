import type { MetadataRoute } from "next";
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from "@/src/constants/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ConquistadoresApp — Ministerio Joven",
    short_name: "ConquisApp",
    description:
      "Plataforma multi-club para Conquistadores, Aventureros y Jóvenes Adventistas",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["education", "lifestyle"],
    icons: [],
  };
}
