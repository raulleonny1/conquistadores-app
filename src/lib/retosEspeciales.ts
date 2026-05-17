export type RetoEspecialDoc = {
  id?: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  unidad: string;
  consejeroId: string;
  fecha: string;
  activo?: boolean;
};

export function tituloRetoMiembro(reto: Pick<RetoEspecialDoc, "titulo" | "puntos">): string {
  const pts = typeof reto.puntos === "number" ? reto.puntos : parseInt(String(reto.puntos), 10) || 0;
  if (pts > 0) return `${reto.titulo} y gana ${pts} XP extra`;
  return reto.titulo;
}

export function ordenarRetosPorFecha(retos: RetoEspecialDoc[]): RetoEspecialDoc[] {
  return [...retos]
    .filter((r) => r.activo !== false)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
}
