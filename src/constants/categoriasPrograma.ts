export const CATEGORIAS_AVENTUREROS = [
  { id: "participacion", nombre: "Participación" },
  { id: "puntualidad", nombre: "Puntualidad" },
  { id: "estudio_biblico", nombre: "Estudio bíblico" },
  { id: "ayuda_hogar", nombre: "Ayuda en el hogar" },
  { id: "actividades_clase", nombre: "Actividades de clase" },
  { id: "servicio", nombre: "Servicio" },
] as const;

export const CATEGORIAS_JA = [
  { id: "asistencia", nombre: "Asistencia" },
  { id: "liderazgo", nombre: "Liderazgo" },
  { id: "espiritual", nombre: "Vida espiritual" },
  { id: "servicio", nombre: "Servicio" },
  { id: "proyecto", nombre: "Proyecto JA" },
] as const;

export type ColeccionCalificacionesPrograma = "calificacionesAventureros" | "calificacionesJA";

export const COLECCION_POR_PROGRAMA: Record<
  "aventureros" | "ja",
  ColeccionCalificacionesPrograma
> = {
  aventureros: "calificacionesAventureros",
  ja: "calificacionesJA",
};
