export type MiembroGrupoRanking = {
  pin: string;
  nombre: string;
  puntosPersonales: number;
};

export type GrupoProgramaRanking = {
  grupo: string;
  totalPuntosGrupo: number;
  cantidadMiembros: number;
  miembros: MiembroGrupoRanking[];
};

export type MiembroGrupoPrograma = {
  pin: string;
  nombre: string;
  grupo: string;
};

export function normalizarGrupoPrograma(nombre: string): string {
  return nombre.trim().toLowerCase();
}

export function nombreGrupoMostrar(raw: string): string {
  const t = raw.trim();
  return t || "Sin asignar";
}

export function dedupeMiembrosPorPin(lista: MiembroGrupoPrograma[]): MiembroGrupoPrograma[] {
  const visto = new Map<string, MiembroGrupoPrograma>();
  for (const m of lista) {
    const pin = String(m.pin).trim();
    if (!pin) continue;
    if (!visto.has(pin)) visto.set(pin, m);
  }
  return Array.from(visto.values());
}

/** Ranking por club/grupo: total del documento de grupo + desglose personal por miembro. */
export function calcularRankingGruposPrograma(
  miembros: MiembroGrupoPrograma[],
  totalesPersonalesPorPin: Record<string, number>,
  totalesGrupoPorClaveNorm: Record<string, number>
): GrupoProgramaRanking[] {
  const porGrupo = new Map<string, { nombreMostrar: string; miembros: MiembroGrupoRanking[] }>();

  for (const m of dedupeMiembrosPorPin(miembros)) {
    const nombreGrupo = nombreGrupoMostrar(m.grupo);
    const key = normalizarGrupoPrograma(nombreGrupo);

    const miembro: MiembroGrupoRanking = {
      pin: m.pin,
      nombre: m.nombre.trim() || "Sin nombre",
      puntosPersonales: totalesPersonalesPorPin[m.pin] ?? 0,
    };

    const prev = porGrupo.get(key);
    if (!prev) {
      porGrupo.set(key, { nombreMostrar: nombreGrupo, miembros: [miembro] });
    } else {
      prev.miembros.push(miembro);
    }
  }

  const resultado: GrupoProgramaRanking[] = [];

  for (const [key, { nombreMostrar, miembros: lista }] of porGrupo.entries()) {
    lista.sort(
      (a, b) =>
        b.puntosPersonales - a.puntosPersonales ||
        a.nombre.localeCompare(b.nombre, "es")
    );
    resultado.push({
      grupo: nombreMostrar,
      totalPuntosGrupo: totalesGrupoPorClaveNorm[key] ?? 0,
      cantidadMiembros: lista.length,
      miembros: lista,
    });
  }

  return resultado.sort(
    (a, b) =>
      b.totalPuntosGrupo - a.totalPuntosGrupo ||
      a.grupo.localeCompare(b.grupo, "es")
  );
}
