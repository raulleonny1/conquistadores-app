import type { InsigniaDef } from "@/src/data/insigniasAventureros";

export const INSIGNIAS_JA_POR_CLASE: Record<string, InsigniaDef[]> = {
  "Amigo JA": [
    { id: "ja-am-biblia", nombre: "Estudio bíblico", area: "Espiritual" },
    { id: "ja-am-servicio", nombre: "Servicio en iglesia", area: "Misionero" },
    { id: "ja-am-liderazgo", nombre: "Liderazgo básico", area: "Liderazgo" },
  ],
  "Compañero JA": [
    { id: "ja-co-evangelismo", nombre: "Evangelismo personal", area: "Misionero" },
    { id: "ja-co-salud", nombre: "Salud y bienestar", area: "Salud" },
    { id: "ja-co-proyecto", nombre: "Proyecto comunitario", area: "Servicio" },
  ],
  "Explorador JA": [
    { id: "ja-ex-aventura", nombre: "Aventura y naturaleza", area: "Aire libre" },
    { id: "ja-ex-oratoria", nombre: "Oratoria y comunicación", area: "Habilidades" },
    { id: "ja-ex-discipulado", nombre: "Discipulado", area: "Espiritual" },
  ],
  "Guía JA": [
    { id: "ja-gu-mentoria", nombre: "Mentoría de jóvenes", area: "Liderazgo" },
    { id: "ja-gu-mision", nombre: "Misión local", area: "Misionero" },
    { id: "ja-gu-proyecto", nombre: "Proyecto de impacto", area: "Servicio" },
  ],
  "Guía Mayor JA": [
    { id: "ja-gm-directiva", nombre: "Servicio en directiva", area: "Liderazgo" },
    { id: "ja-gm-capacitacion", nombre: "Capacitación de líderes", area: "Liderazgo" },
    { id: "ja-gm-legado", nombre: "Legado y graduación", area: "Graduación" },
  ],
};

export function insigniasDeClaseJA(clase: string): InsigniaDef[] {
  return INSIGNIAS_JA_POR_CLASE[clase] ?? [];
}
