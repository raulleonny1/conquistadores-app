import { db } from "@/src/firebase";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { CLAVE_RESTA_GENERAL, sumarPuntos, toNumberPuntos } from "@/src/lib/categoriasPuntos";
import { textoMotivoCompleto } from "@/src/lib/motivosRestaPuntos";

export type TipoMovimientoPuntos = "suma" | "resta";

export type OrigenMovimientoPuntos =
  | "admin_individual"
  | "admin_grupo"
  | "admin_aspirante_individual"
  | "admin_aspirante_grupo"
  | "admin_consejero_individual"
  | "admin_consejero_grupo"
  | "admin_resta_individual"
  | "admin_resta_grupo"
  | "admin_resta_aspirante"
  | "admin_resta_consejero"
  | "consejero_individual"
  | "consejero_grupal"
  | "consejero_resta_individual"
  | "consejero_resta_grupal";

export type ResultadoMovimientoPuntos =
  | { ok: true; nuevoValorCategoria: number; totalPuntos: number }
  | { ok: false; mensaje: string };

export async function registrarMovimientoPuntos(params: {
  pin: string;
  nombre: string;
  categoriaId: string;
  cantidad: number;
  fecha: string;
  tipo: TipoMovimientoPuntos;
  origen: OrigenMovimientoPuntos;
  aplicadoPor?: string;
  motivo?: string;
  motivoDetalle?: string;
  catalogoId?: string;
  catalogoNombre?: string;
  etiquetaActividad?: string;
}): Promise<ResultadoMovimientoPuntos> {
  const pinKey = String(params.pin).trim();
  const catKey = String(params.categoriaId).trim();
  const cantidad = Math.floor(Math.abs(params.cantidad));

  if (!pinKey || !catKey) {
    return { ok: false, mensaje: "PIN o categoría inválidos." };
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, mensaje: "La cantidad debe ser mayor a 0." };
  }
  if (!params.fecha?.trim()) {
    return { ok: false, mensaje: "Selecciona una fecha." };
  }

  if (params.tipo === "resta") {
    if (!params.motivo?.trim()) {
      return { ok: false, mensaje: "Indica el motivo de la resta." };
    }
    if (params.motivo === "otro" && !params.motivoDetalle?.trim()) {
      return { ok: false, mensaje: "Especifica el motivo en el campo de detalle." };
    }
  }

  const ref = doc(db, "calificacionesConquis", pinKey);
  const snap = await getDoc(ref);
  const puntosActuales: Record<string, unknown> = snap.exists()
    ? (snap.data().puntos as Record<string, unknown>) || {}
    : {};
  const etiquetasPrevias: Record<string, string> = snap.exists()
    ? ((snap.data().etiquetasActividades as Record<string, string>) || {})
    : {};

  const esRestaGeneral =
    params.tipo === "resta" && catKey === CLAVE_RESTA_GENERAL;

  let nuevoValor: number;

  if (esRestaGeneral) {
    const totalActual = sumarPuntos(puntosActuales, etiquetasPrevias);
    if (cantidad > totalActual) {
      return {
        ok: false,
        mensaje: `El total actual es ${totalActual} pts. No puedes quitar ${cantidad}.`,
      };
    }
    const valorPrevio = toNumberPuntos(puntosActuales[CLAVE_RESTA_GENERAL]);
    nuevoValor = valorPrevio + cantidad;
  } else {
    const valorPrevio = toNumberPuntos(puntosActuales[catKey]);

    if (params.tipo === "resta" && valorPrevio < cantidad) {
      return {
        ok: false,
        mensaje: `Solo hay ${valorPrevio} pts en esta categoría. No puedes quitar ${cantidad}.`,
      };
    }

    nuevoValor =
      params.tipo === "suma"
        ? valorPrevio + cantidad
        : Math.max(0, valorPrevio - cantidad);
  }

  const puntosActualizados = { ...puntosActuales, [catKey]: nuevoValor };

  const patchEtiquetas = { ...etiquetasPrevias };
  if (params.tipo === "suma" && params.etiquetaActividad) {
    patchEtiquetas[catKey] = params.etiquetaActividad;
  }

  await setDoc(
    ref,
    {
      pin: pinKey,
      nombre: params.nombre,
      puntos: puntosActualizados,
      etiquetasActividades: patchEtiquetas,
      fechaUltima: params.fecha,
    },
    { merge: true }
  );

  const historial: Record<string, unknown> = {
    pin: pinKey,
    fecha: params.fecha,
    tipo: params.tipo,
    origen: params.origen,
    categoriaId: catKey,
    puntos: { [catKey]: cantidad },
    totalEvento: cantidad,
  };

  if (params.aplicadoPor) historial.aplicadoPor = params.aplicadoPor;
  if (params.catalogoId) historial.catalogoId = params.catalogoId;
  if (params.catalogoNombre) historial.catalogoNombre = params.catalogoNombre;
  if (params.tipo === "resta") {
    historial.motivo = params.motivo;
    historial.motivoTexto = textoMotivoCompleto(
      params.motivo!,
      params.motivoDetalle
    );
    if (params.motivoDetalle?.trim()) {
      historial.motivoDetalle = params.motivoDetalle.trim();
    }
  }

  await addDoc(collection(db, "calificacionesSemanal"), historial);

  const totalPuntos = sumarPuntos(puntosActualizados, patchEtiquetas);

  return { ok: true, nuevoValorCategoria: nuevoValor, totalPuntos };
}

export async function aplicarRestaPuntos(params: {
  pin: string;
  nombre: string;
  cantidad: number;
  fecha: string;
  motivo: string;
  motivoDetalle?: string;
  origen: OrigenMovimientoPuntos;
  aplicadoPor?: string;
}): Promise<ResultadoMovimientoPuntos> {
  return registrarMovimientoPuntos({
    ...params,
    categoriaId: CLAVE_RESTA_GENERAL,
    tipo: "resta",
  });
}

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
  aplicadoPor?: string;
}): Promise<ResultadoMovimientoPuntos> {
  const { pin, nombre, catalogo, fecha, origen, aplicadoPor } = params;
  const pinKey = String(pin).trim();
  if (!pinKey) return { ok: false, mensaje: "PIN inválido." };

  const puntosAgregar = catalogo.puntos;
  if (puntosAgregar <= 0) return { ok: false, mensaje: "La actividad no tiene puntos." };

  const catKey = clavePuntosCatalogo(catalogo.id);
  return registrarMovimientoPuntos({
    pin: pinKey,
    nombre,
    categoriaId: catKey,
    cantidad: puntosAgregar,
    fecha,
    tipo: "suma",
    origen,
    aplicadoPor,
    catalogoId: catalogo.id,
    catalogoNombre: catalogo.nombre,
    etiquetaActividad: catalogo.nombre,
  });
}
