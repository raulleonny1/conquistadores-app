import { toNumberPuntos } from "@/src/lib/categoriasPuntos";
import { tarjetaGuiaMayor } from "@/src/data/tarjetaGuiaMayor";

const REQUISITOS_GUIA_MAYOR = tarjetaGuiaMayor.flatMap((g) => g.actividades);

/** Orden oficial de clases en el club (Registro Conquis). */
export const CLASES_CONQUIS = [
  "Amigo",
  "Compañero",
  "Explorador",
  "Pionero",
  "Excursionista",
  "Guía",
] as const;

function normalizarClase(clase: string): string {
  return clase.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function indiceClase(clase: string): number {
  const n = normalizarClase(clase);
  return CLASES_CONQUIS.findIndex((c) => normalizarClase(c) === n);
}

/** Siguiente clase en la progresión; null si ya es Guía o clase desconocida al final. */
export function getSiguienteClase(claseActual: string): string | null {
  const idx = indiceClase(claseActual);
  if (idx === -1) return CLASES_CONQUIS[0];
  if (idx >= CLASES_CONQUIS.length - 1) return null;
  return CLASES_CONQUIS[idx + 1];
}

/** Porcentaje de avance en la escala de clases (no requisitos detallados). */
export function getProgresoClasePorcentaje(claseActual: string): number {
  const idx = indiceClase(claseActual);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / CLASES_CONQUIS.length) * 100);
}

export type ResumenTareasMiembro = {
  /** Veces que consejero/admin registró puntos en categoría "tareas" (calificacionesSemanal). */
  tareasRegistradas: number;
  /** Puntos acumulados en categoría "Completar Tareas" (calificacionesConquis). */
  puntosTareas: number;
};

export function resumenTareasDesdeHistorial(
  historial: { puntos?: Record<string, unknown> }[],
  puntosConquis: Record<string, unknown> | null | undefined
): ResumenTareasMiembro {
  const tareasRegistradas = historial.filter(
    (r) => toNumberPuntos(r.puntos?.tareas) > 0
  ).length;
  const puntosTareas = toNumberPuntos(puntosConquis?.tareas);
  return { tareasRegistradas, puntosTareas };
}

export type ProgresoGuiaMayor = {
  completadas: number;
  pendientes: number;
  total: number;
  porcentaje: number;
};

/** Último estado por actividad (evaluacionesGuiaMayor — secretaría/admin). */
export function progresoGuiaMayorDesdeEvaluaciones(
  evaluaciones: { actividad: string; completado: boolean }[]
): ProgresoGuiaMayor {
  const estadoPorActividad = new Map<string, boolean>();
  for (const ev of evaluaciones) {
    if (!REQUISITOS_GUIA_MAYOR.includes(ev.actividad)) continue;
    estadoPorActividad.set(ev.actividad, ev.completado);
  }
  const completadas = REQUISITOS_GUIA_MAYOR.filter((a) => estadoPorActividad.get(a) === true).length;
  const total = REQUISITOS_GUIA_MAYOR.length;
  const pendientes = total - completadas;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
  return { completadas, pendientes, total, porcentaje };
}
