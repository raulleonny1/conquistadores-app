/** Documento en Firestore `eventos` (admin/calendario y consejero). */
export type EventoFirestore = {
  id?: string;
  nombre?: string;
  titulo?: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
  observacion?: string;
  tipo?: string;
  color?: string;
};

export function nombreEvento(e: EventoFirestore): string {
  return e.nombre?.trim() || e.titulo?.trim() || "Evento";
}

/** Ordenar por fecha (dd/mm/yyyy o ISO). */
export function ordenarEventosPorFecha(eventos: EventoFirestore[]): EventoFirestore[] {
  return [...eventos].sort((a, b) => timestampEvento(b.fecha) - timestampEvento(a.fecha));
}

function timestampEvento(fecha: string | undefined): number {
  if (!fecha?.trim()) return 0;
  const s = fecha.trim();
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const m = s.match(ddmmyyyy);
  if (m) {
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  }
  const d = new Date(s.includes("T") ? s : `${s.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}
