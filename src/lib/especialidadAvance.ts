import { addDoc, collection } from "firebase/firestore";
import { db } from "@/src/firebase";
import {
  type EspecialidadEnCurso,
  type EstadoEspecialidad,
  normalizarEstado,
} from "@/src/lib/especialidadEnCurso";

export type EspecialidadAvanceHistorialEntry = {
  id: string;
  conquisId: string;
  pin: string;
  nombre: string;
  unidad: string;
  especialidad: string;
  estadoAnterior: EstadoEspecialidad | null;
  estadoNuevo: EstadoEspecialidad;
  tipo: "asignacion" | "cambio_estado";
  origen: "individual" | "unidad";
  createdAt: string;
};

function etiquetaEspecialidad(esp: EspecialidadEnCurso): string {
  return [esp.area, esp.categoria, esp.especialidad].filter(Boolean).join(" · ");
}

export async function registrarAvanceEspecialidad(params: {
  conquisId: string;
  pin: string;
  nombre: string;
  unidad: string;
  esp: EspecialidadEnCurso;
  estadoAnterior: EstadoEspecialidad | null;
  estadoNuevo: EstadoEspecialidad;
  tipo: "asignacion" | "cambio_estado";
  origen: "individual" | "unidad";
  clubId?: string;
}): Promise<void> {
  await addDoc(collection(db, "especialidadAvanceHistorial"), {
    conquisId: params.conquisId,
    pin: params.pin,
    nombre: params.nombre,
    unidad: params.unidad,
    area: params.esp.area,
    categoria: params.esp.categoria,
    especialidadNombre: params.esp.especialidad,
    especialidad: etiquetaEspecialidad(params.esp),
    estadoAnterior: params.estadoAnterior,
    estadoNuevo: params.estadoNuevo,
    tipo: params.tipo,
    origen: params.origen,
    createdAt: new Date().toISOString(),
    clubId: params.clubId ?? "",
  });
}

export function parseHistorialAvanceDoc(
  id: string,
  data: Record<string, unknown>
): EspecialidadAvanceHistorialEntry {
  const estadoAnteriorRaw = data.estadoAnterior;
  return {
    id,
    conquisId: String(data.conquisId ?? ""),
    pin: String(data.pin ?? ""),
    nombre: String(data.nombre ?? ""),
    unidad: String(data.unidad ?? ""),
    especialidad: String(
      data.especialidad ??
        [data.area, data.categoria, data.especialidadNombre].filter(Boolean).join(" · ")
    ),
    estadoAnterior:
      estadoAnteriorRaw == null || estadoAnteriorRaw === ""
        ? null
        : normalizarEstado(estadoAnteriorRaw),
    estadoNuevo: normalizarEstado(data.estadoNuevo),
    tipo: data.tipo === "asignacion" ? "asignacion" : "cambio_estado",
    origen: data.origen === "unidad" ? "unidad" : "individual",
    createdAt: String(data.createdAt ?? ""),
  };
}

export function formatearFechaAvance(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
