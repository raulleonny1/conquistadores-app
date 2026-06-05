export const CLASES_AVENTUREROS = [
  { nombre: "Corderito", edad: "5" },
  { nombre: "Castor", edad: "6" },
  { nombre: "Chispa", edad: "7" },
  { nombre: "Estrella", edad: "8" },
  { nombre: "Constructor", edad: "9" },
  { nombre: "Ayudante", edad: "10" },
] as const;

export type ClaseAventurero = (typeof CLASES_AVENTUREROS)[number]["nombre"];
