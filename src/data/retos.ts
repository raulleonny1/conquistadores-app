export interface RetoEspecial {
  id: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  unidad: string;
  consejeroId: string;
  fecha: string;
}

// Ejemplo de estructura
export const retosEjemplo: RetoEspecial[] = [
  {
    id: "reto1",
    titulo: "Aprende 5 nudos nuevos",
    descripcion: "Completa el reto y gana 200 XP extra.",
    puntos: 200,
    unidad: "Gemas de Shaddai",
    consejeroId: "85ye3zTe9RjGcY96czOh",
    fecha: "2026-03-13"
  }
];
