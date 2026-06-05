import { etiquetaPrograma, type ProgramaMiembro } from "@/src/lib/buscarMiembroClub";

function urlPortalPadres(clubSlug: string, pin: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/padres/dashboard?club=${encodeURIComponent(clubSlug)}&pin=${encodeURIComponent(pin)}`;
  }
  return `/padres/dashboard?club=${encodeURIComponent(clubSlug)}&pin=${encodeURIComponent(pin)}`;
}

export function mensajePadresInvitacionPortal(data: {
  nombreHijo: string;
  programa: ProgramaMiembro;
  clubNombre: string;
  clubSlug: string;
  pin: string;
}): string {
  const prog = etiquetaPrograma(data.programa);
  return [
    `Hola, desde ${data.clubNombre} te compartimos el acceso al portal de padres de ConquisApp.`,
    `Puedes ver el avance de ${data.nombreHijo} (${prog}): puntos, insignias y actividades.`,
    `PIN de tu hijo/a: ${data.pin}`,
    `Enlace: ${urlPortalPadres(data.clubSlug, data.pin)}`,
    "Guarda el PIN en un lugar seguro. No lo compartas públicamente.",
  ].join("\n");
}

export function mensajePadresResumenAvance(data: {
  nombreHijo: string;
  programa: ProgramaMiembro;
  clubNombre: string;
  clubSlug: string;
  pin: string;
  totalPuntos: number;
  clase: string;
  insigniasCompletadas?: number;
  insigniasTotal?: number;
  posicionRanking?: number;
}): string {
  const prog = etiquetaPrograma(data.programa);
  const lineas = [
    `Hola, actualización de ${data.nombreHijo} en ${data.clubNombre} (${prog}):`,
    `• Clase/nivel: ${data.clase}`,
    `• Puntos acumulados: ${data.totalPuntos}`,
  ];
  if (
    data.insigniasTotal != null &&
    data.insigniasTotal > 0 &&
    data.insigniasCompletadas != null
  ) {
    lineas.push(`• Insignias: ${data.insigniasCompletadas}/${data.insigniasTotal}`);
  }
  if (data.posicionRanking != null && data.posicionRanking > 0) {
    lineas.push(`• Posición en ranking: #${data.posicionRanking}`);
  }
  lineas.push(
    `Consulta el detalle en el portal de padres (PIN ${data.pin}):`,
    urlPortalPadres(data.clubSlug, data.pin)
  );
  return lineas.join("\n");
}

export function mensajePadresNuevosPuntos(data: {
  nombreHijo: string;
  clubNombre: string;
  actividad: string;
  puntos: number;
  totalPuntos: number;
  clubSlug: string;
  pin: string;
}): string {
  return [
    `Hola, ${data.nombreHijo} recibió +${data.puntos} pts en «${data.actividad}» (${data.clubNombre}).`,
    `Total acumulado: ${data.totalPuntos} pts.`,
    `Ver avance: ${urlPortalPadres(data.clubSlug, data.pin)}`,
  ].join("\n");
}

export function mensajePadresInsignia(data: {
  nombreHijo: string;
  clubNombre: string;
  insigniaNombre: string;
  clase: string;
  clubSlug: string;
  pin: string;
}): string {
  return [
    `¡Buenas noticias desde ${data.clubNombre}!`,
    `${data.nombreHijo} completó la insignia «${data.insigniaNombre}» (clase ${data.clase}).`,
    `Ver avance: ${urlPortalPadres(data.clubSlug, data.pin)}`,
  ].join("\n");
}

export function mensajePadresPromocion(data: {
  nombreHijo: string;
  clubNombre: string;
  claseAnterior: string;
  claseNueva: string;
  clubSlug: string;
  pin: string;
}): string {
  return [
    `¡Felicitaciones desde ${data.clubNombre}!`,
    `${data.nombreHijo} fue promovido/a de ${data.claseAnterior} a ${data.claseNueva}.`,
    `Ver avance: ${urlPortalPadres(data.clubSlug, data.pin)}`,
  ].join("\n");
}
