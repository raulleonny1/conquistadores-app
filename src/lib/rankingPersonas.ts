import { nombresCoinciden, normalizarNombrePersona } from "@/src/lib/cumpleanos";

/**
 * Agrupación solo para la vista «Todos» del ranking admin.
 * No modifica PINs ni documentos en Firebase: cada cargo sigue con su PIN,
 * dashboard y puntos independientes.
 */
export type TipoParticipanteRanking =
  | "conquistador"
  | "aspirante"
  | "consejero"
  | "asociado";

export type ParticipanteRankingRaw = {
  id: string;
  nombre: string;
  pin: string;
  tipo: TipoParticipanteRanking;
};

export type EntradaRankingPersona = {
  key: string;
  nombre: string;
  pins: string[];
  tipos: TipoParticipanteRanking[];
  etiquetasTipos: string[];
  entradas: ParticipanteRankingRaw[];
};

export function etiquetaTipoParticipante(tipo: TipoParticipanteRanking): string {
  switch (tipo) {
    case "conquistador":
      return "Conquistador";
    case "aspirante":
      return "Aspirante a guía mayor";
    case "consejero":
      return "Consejero";
    case "asociado":
      return "Consejero asociado";
  }
}

/** Agrupa filas con el mismo nombre (p. ej. aspirante + consejero). */
export function agruparParticipantesPorPersona(
  lista: ParticipanteRankingRaw[]
): EntradaRankingPersona[] {
  const grupos: ParticipanteRankingRaw[][] = [];

  for (const p of lista) {
    let colocado = false;
    for (const g of grupos) {
      if (nombresCoinciden(p.nombre, g[0].nombre)) {
        g.push(p);
        colocado = true;
        break;
      }
    }
    if (!colocado) grupos.push([p]);
  }

  return grupos.map((entradas) => {
    const nombre =
      entradas
        .map((e) => e.nombre.trim())
        .sort((a, b) => b.length - a.length)[0] || entradas[0].nombre;

    const pins = [...new Set(entradas.map((e) => e.pin).filter(Boolean))];
    const tipos = [...new Set(entradas.map((e) => e.tipo))];
    const etiquetasTipos = tipos.map(etiquetaTipoParticipante);

    return {
      key: `grupo:${normalizarNombrePersona(nombre)}`,
      nombre,
      pins,
      tipos,
      etiquetasTipos,
      entradas,
    };
  });
}

export function construirEntradasRanking(
  participantes: ParticipanteRankingRaw[],
  modo: "todos" | "conquistador" | "aspirante" | "consejero"
): EntradaRankingPersona[] {
  const filtrados =
    modo === "todos"
      ? participantes
      : modo === "consejero"
        ? participantes.filter((p) => p.tipo === "consejero" || p.tipo === "asociado")
        : participantes.filter((p) => p.tipo === modo);

  if (modo === "todos") {
    return agruparParticipantesPorPersona(filtrados);
  }

  return filtrados.map((p) => ({
    key: `pin:${p.pin}`,
    nombre: p.nombre,
    pins: [p.pin],
    tipos: [p.tipo],
    etiquetasTipos: [etiquetaTipoParticipante(p.tipo)],
    entradas: [p],
  }));
}

export function totalPuntosEntrada(
  entrada: EntradaRankingPersona,
  totalesPorPin: Record<string, number>
): number {
  return entrada.pins.reduce((acc, pin) => acc + (totalesPorPin[pin] ?? 0), 0);
}
