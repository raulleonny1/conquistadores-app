import { CLASES_AVENTUREROS } from "@/src/constants/aventureros";
import { insigniasDeClase } from "@/src/data/insigniasAventureros";

function normalizarClase(clase: string): string {
  return clase.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function indiceClaseAventurero(clase: string): number {
  const n = normalizarClase(clase);
  return CLASES_AVENTUREROS.findIndex((c) => normalizarClase(c.nombre) === n);
}

export function getSiguienteClaseAventurero(claseActual: string): string | null {
  const idx = indiceClaseAventurero(claseActual);
  if (idx === -1) return CLASES_AVENTUREROS[0]?.nombre ?? null;
  if (idx >= CLASES_AVENTUREROS.length - 1) return null;
  return CLASES_AVENTUREROS[idx + 1].nombre;
}

export function normalizarInsignias(
  raw: Record<string, unknown> | undefined | null
): Record<string, boolean> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === true) out[k] = true;
  }
  return out;
}

export type ProgresoInsigniasClase = {
  completadas: number;
  total: number;
  porcentaje: number;
  insignias: { id: string; nombre: string; area: string; completada: boolean }[];
};

export function progresoInsigniasClase(
  clase: string,
  insignias: Record<string, boolean>
): ProgresoInsigniasClase {
  const catalogo = insigniasDeClase(clase);
  const lista = catalogo.map((ins) => ({
    ...ins,
    completada: insignias[ins.id] === true,
  }));
  const completadas = lista.filter((i) => i.completada).length;
  const total = lista.length;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
  return { completadas, total, porcentaje, insignias: lista };
}

export function puedePromoverClase(clase: string, insignias: Record<string, boolean>): boolean {
  const p = progresoInsigniasClase(clase, insignias);
  return p.total > 0 && p.completadas === p.total && getSiguienteClaseAventurero(clase) !== null;
}

/** Avance global en el programa (clases + insignias de la clase actual). */
export function progresoProgramaAventurero(
  clase: string,
  insignias: Record<string, boolean>
): number {
  const idx = indiceClaseAventurero(clase);
  if (idx === -1) return 0;
  const clasesTotal = CLASES_AVENTUREROS.length;
  const baseClase = (idx / clasesTotal) * 100;
  const enClase = progresoInsigniasClase(clase, insignias).porcentaje / clasesTotal;
  return Math.min(100, Math.round(baseClase + enClase));
}
