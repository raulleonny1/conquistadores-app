export type EstadoEspecialidad =
  | "inscrito"
  | "estudiando"
  | "practicando"
  | "evaluacion"
  | "completada";

export type EspecialidadEnCurso = {
  area: string;
  categoria: string;
  especialidad: string;
  estado: EstadoEspecialidad;
};

export const ESTADO_INICIAL_ESPECIALIDAD: EstadoEspecialidad = "inscrito";

export const ESTADOS_ESPECIALIDAD: { id: EstadoEspecialidad; label: string }[] = [
  { id: "inscrito", label: "Inscrito" },
  { id: "estudiando", label: "Estudiando" },
  { id: "practicando", label: "Practicando" },
  { id: "evaluacion", label: "En evaluación" },
  { id: "completada", label: "Completada" },
];

const ESTADOS_VALIDOS = new Set<string>(ESTADOS_ESPECIALIDAD.map((e) => e.id));

export function normalizarEstado(valor: unknown): EstadoEspecialidad {
  const id = String(valor ?? "").trim() as EstadoEspecialidad;
  return ESTADOS_VALIDOS.has(id) ? id : ESTADO_INICIAL_ESPECIALIDAD;
}

export function claveEspecialidadEnCurso(e: {
  area: string;
  categoria: string;
  especialidad: string;
}): string {
  return `${e.area}|||${e.categoria}|||${e.especialidad}`;
}

export function etiquetaEstadoEspecialidad(estado: EstadoEspecialidad): string {
  return ESTADOS_ESPECIALIDAD.find((e) => e.id === estado)?.label ?? estado;
}

export function estiloEstadoEspecialidad(estado: EstadoEspecialidad): string {
  switch (estado) {
    case "inscrito":
      return "bg-slate-100 text-slate-700";
    case "estudiando":
      return "bg-sky-100 text-sky-800";
    case "practicando":
      return "bg-amber-100 text-amber-900";
    case "evaluacion":
      return "bg-violet-100 text-violet-800";
    case "completada":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function parseEspecialidadesEnCurso(raw: unknown): EspecialidadEnCurso[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => parseEspecialidadEnCurso(item))
      .filter((e): e is EspecialidadEnCurso => e != null);
  }
  const una = parseEspecialidadEnCurso(raw);
  return una ? [una] : [];
}

export function parseEspecialidadEnCurso(raw: unknown): EspecialidadEnCurso | null {
  if (raw == null) return null;

  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    return parseEspecialidadEnCurso(raw[0]);
  }

  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const especialidad = String(o.especialidad ?? "").trim();
    if (!especialidad) return null;
    return {
      area: String(o.area ?? "").trim(),
      categoria: String(o.categoria ?? "").trim(),
      especialidad,
      estado: normalizarEstado(o.estado),
    };
  }

  if (typeof raw === "string" && raw.trim()) {
    return {
      area: "",
      categoria: "",
      especialidad: raw.trim(),
      estado: ESTADO_INICIAL_ESPECIALIDAD,
    };
  }

  return null;
}
