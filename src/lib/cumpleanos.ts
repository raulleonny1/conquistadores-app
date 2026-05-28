/** Parsea fecha de nacimiento (ISO yyyy-mm-dd o dd/mm/yyyy). */
export function parseFechaNacimiento(
  raw: string | null | undefined
): { month: number; day: number } | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const month = parseInt(iso[2], 10);
    const day = parseInt(iso[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { month, day };
  }

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { month, day };
  }

  const parsed = new Date(s.includes("T") ? s : `${s.slice(0, 10)}T12:00:00`);
  if (!Number.isNaN(parsed.getTime())) {
    return { month: parsed.getMonth() + 1, day: parsed.getDate() };
  }

  return null;
}

/** Días hasta el próximo cumpleaños (0 = hoy). */
export function diasHastaCumpleanos(
  month: number,
  day: number,
  hoy: Date = new Date()
): number {
  const y = hoy.getFullYear();
  const hoyNorm = new Date(y, hoy.getMonth(), hoy.getDate(), 12, 0, 0, 0);
  let proximo = new Date(y, month - 1, day, 12, 0, 0, 0);
  if (proximo < hoyNorm) {
    proximo = new Date(y + 1, month - 1, day, 12, 0, 0, 0);
  }
  return Math.round((proximo.getTime() - hoyNorm.getTime()) / 86_400_000);
}

export type TipoPersonaClub =
  | "conquistador"
  | "aspirante"
  | "consejero"
  | "asociado"
  | "directiva";

export type CumpleanosPersona = {
  id: string;
  nombre: string;
  tipo: TipoPersonaClub;
  detalle: string;
  fechaTexto: string;
  diasHasta: number;
};

export type RegistradoSinFecha = {
  id: string;
  nombre: string;
  tipo: TipoPersonaClub;
  detalle: string;
};

const CAMPOS_FECHA_NACIMIENTO = [
  "fechaNacimiento",
  "nacimiento",
  "fecha_nacimiento",
  "asociadoNacimiento",
] as const;

/** Lee la primera fecha de nacimiento presente en el documento. */
export function extraerFechaNacimiento(
  data: Record<string, unknown>
): string {
  for (const key of CAMPOS_FECHA_NACIMIENTO) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Quita el prefijo interno (c_, a_, co_, …) y devuelve el id de Firestore. */
export function docIdDesdeRegistroId(registroId: string): string {
  const m = /^(c_|a_|co_|as_|d_)(.+)$/.exec(registroId);
  return m ? m[2] : registroId;
}

/** Ruta de edición para agregar fecha de nacimiento / cumpleaños. */
export function urlEditarPersona(
  tipo: TipoPersonaClub,
  registroId: string
): string {
  const docId = encodeURIComponent(docIdDesdeRegistroId(registroId));
  switch (tipo) {
    case "conquistador":
      return `/admin/RegistroConquis?editar=${docId}`;
    case "aspirante":
      return `/admin/aspirante?editar=${docId}`;
    case "consejero":
      return `/admin/consejero?editar=${docId}`;
    case "asociado":
      return `/admin/consejero?editar=${docId}&asociado=1`;
    case "directiva":
      return `/admin/directiva?editar=${docId}`;
    default:
      return "/admin";
  }
}

export function etiquetaTipoPersona(tipo: TipoPersonaClub): string {
  const map: Record<TipoPersonaClub, string> = {
    conquistador: "Conquistador",
    aspirante: "Aspirante a Guía Mayor",
    consejero: "Consejero",
    asociado: "Consejero asociado",
    directiva: "Directiva del club",
  };
  return map[tipo];
}

export function filtrarCumpleanosProximos(
  personas: (Omit<CumpleanosPersona, "diasHasta">)[],
  ventanaDias = 14,
  hoy: Date = new Date()
): CumpleanosPersona[] {
  const conDias: CumpleanosPersona[] = [];

  for (const p of personas) {
    const partes = parseFechaNacimiento(p.fechaTexto);
    if (!partes) continue;
    const dias = diasHastaCumpleanos(partes.month, partes.day, hoy);
    if (dias <= ventanaDias) {
      conDias.push({ ...p, diasHasta: dias });
    }
  }

  return conDias.sort((a, b) => a.diasHasta - b.diasHasta);
}

export function etiquetaDiasCumpleanos(dias: number): string {
  if (dias === 0) return "¡Hoy es su cumpleaños!";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}
