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
  /** Id de registro Firestore (con prefijo c_, a_, co_…) para editar. */
  editRegistroId?: string;
};

export type RegistradoSinFecha = {
  id: string;
  nombre: string;
  tipo: TipoPersonaClub;
  tipos: TipoPersonaClub[];
  detalle: string;
  editRegistroId?: string;
};

/** Normaliza nombre para comparar (sin acentos, minúsculas). */
export function normalizarNombrePersona(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const PRIORIDAD_TIPO: Record<TipoPersonaClub, number> = {
  directiva: 1,
  consejero: 2,
  aspirante: 3,
  conquistador: 4,
  asociado: 5,
};

function clavePorNombreYFecha(nombre: string, fechaTexto: string): string {
  const partes = parseFechaNacimiento(fechaTexto);
  const fechaKey = partes ? `${partes.month}-${partes.day}` : fechaTexto.trim();
  return `${normalizarNombrePersona(nombre)}|${fechaKey}`;
}

function ordenarTipos(tipos: Iterable<TipoPersonaClub>): TipoPersonaClub[] {
  return [...new Set(tipos)].sort((a, b) => PRIORIDAD_TIPO[a] - PRIORIDAD_TIPO[b]);
}

function tipoPrincipal(tipos: TipoPersonaClub[]): TipoPersonaClub {
  return ordenarTipos(tipos)[0];
}

function detallesUnicos(detalles: string[]): string {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const d of detalles) {
    const t = d.trim();
    if (!t || vistos.has(t)) continue;
    vistos.add(t);
    out.push(t);
  }
  return out.join(" · ");
}

/** Una persona, un cumpleaño: fusiona aspirante + consejero + conquistador, etc. */
export function deduplicarRegistrosConFecha(
  personas: Omit<CumpleanosPersona, "diasHasta" | "editRegistroId">[]
): Omit<CumpleanosPersona, "diasHasta">[] {
  const map = new Map<
    string,
    {
      nombre: string;
      fechaTexto: string;
      tipos: TipoPersonaClub[];
      detalles: string[];
      idsPorTipo: Partial<Record<TipoPersonaClub, string>>;
    }
  >();

  for (const p of personas) {
    const key = clavePorNombreYFecha(p.nombre, p.fechaTexto);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        nombre: p.nombre.trim(),
        fechaTexto: p.fechaTexto,
        tipos: [p.tipo],
        detalles: p.detalle ? [p.detalle] : [],
        idsPorTipo: { [p.tipo]: p.id },
      });
      continue;
    }
    prev.tipos.push(p.tipo);
    if (p.detalle?.trim()) prev.detalles.push(p.detalle.trim());
    prev.idsPorTipo[p.tipo] = p.id;
  }

  return Array.from(map.values()).map((entry) => {
    const tipos = ordenarTipos(entry.tipos);
    const principal = tipoPrincipal(tipos);
    const id = entry.idsPorTipo[principal] ?? Object.values(entry.idsPorTipo)[0] ?? "";
    const roles =
      tipos.length > 1 ? tipos.map(etiquetaTipoPersona).join(" · ") : etiquetaTipoPersona(principal);
    const detalleNegocio = detallesUnicos(entry.detalles);

    return {
      id: `u_${clavePorNombreYFecha(entry.nombre, entry.fechaTexto)}`,
      nombre: entry.nombre,
      tipo: principal,
      detalle: detalleNegocio ? `${roles} — ${detalleNegocio}` : roles,
      fechaTexto: entry.fechaTexto,
      editRegistroId: id,
    };
  });
}

/** Sin fecha: deduplicar solo por nombre (misma persona en varios registros). */
export function deduplicarRegistrosSinFecha(personas: RegistradoSinFecha[]): RegistradoSinFecha[] {
  const map = new Map<
    string,
    {
      nombre: string;
      tipos: TipoPersonaClub[];
      detalles: string[];
      idsPorTipo: Partial<Record<TipoPersonaClub, string>>;
    }
  >();

  for (const p of personas) {
    const key = normalizarNombrePersona(p.nombre);
    if (!key) continue;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        nombre: p.nombre.trim(),
        tipos: [...(p.tipos ?? [p.tipo])],
        detalles: p.detalle ? [p.detalle] : [],
        idsPorTipo: { [p.tipo]: p.id },
      });
      continue;
    }
    prev.tipos.push(...(p.tipos ?? [p.tipo]));
    if (p.detalle?.trim()) prev.detalles.push(p.detalle.trim());
    prev.idsPorTipo[p.tipo] = p.id;
  }

  return Array.from(map.values()).map((entry) => {
    const tipos = ordenarTipos(entry.tipos);
    const principal = tipoPrincipal(tipos);
    const id = entry.idsPorTipo[principal] ?? Object.values(entry.idsPorTipo)[0] ?? "";
    const roles =
      tipos.length > 1 ? tipos.map(etiquetaTipoPersona).join(" · ") : etiquetaTipoPersona(principal);
    const detalleNegocio = detallesUnicos(entry.detalles);

    return {
      id: `u_${normalizarNombrePersona(entry.nombre)}`,
      nombre: entry.nombre,
      tipo: principal,
      tipos,
      detalle: detalleNegocio ? `${roles} — ${detalleNegocio}` : roles,
      editRegistroId: id,
    };
  });
}

export function contarPersonasUnicas(
  conFecha: Omit<CumpleanosPersona, "diasHasta" | "editRegistroId">[],
  sinFecha: RegistradoSinFecha[]
): number {
  const sinFechaFiltrada = quitarSinFechaSiYaTieneFecha(sinFecha, conFecha);
  const claves = new Set<string>();
  for (const p of deduplicarRegistrosConFecha(conFecha)) {
    claves.add(clavePorNombreYFecha(p.nombre, p.fechaTexto));
  }
  for (const p of deduplicarRegistrosSinFecha(sinFechaFiltrada)) {
    claves.add(`sin|${normalizarNombrePersona(p.nombre)}`);
  }
  return claves.size;
}

const CAMPOS_FECHA_NACIMIENTO = [
  "fechaNacimiento",
  "nacimiento",
  "fecha_nacimiento",
  "asociadoNacimiento",
  "asociado_nacimiento",
] as const;

const CAMPOS_FECHA_TITULAR = ["fechaNacimiento", "nacimiento", "fecha_nacimiento"] as const;

const CAMPOS_FECHA_ASOCIADO = ["asociadoNacimiento", "asociado_nacimiento"] as const;

function esFirestoreTimestamp(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof (v as { toDate: unknown }).toDate === "function"
  );
}

/** Convierte string, Timestamp o {seconds} de Firestore a texto yyyy-mm-dd. */
export function valorAFechaTexto(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();

  if (esFirestoreTimestamp(v)) {
    const d = v.toDate();
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  if (typeof v === "object" && v !== null && "seconds" in v) {
    const sec = (v as { seconds: number }).seconds;
    if (typeof sec === "number") {
      const d = new Date(sec * 1000);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    }
  }

  return "";
}

function normalizarFechaTexto(texto: string): string {
  const t = texto.trim();
  if (!t) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const parsed = parseFechaNacimiento(t);
  if (!parsed) return "";
  const d = new Date(t.includes("T") ? t : `${t.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
}

function extraerDesdeCampos(
  data: Record<string, unknown>,
  campos: readonly string[]
): string {
  for (const key of campos) {
    const texto = valorAFechaTexto(data[key]);
    if (!texto) continue;
    const normalizada = normalizarFechaTexto(texto);
    if (normalizada && parseFechaNacimiento(normalizada)) return normalizada;
  }
  return "";
}

/** Lee la primera fecha de nacimiento presente en el documento. */
export function extraerFechaNacimiento(data: Record<string, unknown>): string {
  return extraerDesdeCampos(data, CAMPOS_FECHA_NACIMIENTO);
}

/** Consejero titular: no usar la fecha del asociado del mismo documento. */
export function extraerFechaNacimientoTitular(data: Record<string, unknown>): string {
  return extraerDesdeCampos(data, CAMPOS_FECHA_TITULAR);
}

/** Consejero asociado en el mismo documento del titular. */
export function extraerFechaNacimientoAsociado(data: Record<string, unknown>): string {
  return extraerDesdeCampos(data, CAMPOS_FECHA_ASOCIADO);
}

/** Quita de "sin fecha" a quien ya tiene cumpleaños en cualquier otro registro del club. */
export function quitarSinFechaSiYaTieneFecha(
  sinFecha: RegistradoSinFecha[],
  conFecha: Omit<CumpleanosPersona, "diasHasta" | "editRegistroId">[]
): RegistradoSinFecha[] {
  const nombresConFecha = new Set(
    conFecha.map((p) => normalizarNombrePersona(p.nombre)).filter(Boolean)
  );
  return sinFecha.filter((p) => !nombresConFecha.has(normalizarNombrePersona(p.nombre)));
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
  personas: Omit<CumpleanosPersona, "diasHasta" | "editRegistroId">[],
  ventanaDias = 14,
  hoy: Date = new Date()
): CumpleanosPersona[] {
  const unicas = deduplicarRegistrosConFecha(personas);
  const conDias: CumpleanosPersona[] = [];

  for (const p of unicas) {
    const partes = parseFechaNacimiento(p.fechaTexto);
    if (!partes) continue;
    const dias = diasHastaCumpleanos(partes.month, partes.day, hoy);
    if (dias <= ventanaDias) {
      conDias.push({
        ...p,
        diasHasta: dias,
        editRegistroId: p.editRegistroId,
      });
    }
  }

  return conDias.sort((a, b) => a.diasHasta - b.diasHasta);
}

export function etiquetaDiasCumpleanos(dias: number): string {
  if (dias === 0) return "¡Hoy es su cumpleaños!";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}
