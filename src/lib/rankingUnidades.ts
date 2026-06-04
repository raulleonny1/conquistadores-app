import { canonicalizarUnidad, normalizarUnidad } from "@/src/lib/unidades";

export type MiembroUnidadRanking = {
  pin: string;
  nombre: string;
  /** Puntos personales (calificación individual), independientes de la unidad. */
  puntosPersonales: number;
};

export type UnidadRanking = {
  unidad: string;
  /** Total de calificaciones hechas «por unidad» (un solo registro en Firebase). */
  totalPuntosUnidad: number;
  cantidadMiembros: number;
  miembros: MiembroUnidadRanking[];
};

export type ConquistadorUnidad = {
  pin: string;
  nombre: string;
  unidad: string;
};

/** Evita contar dos veces el mismo PIN en una unidad. */
export function dedupeConquisPorPin(lista: ConquistadorUnidad[]): ConquistadorUnidad[] {
  const visto = new Map<string, ConquistadorUnidad>();
  for (const c of lista) {
    const pin = String(c.pin).trim();
    if (!pin) continue;
    if (!visto.has(pin)) visto.set(pin, c);
  }
  return Array.from(visto.values());
}

/**
 * Ranking por unidad: total de puntos del documento de unidad + desglose personal por miembro.
 */
export function calcularRankingUnidades(
  conquis: ConquistadorUnidad[],
  totalesPersonalesPorPin: Record<string, number>,
  totalesUnidadPorClaveNorm: Record<string, number>,
  catalogoUnidades: string[] = []
): UnidadRanking[] {
  const porUnidad = new Map<
    string,
    { nombreMostrar: string; miembros: MiembroUnidadRanking[] }
  >();

  for (const c of dedupeConquisPorPin(conquis)) {
    const rawUnidad = (c.unidad || "Sin unidad").trim() || "Sin unidad";
    const nombreUnidad = catalogoUnidades.length
      ? canonicalizarUnidad(rawUnidad, catalogoUnidades)
      : rawUnidad;
    const key = normalizarUnidad(nombreUnidad);

    const prev = porUnidad.get(key);
    const miembro: MiembroUnidadRanking = {
      pin: c.pin,
      nombre: c.nombre.trim() || "Sin nombre",
      puntosPersonales: totalesPersonalesPorPin[c.pin] ?? 0,
    };

    if (!prev) {
      porUnidad.set(key, { nombreMostrar: nombreUnidad, miembros: [miembro] });
    } else {
      prev.miembros.push(miembro);
    }
  }

  const resultado: UnidadRanking[] = [];

  for (const [key, { nombreMostrar, miembros }] of porUnidad.entries()) {
    miembros.sort(
      (a, b) =>
        b.puntosPersonales - a.puntosPersonales ||
        a.nombre.localeCompare(b.nombre, "es")
    );
    resultado.push({
      unidad: nombreMostrar,
      totalPuntosUnidad: totalesUnidadPorClaveNorm[key] ?? 0,
      cantidadMiembros: miembros.length,
      miembros,
    });
  }

  return resultado.sort(
    (a, b) =>
      b.totalPuntosUnidad - a.totalPuntosUnidad ||
      a.unidad.localeCompare(b.unidad, "es")
  );
}
