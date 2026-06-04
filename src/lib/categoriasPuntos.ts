/** Categorías oficiales de puntos (calificacionesConquis) — misma lista en admin, consejero y dashboards. */
export const CATEGORIAS_PUNTOS = [
  { id: "puntualidad", nombre: "Puntualidad" },
  { id: "asistencia", nombre: "Asistencia" },
  { id: "disciplina", nombre: "Disciplina" },
  { id: "reclutador", nombre: "Reclutador" },
  { id: "materiales", nombre: "Materiales" },
  { id: "fidelidad", nombre: "Fidelidad Eclesiástica" },
  { id: "misionero", nombre: "Misionero" },
  { id: "colaborador", nombre: "Colaborador" },
  { id: "orden_cerrado", nombre: "Orden Cerrado" },
  { id: "tareas", nombre: "Completar Tareas" },
  { id: "especialidades", nombre: "Especialidades" },
] as const;

export type CategoriaPuntosId = (typeof CATEGORIAS_PUNTOS)[number]["id"];

/** Acumula puntos quitados del total (no toca categorías ni actividades). */
export const CLAVE_RESTA_GENERAL = "ajuste_resta";

const IDS_OFICIALES = new Set<string>(CATEGORIAS_PUNTOS.map((c) => c.id));

export function toNumberPuntos(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") return parseInt(value, 10) || 0;
  return 0;
}

export function nombreCategoria(id: string): string {
  if (id === CLAVE_RESTA_GENERAL) return "Resta de puntos";
  const found = CATEGORIAS_PUNTOS.find((c) => c.id === id);
  if (found) return found.nombre;
  return id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Solo categorías con puntos > 0, en orden oficial. */
export function getCategoriasConPuntos(
  puntos: Record<string, unknown> | undefined | null,
  etiquetasActividades?: Record<string, string> | null
): { id: string; nombre: string; valor: number }[] {
  if (!puntos) return [];

  const resultado: { id: string; nombre: string; valor: number }[] = [];

  const nombreMostrar = (key: string) =>
    etiquetasActividades?.[key]?.trim() || nombreCategoria(key);

  for (const cat of CATEGORIAS_PUNTOS) {
    const valor = toNumberPuntos(puntos[cat.id]);
    if (valor > 0) {
      resultado.push({ id: cat.id, nombre: cat.nombre, valor });
    }
  }

  for (const key of Object.keys(puntos)) {
    if (IDS_OFICIALES.has(key) || key === CLAVE_RESTA_GENERAL) continue;
    const valor = toNumberPuntos(puntos[key]);
    if (valor > 0) {
      resultado.push({ id: key, nombre: nombreMostrar(key), valor });
    }
  }

  return resultado;
}

/** Total de puntos del miembro (categorías y actividades menos restas generales). */
export function sumarPuntos(
  puntos: Record<string, unknown> | undefined | null,
  etiquetasActividades?: Record<string, string> | null
): number {
  const bruto = getCategoriasConPuntos(puntos, etiquetasActividades).reduce(
    (acc, c) => acc + c.valor,
    0
  );
  const resta = toNumberPuntos(puntos?.[CLAVE_RESTA_GENERAL]);
  return Math.max(0, bruto - resta);
}

/** Clave de documento en calificacionesConquis (siempre el PIN de acceso). */
export function clavePinCalificaciones(
  data: { pin?: unknown } | null | undefined,
  docId: string
): string {
  return String(data?.pin ?? docId).trim();
}

/**
 * Índice pin → total de puntos desde la colección calificacionesConquis.
 * Si hay varios documentos con el mismo PIN, se usa el total más alto (evita doble conteo).
 */
export function indexarTotalesPorPin(
  docs: { id: string; data: () => Record<string, unknown> }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const d of docs) {
    const data = d.data();
    const pinKey = clavePinCalificaciones(data, d.id);
    if (!pinKey) continue;
    const total = sumarPuntos(
      data.puntos as Record<string, unknown> | undefined,
      data.etiquetasActividades as Record<string, string> | undefined
    );
    map[pinKey] = Math.max(map[pinKey] ?? 0, total);
  }
  return map;
}

/** Columnas del historial semanal: solo categorías que aparecen con puntos en algún registro. */
export function getCategoriasEnHistorial(
  historial: { puntos?: Record<string, unknown> }[]
): { id: string; nombre: string }[] {
  const conValor = new Set<string>();
  for (const reg of historial) {
    if (!reg.puntos) continue;
    for (const key of Object.keys(reg.puntos)) {
      if (toNumberPuntos(reg.puntos[key]) > 0) conValor.add(key);
    }
  }
  const cols = CATEGORIAS_PUNTOS.filter((c) => conValor.has(c.id));
  if (conValor.has(CLAVE_RESTA_GENERAL)) {
    return [...cols, { id: CLAVE_RESTA_GENERAL, nombre: "Resta" }];
  }
  return cols;
}
