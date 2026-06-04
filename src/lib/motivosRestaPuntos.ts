export const MOTIVOS_RESTA_PUNTOS = [
  { id: "error_registro", label: "Error de registro" },
  { id: "falta_asistencia", label: "Falta de asistencia / puntualidad" },
  { id: "disciplina", label: "Conducta / disciplina" },
  { id: "correccion_admin", label: "Corrección del administrador" },
  { id: "otro", label: "Otro (especificar)" },
] as const;

export type MotivoRestaId = (typeof MOTIVOS_RESTA_PUNTOS)[number]["id"];

export function etiquetaMotivoResta(id: string): string {
  const found = MOTIVOS_RESTA_PUNTOS.find((m) => m.id === id);
  return found?.label ?? id;
}

export function textoMotivoCompleto(motivo: string, detalle?: string): string {
  const base = etiquetaMotivoResta(motivo);
  if (motivo === "otro" && detalle?.trim()) return detalle.trim();
  if (detalle?.trim()) return `${base}: ${detalle.trim()}`;
  return base;
}
