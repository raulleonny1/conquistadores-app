import { canonicalizarUnidad, normalizarUnidad } from "@/src/lib/unidades";

export type MiembroUnidadRanking = {
  pin: string;
  nombre: string;
  puntos: number;
};

export type UnidadRanking = {
  unidad: string;
  totalPuntos: number;
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
 * Suma puntos de calificacionesConquis por unidad (solo conquistadores registrados).
 */
export function calcularRankingUnidades(
  conquis: ConquistadorUnidad[],
  totalesPorPin: Record<string, number>,
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
    const puntos = totalesPorPin[c.pin] ?? 0;

    const prev = porUnidad.get(key);
    const miembro: MiembroUnidadRanking = {
      pin: c.pin,
      nombre: c.nombre.trim() || "Sin nombre",
      puntos,
    };

    if (!prev) {
      porUnidad.set(key, { nombreMostrar: nombreUnidad, miembros: [miembro] });
    } else {
      prev.miembros.push(miembro);
    }
  }

  const resultado: UnidadRanking[] = [];

  for (const { nombreMostrar, miembros } of porUnidad.values()) {
    miembros.sort(
      (a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es")
    );
    resultado.push({
      unidad: nombreMostrar,
      totalPuntos: miembros.reduce((acc, m) => acc + m.puntos, 0),
      cantidadMiembros: miembros.length,
      miembros,
    });
  }

  return resultado.sort(
    (a, b) =>
      b.totalPuntos - a.totalPuntos ||
      a.unidad.localeCompare(b.unidad, "es")
  );
}
