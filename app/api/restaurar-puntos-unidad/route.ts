import { NextResponse } from "next/server";
import { db } from "@/src/firebase";
import {
  claveDocCalificacionesUnidad,
  sumarPuntos,
  toNumberPuntos,
} from "@/src/lib/categoriasPuntos";
import { canonicalizarUnidad, normalizarUnidad } from "@/src/lib/unidades";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

const ADMIN_PIN = "1844";

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

function fusionarPuntos(
  dest: Record<string, unknown>,
  src: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...dest };
  for (const [k, v] of Object.entries(src)) {
    out[k] = toNumberPuntos(out[k]) + toNumberPuntos(v);
  }
  return out;
}

/**
 * Reconstruye puntos de unidad: historial semanal (fuente) + docs huérfanos legacy.
 * POST { "pin": "1844" }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { pin?: string };
    if (body.pin !== ADMIN_PIN) {
      return NextResponse.json({ ok: false, error: "PIN admin requerido." }, { status: 401 });
    }

    const unidadesSnap = await getDocs(collection(db, "unidades"));
    const catalogo = unidadesSnap.docs
      .map((d) => String(d.data().nombre ?? "").trim())
      .filter(Boolean);

    type Acum = {
      nombreCanon: string;
      puntos: Record<string, unknown>;
      etiquetas: Record<string, string>;
    };
    const acumulado = new Map<string, Acum>();

    const histSnap = await getDocs(collection(db, "calificacionesSemanal"));
    for (const d of histSnap.docs) {
      const data = d.data();
      if (data.tipo !== "suma") continue;
      const esUnidad =
        data.alcance === "unidad" || String(data.pin ?? "").startsWith("unidad_");
      if (!esUnidad) continue;

      const rawUnidad = String(data.unidad ?? "").trim();
      if (!rawUnidad) continue;

      const nombreCanon = canonicalizarUnidad(rawUnidad, catalogo);
      const key = normalizarUnidad(nombreCanon);
      const prev = acumulado.get(key) ?? {
        nombreCanon,
        puntos: {},
        etiquetas: {},
      };

      const pts = (data.puntos as Record<string, unknown>) || {};
      for (const [cat, val] of Object.entries(pts)) {
        prev.puntos[cat] = toNumberPuntos(prev.puntos[cat]) + toNumberPuntos(val);
        const label = String(data.catalogoNombre ?? "").trim();
        if (label && toNumberPuntos(val) > 0) prev.etiquetas[cat] = label;
      }
      acumulado.set(key, prev);
    }

    const califSnap = await getDocs(collection(db, "calificacionesConquis"));
    const huérfanosFusionados: string[] = [];

    for (const d of califSnap.docs) {
      if (!d.id.startsWith("unidad_")) continue;
      const data = d.data();
      const rawUnidad = String(data.unidad ?? data.nombre ?? "").trim();
      const nombreCanon = canonicalizarUnidad(rawUnidad, catalogo);
      const docCanon = claveDocCalificacionesUnidad(nombreCanon, catalogo);

      const idsPosibles = idsDocumentoUnidadPosibles(rawUnidad);
      const esHuérfano = d.id !== docCanon && idsPosibles.includes(d.id);

      if (esHuérfano) {
        const key = normalizarUnidad(nombreCanon);
        const prev = acumulado.get(key) ?? {
          nombreCanon,
          puntos: {},
          etiquetas: {},
        };
        prev.puntos = fusionarPuntos(prev.puntos, (data.puntos as Record<string, unknown>) || {});
        Object.assign(
          prev.etiquetas,
          (data.etiquetasActividades as Record<string, string>) || {}
        );
        acumulado.set(key, prev);
        huérfanosFusionados.push(d.id);
      }
    }

    const restaurados: { unidad: string; docId: string; total: number }[] = [];

    for (const [, acum] of acumulado) {
      const docId = claveDocCalificacionesUnidad(acum.nombreCanon, catalogo);
      const total = sumarPuntos(acum.puntos, acum.etiquetas);

      await setDoc(
        doc(db, "calificacionesConquis", docId),
        {
          tipo: "unidad",
          alcance: "unidad",
          unidad: acum.nombreCanon,
          nombre: acum.nombreCanon,
          pin: docId,
          puntos: acum.puntos,
          etiquetasActividades: acum.etiquetas,
        },
        { merge: false }
      );
      restaurados.push({ unidad: acum.nombreCanon, docId, total });
    }

    for (const id of huérfanosFusionados) {
      const docCanon = idsDocumentoUnidadPosibles(
        (await getDoc(doc(db, "calificacionesConquis", id))).data()?.unidad as string
      );
      try {
        await deleteDoc(doc(db, "calificacionesConquis", id));
      } catch {
        /* */
      }
    }

    for (const id of huérfanosFusionados) {
      try {
        await deleteDoc(doc(db, "calificacionesConquis", id));
      } catch {
        /* */
      }
    }

    return NextResponse.json({
      ok: true,
      restaurados,
      huérfanosFusionados,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[restaurar-puntos-unidad]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const califSnap = await getDocs(collection(db, "calificacionesConquis"));
  const unidadDocs = califSnap.docs
    .filter((d) => d.id.startsWith("unidad_"))
    .map((d) => ({
      id: d.id,
      unidad: d.data().unidad,
      total: sumarPuntos(d.data().puntos, d.data().etiquetasActividades),
      puntos: d.data().puntos,
    }));

  return NextResponse.json({ unidadDocs });
}
