export const CARGO_ASPIRANTE = "Aspirante";

export const ASOCIACIONES_MISION = ["Misión Ecuatoriana del Sur"] as const;

export const CAMPOS_OBLIGATORIOS_ASPIRANTE = [
  "nombre",
  "apellido",
  "edad",
  "nacimiento",
  "genero",
  "fichaMedicaUrl",
  "cargo",
  "asociacion",
] as const;

export function registroAspiranteCompleto(data: Record<string, unknown>): boolean {
  const genero = data.genero ?? data.sexo;
  return CAMPOS_OBLIGATORIOS_ASPIRANTE.every((campo) => {
    if (campo === "genero") {
      return Boolean(genero && String(genero).trim());
    }
    const valor = data[campo];
    return valor !== undefined && valor !== null && String(valor).trim() !== "";
  });
}

export function nombreCompletoAspirante(data: {
  nombre?: string;
  apellido?: string;
}): string {
  return [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
}
