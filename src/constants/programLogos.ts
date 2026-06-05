/** Emblemas oficiales Ministerio Joven (Mundo J.A. — División Interamericana). */
export const LOGO_CONQUISTADORES = "/logos/conquistadores.png";
export const LOGO_AVENTUREROS = "/logos/aventureros.png";
export const LOGO_JA = "/logos/ja.png";
export const LOGO_MINISTERIO_JOVEN = "/logos/ministerio-joven.png";

export const PROGRAMAS_HOME = [
  {
    id: "conquistadores" as const,
    nombre: "Conquistadores",
    tagline: "Explora · Sirve · Crece",
    descripcion: "Unidades, calificaciones, especialidades y camino a Guía Mayor.",
    logo: LOGO_CONQUISTADORES,
    login: "/login/conquistadores",
    gradiente: "from-red-600 via-rose-500 to-orange-500",
    glow: "shadow-red-500/40",
    borde: "border-red-400/40",
    fondo: "bg-red-500/10",
  },
  {
    id: "aventureros" as const,
    nombre: "Aventureros",
    tagline: "Aventura · Familia · Fe",
    descripcion: "Clases, actividades y seguimiento del progreso aventurero.",
    logo: LOGO_AVENTUREROS,
    login: "/login/aventureros",
    gradiente: "from-rose-800 via-red-700 to-amber-600",
    glow: "shadow-rose-700/40",
    borde: "border-rose-400/40",
    fondo: "bg-rose-500/10",
  },
  {
    id: "ja" as const,
    nombre: "Jóvenes Adventistas",
    tagline: "Lidera · Conecta · Impacta",
    descripcion: "Eventos, asistencia y liderazgo del ministerio juvenil.",
    logo: LOGO_JA,
    login: "/login/ja",
    gradiente: "from-violet-600 via-purple-500 to-fuchsia-500",
    glow: "shadow-violet-500/40",
    borde: "border-violet-400/40",
    fondo: "bg-violet-500/10",
  },
];
