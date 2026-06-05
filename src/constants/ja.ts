export const CLASES_JA = [
  { nombre: "Amigo JA", edad: "15" },
  { nombre: "Compañero JA", edad: "16" },
  { nombre: "Explorador JA", edad: "17" },
  { nombre: "Guía JA", edad: "18" },
  { nombre: "Guía Mayor JA", edad: "19" },
] as const;

export type ClaseJA = (typeof CLASES_JA)[number]["nombre"];
