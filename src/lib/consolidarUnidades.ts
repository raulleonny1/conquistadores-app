import { db } from "@/src/firebase";
import {
  claveDocCalificacionesUnidad,
  toNumberPuntos,
} from "@/src/lib/categoriasPuntos";
import {
  canonicalizarUnidad,
  claveBaseUnidad,
  elegirNombreCanonicoUnidad,
  normalizarUnidad,
} from "@/src/lib/unidades";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export type ResultadoConsolidarUnidades = {
  catalogoUnificado: number;
  catalogoEliminados: number;
  conquistadoresActualizados: number;
  consejerosActualizados: number;
  docsPuntosUnidadFusionados: number;
  historialActualizado: number;
  detalle: string[];
};

function fusionarMapasPuntos(
  destino: Record<string, unknown>,
  origen: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...destino };
  for (const [k, v] of Object.entries(origen)) {
    out[k] = toNumberPuntos(out[k]) + toNumberPuntos(v);
  }
  return out;
}

/** IDs posibles de docs de unidad (legacy «unidad_unidad_de_x» vs «unidad_x»). */
function idsDocumentoUnidadPosibles(nombre: string): string[] {
  const trimmed = nombre.trim();
  const ids = new Set<string>();
  ids.add(`unidad_${normalizarUnidad(trimmed).replace(/\s+/g, "_")}`);
  const sinPrefijo = trimmed.replace(/^unidad de\s+/i, "").trim();
  if (sinPrefijo !== trimmed) {
    ids.add(`unidad_${normalizarUnidad(sinPrefijo).replace(/\s+/g, "_")}`);
    ids.add(`unidad_unidad_de_${normalizarUnidad(sinPrefijo).replace(/\s+/g, "_")}`);
  }
  return Array.from(ids);
}

async function fusionarDocumentoPuntosUnidad(
  nombreViejo: string,
  nombreNuevo: string,
  catalogo: string[]
): Promise<boolean> {
  const idCanonNuevo = claveDocCalificacionesUnidad(nombreNuevo, catalogo);
  const idsOrigen = idsDocumentoUnidadPosibles(nombreViejo).filter((id) => id !== idCanonNuevo);

  let fusionado = false;
  for (const idViejo of idsOrigen) {
    const refViejo = doc(db, "calificacionesConquis", idViejo);
    const snapViejo = await getDoc(refViejo);
    if (!snapViejo.exists()) continue;

    const refNuevo = doc(db, "calificacionesConquis", idCanonNuevo);
    const snapNuevo = await getDoc(refNuevo);
    const dataViejo = snapViejo.data();
    const puntosViejos = (dataViejo.puntos as Record<string, unknown>) || {};
    const etiquetasViejas =
      (dataViejo.etiquetasActividades as Record<string, string>) || {};
    const puntosNuevos = snapNuevo.exists()
      ? ((snapNuevo.data().puntos as Record<string, unknown>) || {})
      : {};
    const etiquetasNuevas = snapNuevo.exists()
      ? ((snapNuevo.data().etiquetasActividades as Record<string, string>) || {})
      : {};

    await setDoc(
      refNuevo,
      {
        tipo: "unidad",
        alcance: "unidad",
        unidad: nombreNuevo,
        nombre: nombreNuevo,
        pin: idCanonNuevo,
        puntos: fusionarMapasPuntos(puntosNuevos, puntosViejos),
        etiquetasActividades: { ...etiquetasViejas, ...etiquetasNuevas },
        fechaUltima: dataViejo.fechaUltima ?? snapNuevo.data()?.fechaUltima ?? "",
      },
      { merge: true }
    );

    try {
      await deleteDoc(refViejo);
    } catch {
      /* puntos ya copiados */
    }
    fusionado = true;
  }

  return fusionado;
}

/**
 * Unifica duplicados «Unidad de X» / «X» en catálogo, registros y puntos de unidad.
 * Ejecutar desde Admin → Unidades.
 */
export async function consolidarUnidadesClub(): Promise<ResultadoConsolidarUnidades> {
  const detalle: string[] = [];
  let catalogoUnificado = 0;
  let catalogoEliminados = 0;
  let conquistadoresActualizados = 0;
  let consejerosActualizados = 0;
  let docsPuntosUnidadFusionados = 0;
  let historialActualizado = 0;

  const unidadesSnap = await getDocs(collection(db, "unidades"));
  const filasCatalogo = unidadesSnap.docs.map((d) => ({
    id: d.id,
    nombre: String((d.data() as { nombre?: string }).nombre ?? "").trim(),
  }));

  const catalogoNombres = filasCatalogo.map((f) => f.nombre).filter(Boolean);

  /** base → nombres en catálogo */
  const gruposCatalogo = new Map<string, typeof filasCatalogo>();
  for (const f of filasCatalogo) {
    if (!f.nombre) continue;
    const base = claveBaseUnidad(f.nombre);
    const prev = gruposCatalogo.get(base) ?? [];
    prev.push(f);
    gruposCatalogo.set(base, prev);
  }

  /** nombre viejo → nombre canónico final */
  const mapaRenombre = new Map<string, string>();

  for (const [, grupo] of gruposCatalogo) {
    if (grupo.length === 0) continue;
    const nombres = grupo.map((g) => g.nombre);
    const canon = elegirNombreCanonicoUnidad(nombres);
    for (const g of grupo) {
      if (g.nombre !== canon) {
        mapaRenombre.set(g.nombre, canon);
      }
    }
    const keeper = grupo.find((g) => g.nombre === canon) ?? grupo[0];
    if (keeper.nombre !== canon) {
      await updateDoc(doc(db, "unidades", keeper.id), { nombre: canon });
      mapaRenombre.set(keeper.nombre, canon);
      catalogoUnificado++;
      detalle.push(`Catálogo: «${keeper.nombre}» → «${canon}»`);
    }
    for (const g of grupo) {
      if (g.id === keeper.id) continue;
      mapaRenombre.set(g.nombre, canon);
      await deleteDoc(doc(db, "unidades", g.id));
      catalogoEliminados++;
      detalle.push(`Catálogo eliminado: «${g.nombre}» (unificado en «${canon}»)`);
    }
  }

  const catalogoActualizado = [
    ...new Set(
      filasCatalogo
        .map((f) => mapaRenombre.get(f.nombre) ?? f.nombre)
        .filter(Boolean)
    ),
  ];

  const resolverCanon = (nombre: string): string => {
    const trimmed = nombre.trim();
    if (!trimmed) return trimmed;
    if (mapaRenombre.has(trimmed)) return mapaRenombre.get(trimmed)!;
    return canonicalizarUnidad(trimmed, catalogoActualizado);
  };

  const conquisSnap = await getDocs(collection(db, "RegistroConquis"));
  let batch = writeBatch(db);
  let ops = 0;

  for (const d of conquisSnap.docs) {
    const data = d.data() as { unidad?: string };
    const viejo = String(data.unidad ?? "").trim();
    if (!viejo) continue;
    const nuevo = resolverCanon(viejo);
    if (nuevo && nuevo !== viejo) {
      batch.update(doc(db, "RegistroConquis", d.id), { unidad: nuevo });
      ops++;
      conquistadoresActualizados++;
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }
  if (ops > 0) await batch.commit();

  const consejerosSnap = await getDocs(collection(db, "consejeros"));
  for (const d of consejerosSnap.docs) {
    const data = d.data() as { unidades?: string[] };
    const unidades = Array.isArray(data.unidades) ? data.unidades : [];
    if (unidades.length === 0) continue;
    const nuevas = [...new Set(unidades.map((u) => resolverCanon(String(u).trim())).filter(Boolean))];
    const cambio =
      nuevas.length !== unidades.length ||
      nuevas.some((u, i) => u !== unidades[i]);
    if (cambio) {
      await updateDoc(doc(db, "consejeros", d.id), { unidades: nuevas });
      consejerosActualizados++;
    }
  }

  const nombresUnidadVistos = new Set<string>();
  for (const nombre of catalogoActualizado) nombresUnidadVistos.add(nombre);
  for (const d of conquisSnap.docs) {
    const u = String(d.data().unidad ?? "").trim();
    if (u) nombresUnidadVistos.add(u);
  }
  for (const [viejo, nuevo] of mapaRenombre) {
    if (await fusionarDocumentoPuntosUnidad(viejo, nuevo, catalogoActualizado)) {
      docsPuntosUnidadFusionados++;
      detalle.push(`Puntos unidad fusionados: «${viejo}» → «${nuevo}»`);
    }
  }

  const historialSnap = await getDocs(collection(db, "calificacionesSemanal"));
  batch = writeBatch(db);
  ops = 0;
  for (const d of historialSnap.docs) {
    const data = d.data() as { unidad?: string; alcance?: string };
    const u = String(data.unidad ?? "").trim();
    if (!u) continue;
    const nuevo = resolverCanon(u);
    if (nuevo && nuevo !== u) {
      batch.update(doc(db, "calificacionesSemanal", d.id), { unidad: nuevo });
      ops++;
      historialActualizado++;
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }
  if (ops > 0) await batch.commit();

  if (detalle.length === 0) {
    detalle.push("No había duplicados pendientes; nombres ya unificados.");
  }

  return {
    catalogoUnificado,
    catalogoEliminados,
    conquistadoresActualizados,
    consejerosActualizados,
    docsPuntosUnidadFusionados,
    historialActualizado,
    detalle,
  };
}
