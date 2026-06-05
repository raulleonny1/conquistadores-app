import { CLASES_JA } from "@/src/constants/ja";
import { insigniasDeClaseJA } from "@/src/data/insigniasJA";
import { normalizarInsignias } from "@/src/lib/progresoAventurero";

export { normalizarInsignias };

function normalizarClase(clase: string): string {
  return clase.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function indiceClaseJA(clase: string): number {
  const n = normalizarClase(clase);
  return CLASES_JA.findIndex((c) => normalizarClase(c.nombre) === n);
}

export function getSiguienteClaseJA(claseActual: string): string | null {
  const idx = indiceClaseJA(claseActual);
  if (idx === -1) return CLASES_JA[0]?.nombre ?? null;
  if (idx >= CLASES_JA.length - 1) return null;
  return CLASES_JA[idx + 1].nombre;
}

export function progresoInsigniasClaseJA(
  clase: string,
  insignias: Record<string, boolean>
) {
  const catalogo = insigniasDeClaseJA(clase);
  const lista = catalogo.map((ins) => ({
    ...ins,
    completada: insignias[ins.id] === true,
  }));
  const completadas = lista.filter((i) => i.completada).length;
  const total = lista.length;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
  return { completadas, total, porcentaje, insignias: lista };
}

export function puedePromoverClaseJA(clase: string, insignias: Record<string, boolean>): boolean {
  const p = progresoInsigniasClaseJA(clase, insignias);
  return p.total > 0 && p.completadas === p.total && getSiguienteClaseJA(clase) !== null;
}

export function progresoProgramaJA(clase: string, insignias: Record<string, boolean>): number {
  const idx = indiceClaseJA(clase);
  if (idx === -1) return 0;
  const clasesTotal = CLASES_JA.length;
  const baseClase = (idx / clasesTotal) * 100;
  const enClase = progresoInsigniasClaseJA(clase, insignias).porcentaje / clasesTotal;
  return Math.min(100, Math.round(baseClase + enClase));
}
