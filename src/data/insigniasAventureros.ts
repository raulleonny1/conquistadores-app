export type InsigniaDef = {
  id: string;
  nombre: string;
  area: string;
};

/** Insignias de clase (simplificadas del programa oficial). */
export const INSIGNIAS_POR_CLASE: Record<string, InsigniaDef[]> = {
  Corderito: [
    { id: "cor-biblia", nombre: "Mi Biblia", area: "Espiritual" },
    { id: "cor-familia", nombre: "Mi familia", area: "Hogar" },
    { id: "cor-naturaleza", nombre: "Amigo de la naturaleza", area: "Naturaleza" },
    { id: "cor-alfabeto", nombre: "Alfabeto aventurero", area: "Educación" },
  ],
  Castor: [
    { id: "cas-biblia", nombre: "Historias bíblicas", area: "Espiritual" },
    { id: "cas-animales", nombre: "Animales", area: "Naturaleza" },
    { id: "cas-salud", nombre: "Cuerpo sano", area: "Salud" },
    { id: "cas-manualidades", nombre: "Manualidades", area: "Arte" },
  ],
  Chispa: [
    { id: "chi-biblia", nombre: "Héroes de la Biblia", area: "Espiritual" },
    { id: "chi-plantas", nombre: "Plantas y semillas", area: "Naturaleza" },
    { id: "chi-cocina", nombre: "Ayudante en cocina", area: "Hogar" },
    { id: "chi-deportes", nombre: "Juegos y deportes", area: "Recreación" },
  ],
  Estrella: [
    { id: "est-biblia", nombre: "Diez mandamientos", area: "Espiritual" },
    { id: "est-astronomia", nombre: "Estrellas y planetas", area: "Ciencia" },
    { id: "est-primeros-auxilios", nombre: "Primeros auxilios básicos", area: "Salud" },
    { id: "est-musica", nombre: "Música y canto", area: "Arte" },
  ],
  Constructor: [
    { id: "con-biblia", nombre: "Vida de Jesús", area: "Espiritual" },
    { id: "con-camping", nombre: "Acampada", area: "Aire libre" },
    { id: "con-misionero", nombre: "Misionero joven", area: "Misionero" },
    { id: "con-construccion", nombre: "Construcción y herramientas", area: "Habilidades" },
  ],
  Ayudante: [
    { id: "ayu-biblia", nombre: "Profetas y reyes", area: "Espiritual" },
    { id: "ayu-liderazgo", nombre: "Líder en entrenamiento", area: "Liderazgo" },
    { id: "ayu-servicio", nombre: "Servicio comunitario", area: "Misionero" },
    { id: "ayu-graduacion", nombre: "Listo para Conquistadores", area: "Graduación" },
  ],
};

export function insigniasDeClase(clase: string): InsigniaDef[] {
  return INSIGNIAS_POR_CLASE[clase] ?? [];
}
