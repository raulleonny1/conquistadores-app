/** Normaliza nombres de unidad para comparar (mayúsculas, acentos, "del"/"de"). */
export function normalizarUnidad(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\bdel\b/g, "de")
    .replace(/\s+/g, " ");
}

/** Usa el nombre oficial del catálogo `unidades` si hay equivalencia normalizada. */
export function canonicalizarUnidad(nombre: string, catalogo: string[]): string {
  if (!nombre) return nombre;
  const norm = normalizarUnidad(nombre);
  const oficial = catalogo.find((u) => normalizarUnidad(u) === norm);
  return oficial ?? nombre.trim();
}

export function consejeroAsesoraUnidad(
  unidadesConsejero: string[] | undefined,
  unidad: string
): boolean {
  if (!unidad || !Array.isArray(unidadesConsejero)) return false;
  const norm = normalizarUnidad(unidad);
  return unidadesConsejero.some((u) => normalizarUnidad(u) === norm);
}

/** Comparación flexible de nombres de unidad o asociación (ej. «del» vs «de»). */
export function nombreGrupoCoincide(a: string, b: string): boolean {
  if (!a.trim() || !b.trim()) return false;
  return normalizarUnidad(a) === normalizarUnidad(b);
}
