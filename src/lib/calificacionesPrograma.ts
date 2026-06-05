import { db } from "@/src/firebase";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import {
  CATEGORIAS_AVENTUREROS,
  CATEGORIAS_JA,
  type ColeccionCalificacionesPrograma,
} from "@/src/constants/categoriasPrograma";
import { CLAVE_RESTA_GENERAL, sumarPuntos, toNumberPuntos } from "@/src/lib/categoriasPuntos";
import type {
  CatalogoCalificacion,
  ResultadoMovimientoPuntos,
} from "@/src/lib/actividadesCalificacion";
import { textoMotivoCompleto } from "@/src/lib/motivosRestaPuntos";

export type ResultadoCalificacionPrograma =
  | { ok: true; totalPuntos: number }
  | { ok: false; mensaje: string };

function clavePuntosCatalogo(catalogoId: string): string {
  return `cat_${catalogoId}`;
}

export function claveDocCalificacionesGrupoPrograma(nombreGrupo: string): string {
  const slug = nombreGrupo
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `grupo_${slug || "sin_grupo"}`;
}

export function esDocumentoCalificacionesGrupoPrograma(
  docId: string,
  data?: Record<string, unknown> | null
): boolean {
  if (docId.startsWith("grupo_")) return true;
  if (data?.tipo === "grupo" || data?.alcance === "grupo") return true;
  return false;
}

export function indexarTotalesPorGrupoPrograma(
  docs: { id: string; data: () => Record<string, unknown> }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const d of docs) {
    const data = d.data();
    if (!esDocumentoCalificacionesGrupoPrograma(d.id, data)) continue;
    const raw = String(data.grupo ?? data.nombre ?? "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const total = sumarPuntos(
      data.puntos as Record<string, unknown> | undefined,
      data.etiquetasActividades as Record<string, string> | undefined
    );
    map[key] = Math.max(map[key] ?? 0, total);
  }
  return map;
}

function categoriasIniciales(programa: "aventureros" | "ja"): Record<string, number> {
  const lista = programa === "aventureros" ? CATEGORIAS_AVENTUREROS : CATEGORIAS_JA;
  return lista.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {} as Record<string, number>);
}

export async function aplicarCalificacionCatalogoPrograma(params: {
  coleccion: ColeccionCalificacionesPrograma;
  programa: "aventureros" | "ja";
  pin: string;
  nombre: string;
  catalogo: CatalogoCalificacion;
  fecha: string;
}): Promise<ResultadoCalificacionPrograma> {
  const pinKey = String(params.pin).trim();
  if (!pinKey) return { ok: false, mensaje: "PIN inválido." };
  if (params.catalogo.puntos <= 0) return { ok: false, mensaje: "La actividad no tiene puntos." };

  const catKey = clavePuntosCatalogo(params.catalogo.id);
  const ref = doc(db, params.coleccion, pinKey);
  const snap = await getDoc(ref);

  const puntosActuales: Record<string, unknown> = snap.exists()
    ? (snap.data().puntos as Record<string, unknown>) || {}
    : categoriasIniciales(params.programa);

  const etiquetasPrevias: Record<string, string> = snap.exists()
    ? ((snap.data().etiquetasActividades as Record<string, string>) || {})
    : {};

  const valorActual = toNumberPuntos(puntosActuales[catKey]);
  const nuevoValor = valorActual + params.catalogo.puntos;
  const puntosNuevos = { ...puntosActuales, [catKey]: nuevoValor };
  const etiquetasNuevas = {
    ...etiquetasPrevias,
    [catKey]: params.catalogo.nombre,
  };

  await setDoc(
    ref,
    {
      pin: pinKey,
      nombre: params.nombre,
      programa: params.programa,
      puntos: puntosNuevos,
      etiquetasActividades: etiquetasNuevas,
    },
    { merge: true }
  );

  await addDoc(collection(db, "calificacionesSemanal"), {
    pin: pinKey,
    fecha: params.fecha,
    origen: `admin_${params.programa}`,
    puntos: { [catKey]: params.catalogo.puntos },
    totalEvento: params.catalogo.puntos,
    catalogoId: params.catalogo.id,
    catalogoNombre: params.catalogo.nombre,
  });

  return { ok: true, totalPuntos: sumarPuntos(puntosNuevos) };
}

/** Calificación de catálogo para todo el club/grupo: un solo total, no se reparte por miembro. */
export async function aplicarCalificacionCatalogoGrupoPrograma(params: {
  coleccion: ColeccionCalificacionesPrograma;
  programa: "aventureros" | "ja";
  clubId: string;
  grupo: string;
  catalogo: CatalogoCalificacion;
  fecha: string;
  miembrosEnGrupo?: number;
}): Promise<ResultadoCalificacionPrograma> {
  const nombreGrupo = params.grupo.trim();
  if (!nombreGrupo) return { ok: false, mensaje: "Grupo inválido." };
  if (params.catalogo.puntos <= 0) return { ok: false, mensaje: "La actividad no tiene puntos." };

  const docKey = claveDocCalificacionesGrupoPrograma(nombreGrupo);
  const catKey = clavePuntosCatalogo(params.catalogo.id);
  const ref = doc(db, params.coleccion, docKey);
  const snap = await getDoc(ref);

  const puntosActuales: Record<string, unknown> = snap.exists()
    ? (snap.data().puntos as Record<string, unknown>) || {}
    : categoriasIniciales(params.programa);
  const etiquetasPrevias: Record<string, string> = snap.exists()
    ? ((snap.data().etiquetasActividades as Record<string, string>) || {})
    : {};

  const valorActual = toNumberPuntos(puntosActuales[catKey]);
  const nuevoValor = valorActual + params.catalogo.puntos;
  const puntosNuevos = { ...puntosActuales, [catKey]: nuevoValor };
  const etiquetasNuevas = {
    ...etiquetasPrevias,
    [catKey]: params.catalogo.nombre,
  };

  await setDoc(
    ref,
    {
      nombre: nombreGrupo,
      grupo: nombreGrupo,
      programa: params.programa,
      clubId: params.clubId,
      tipo: "grupo",
      alcance: "grupo",
      puntos: puntosNuevos,
      etiquetasActividades: etiquetasNuevas,
      ...(params.miembrosEnGrupo != null
        ? { miembrosEnGrupo: params.miembrosEnGrupo }
        : {}),
    },
    { merge: true }
  );

  await addDoc(collection(db, "calificacionesSemanal"), {
    pin: docKey,
    fecha: params.fecha,
    origen: `admin_grupo_${params.programa}`,
    tipo: "suma",
    alcance: "grupo",
    grupo: nombreGrupo,
    puntos: { [catKey]: params.catalogo.puntos },
    totalEvento: params.catalogo.puntos,
    catalogoId: params.catalogo.id,
    catalogoNombre: params.catalogo.nombre,
    ...(params.miembrosEnGrupo != null
      ? { miembrosEnGrupo: params.miembrosEnGrupo }
      : {}),
  });

  return { ok: true, totalPuntos: sumarPuntos(puntosNuevos, etiquetasNuevas) };
}

export async function obtenerPuntosPrograma(
  coleccion: ColeccionCalificacionesPrograma,
  pin: string
): Promise<{ puntos: Record<string, number>; nombre: string; total: number }> {
  const ref = doc(db, coleccion, pin.trim());
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { puntos: {}, nombre: "", total: 0 };
  }
  const data = snap.data();
  const puntos: Record<string, number> = {};
  for (const [k, v] of Object.entries((data.puntos as Record<string, unknown>) || {})) {
    puntos[k] = toNumberPuntos(v);
  }
  return {
    puntos,
    nombre: String(data.nombre ?? ""),
    total: sumarPuntos(puntos),
  };
}

export async function aplicarRestaPuntosPrograma(params: {
  coleccion: ColeccionCalificacionesPrograma;
  programa: "aventureros" | "ja";
  pin: string;
  nombre: string;
  cantidad: number;
  fecha: string;
  motivo: string;
  motivoDetalle?: string;
}): Promise<ResultadoMovimientoPuntos> {
  const pinKey = String(params.pin).trim();
  const cantidad = Math.floor(Math.abs(params.cantidad));

  if (!pinKey) return { ok: false, mensaje: "PIN inválido." };
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, mensaje: "La cantidad debe ser mayor a 0." };
  }
  if (!params.fecha?.trim()) return { ok: false, mensaje: "Selecciona una fecha." };
  if (!params.motivo?.trim()) return { ok: false, mensaje: "Indica el motivo de la resta." };
  if (params.motivo === "otro" && !params.motivoDetalle?.trim()) {
    return { ok: false, mensaje: "Especifica el motivo en el campo de detalle." };
  }

  const ref = doc(db, params.coleccion, pinKey);
  const snap = await getDoc(ref);

  const puntosActuales: Record<string, unknown> = snap.exists()
    ? (snap.data().puntos as Record<string, unknown>) || {}
    : categoriasIniciales(params.programa);
  const etiquetasPrevias: Record<string, string> = snap.exists()
    ? ((snap.data().etiquetasActividades as Record<string, string>) || {})
    : {};

  const totalActual = sumarPuntos(puntosActuales, etiquetasPrevias);
  if (cantidad > totalActual) {
    return {
      ok: false,
      mensaje: `El total actual es ${totalActual} pts. No puedes quitar ${cantidad}.`,
    };
  }

  const valorPrevio = toNumberPuntos(puntosActuales[CLAVE_RESTA_GENERAL]);
  const nuevoValor = valorPrevio + cantidad;
  const puntosActualizados = { ...puntosActuales, [CLAVE_RESTA_GENERAL]: nuevoValor };

  await setDoc(
    ref,
    {
      pin: pinKey,
      nombre: params.nombre,
      programa: params.programa,
      puntos: puntosActualizados,
      etiquetasActividades: etiquetasPrevias,
      fechaUltima: params.fecha,
    },
    { merge: true }
  );

  await addDoc(collection(db, "calificacionesSemanal"), {
    pin: pinKey,
    fecha: params.fecha,
    tipo: "resta",
    origen: `admin_resta_${params.programa}`,
    categoriaId: CLAVE_RESTA_GENERAL,
    puntos: { [CLAVE_RESTA_GENERAL]: cantidad },
    totalEvento: cantidad,
    motivo: params.motivo,
    motivoTexto: textoMotivoCompleto(params.motivo, params.motivoDetalle),
    ...(params.motivoDetalle?.trim() ? { motivoDetalle: params.motivoDetalle.trim() } : {}),
  });

  return {
    ok: true,
    nuevoValorCategoria: nuevoValor,
    totalPuntos: sumarPuntos(puntosActualizados, etiquetasPrevias),
  };
}
