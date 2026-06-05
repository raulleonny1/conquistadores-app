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

/** Quita el prefijo redundante «Unidad de » (origen habitual de duplicados en el ranking). */
export function quitarPrefijoUnidadDe(nombre: string): string {
  return nombre.trim().replace(/^unidad de\s+/i, "").trim();
}

/** Clave interna para agrupar «Gacelas» y «Unidad de Gacelas». */
export function claveBaseUnidad(nombre: string): string {
  return normalizarUnidad(quitarPrefijoUnidadDe(nombre));
}

/**
 * Usa el nombre oficial del catálogo `unidades`.
 * Empareja «Unidad de Tigres» con «Tigres» y prefiere el nombre corto del catálogo.
 */
export function canonicalizarUnidad(nombre: string, catalogo: string[]): string {
  const trimmed = nombre.trim();
  if (!trimmed) return trimmed;

  const base = claveBaseUnidad(trimmed);
  if (!base) return trimmed;

  const candidatos = catalogo.filter((u) => claveBaseUnidad(u) === base);
  if (candidatos.length > 0) {
    const sinPrefijo = candidatos.find((u) => !/^unidad de\s+/i.test(u.trim()));
    return (sinPrefijo ?? candidatos[0]).trim();
  }

  const exacto = catalogo.find((u) => normalizarUnidad(u) === normalizarUnidad(trimmed));
  if (exacto) return exacto.trim();

  const sinPrefijo = quitarPrefijoUnidadDe(trimmed);
  return sinPrefijo || trimmed;
}

export function consejeroAsesoraUnidad(
  unidadesConsejero: string[] | undefined,
  unidad: string
): boolean {
  if (!unidad || !Array.isArray(unidadesConsejero)) return false;
  const base = claveBaseUnidad(unidad);
  return unidadesConsejero.some((u) => claveBaseUnidad(u) === base);
}

/** Comparación flexible de nombres de unidad o asociación (ej. «del» vs «de», prefijo «Unidad de»). */
export function nombreGrupoCoincide(a: string, b: string): boolean {
  if (!a.trim() || !b.trim()) return false;
  return claveBaseUnidad(a) === claveBaseUnidad(b);
}

/** Nombre preferido al unificar duplicados del catálogo (sin prefijo «Unidad de»). */
export function elegirNombreCanonicoUnidad(nombres: string[]): string {
  const unicos = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))];
  if (unicos.length === 0) return "";
  const sinPrefijo = unicos.find((u) => !/^unidad de\s+/i.test(u));
  if (sinPrefijo) return sinPrefijo;
  return quitarPrefijoUnidadDe(unicos[0]) || unicos[0];
}
