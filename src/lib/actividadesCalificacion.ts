import { db } from "@/src/firebase";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { toNumberPuntos } from "@/src/lib/categoriasPuntos";

export type CatalogoCalificacion = {
  id: string;
  nombre: string;
  puntos: number;
};

export type ConquistadorRegistro = {
  id: string;
  pin: string;
  nombre: string;
  unidad: string;
};

function normalizarTextoBusqueda(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Quita filas repetidas (mismo PIN, nombre y unidad en varios documentos). */
export function dedupeConquistadoresRegistro(
  lista: ConquistadorRegistro[]
): ConquistadorRegistro[] {
  const visto = new Map<string, ConquistadorRegistro>();
  for (const c of lista) {
    const key = `${String(c.pin).trim()}|${normalizarTextoBusqueda(c.nombre)}|${normalizarTextoBusqueda(c.unidad)}`;
    if (!visto.has(key)) visto.set(key, c);
  }
  return Array.from(visto.values());
}

/** Prioriza coincidencia en el nombre; 99 = no coincide. */
export function puntajeBusquedaConquistador(
  c: ConquistadorRegistro,
  termino: string
): number {
  const t = normalizarTextoBusqueda(termino);
  if (!t) return 0;
  const nombre = normalizarTextoBusqueda(c.nombre);
  const pin = String(c.pin).toLowerCase();
  const unidad = normalizarTextoBusqueda(c.unidad);

  if (nombre === t) return 0;
  if (nombre.startsWith(t)) return 1;
  if (nombre.split(/\s+/).some((p) => p.startsWith(t))) return 2;
  if (nombre.includes(t)) return 3;
  if (pin.includes(t)) return 4;
  if (unidad.includes(t)) return 5;
  return 99;
}

export function filtrarConquistadoresBusqueda(
  lista: ConquistadorRegistro[],
  termino: string
): ConquistadorRegistro[] {
  const t = termino.trim();
  if (!t) return lista;
  return lista
    .map((c) => ({ c, score: puntajeBusquedaConquistador(c, t) }))
    .filter((x) => x.score < 99)
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.c.nombre.localeCompare(b.c.nombre, "es")
    )
    .map((x) => x.c);
}

export type ConsejeroRegistro = {
  listaId: string;
  consejeroDocId: string;
  pin: string;
  nombre: string;
  unidades: string[];
  rol: "consejero" | "asociado";
  /** Solo si rol === "asociado": nombre del consejero titular del registro. */
  consejeroTitular?: string;
};

type ConsejeroFirestore = {
  nombre?: string;
  pin?: string;
  unidades?: string[];
  consejeroAsociado?: string;
};

/** Clave en calificacionesConquis: PIN del consejero o consejero_{docId} si no tiene PIN. */
export function pinCalificacionesConsejero(consejero: { id: string; pin?: string }): string {
  const pin = (consejero.pin || "").trim();
  return pin || `consejero_${consejero.id}`;
}

/** Clave en calificacionesConquis para el consejero asociado de un registro. */
export function pinCalificacionesAsociado(consejeroDocId: string): string {
  return `asociado_${consejeroDocId}`;
}

/** Un registro en consejeros → fila del consejero + fila del asociado (si existe). */
export function expandirConsejerosYAsociados(
  docs: { id: string; data: () => ConsejeroFirestore }[]
): ConsejeroRegistro[] {
  const lista: ConsejeroRegistro[] = [];

  for (const d of docs) {
    const data = d.data();
    const unidades = Array.isArray(data.unidades) ? data.unidades.filter(Boolean) : [];
    const nombreTitular = (data.nombre || "Sin nombre").trim();
    const pinTitular = pinCalificacionesConsejero({ id: d.id, pin: data.pin });

    lista.push({
      listaId: d.id,
      consejeroDocId: d.id,
      pin: pinTitular,
      nombre: nombreTitular,
      unidades,
      rol: "consejero",
    });

    const nombreAsociado = (data.consejeroAsociado || "").trim();
    if (nombreAsociado) {
      lista.push({
        listaId: `${d.id}_asociado`,
        consejeroDocId: d.id,
        pin: pinCalificacionesAsociado(d.id),
        nombre: nombreAsociado,
        unidades,
        rol: "asociado",
        consejeroTitular: nombreTitular,
      });
    }
  }

  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function clavePuntosCatalogo(catalogoId: string): string {
  return `actividad_${catalogoId}`;
}

export function esCatalogoAdminCalificaciones(data: Record<string, unknown>): boolean {
  const pin = data.pin;
  return pin === undefined || pin === null || String(pin).trim() === "";
}

export async function aplicarCalificacionCatalogo(params: {
  pin: string;
  nombre: string;
  catalogo: CatalogoCalificacion;
  fecha: string;
  origen:
    | "admin_individual"
    | "admin_grupo"
    | "admin_aspirante_individual"
    | "admin_aspirante_grupo"
    | "admin_consejero_individual"
    | "admin_consejero_grupo";
}): Promise<void> {
  const { pin, nombre, catalogo, fecha, origen } = params;
  const pinKey = String(pin).trim();
  if (!pinKey) return;

  const puntosAgregar = catalogo.puntos;
  if (puntosAgregar <= 0) return;

  const catKey = clavePuntosCatalogo(catalogo.id);
  const ref = doc(db, "calificacionesConquis", pinKey);
  const snap = await getDoc(ref);

  const puntosActuales: Record<string, unknown> = snap.exists()
    ? (snap.data().puntos as Record<string, unknown>) || {}
    : {};

  const valorPrevio = toNumberPuntos(puntosActuales[catKey]);
  const puntosActualizados = {
    ...puntosActuales,
    [catKey]: valorPrevio + puntosAgregar,
  };

  const etiquetasPrevias: Record<string, string> = snap.exists()
    ? ((snap.data().etiquetasActividades as Record<string, string>) || {})
    : {};

  await setDoc(
    ref,
    {
      pin: pinKey,
      nombre,
      puntos: puntosActualizados,
      etiquetasActividades: {
        ...etiquetasPrevias,
        [catKey]: catalogo.nombre,
      },
      fechaUltima: fecha,
    },
    { merge: true }
  );

  await addDoc(collection(db, "calificacionesSemanal"), {
    pin: pinKey,
    fecha,
    origen,
    catalogoId: catalogo.id,
    catalogoNombre: catalogo.nombre,
    puntos: { [catKey]: puntosAgregar },
    totalEvento: puntosAgregar,
  });
}
