import { storageSeguroGet, storageSeguroSet } from "@/src/lib/storageSeguro";

const CLUB_ID_KEY = "clubId";
const CLUB_SLUG_KEY = "clubSlug";
const CLUB_NOMBRE_KEY = "clubNombre";

export function guardarSesionClub(club: {
  id: string;
  slug: string;
  nombre: string;
}): void {
  storageSeguroSet(CLUB_ID_KEY, club.id);
  storageSeguroSet(CLUB_SLUG_KEY, club.slug);
  storageSeguroSet(CLUB_NOMBRE_KEY, club.nombre);
}

export function obtenerClubIdSesion(): string | null {
  return storageSeguroGet(CLUB_ID_KEY);
}

export function obtenerClubSlugSesion(): string | null {
  return storageSeguroGet(CLUB_SLUG_KEY);
}

export function obtenerClubNombreSesion(): string | null {
  return storageSeguroGet(CLUB_NOMBRE_KEY);
}

export function limpiarSesionClub(): void {
  storageSeguroSet(CLUB_ID_KEY, "");
  storageSeguroSet(CLUB_SLUG_KEY, "");
  storageSeguroSet(CLUB_NOMBRE_KEY, "");
}
