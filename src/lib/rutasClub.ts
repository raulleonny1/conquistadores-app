import { obtenerClubSlugSesion } from "@/src/lib/clubSession";

/** Añade ?club=slug a rutas internas para mantener el contexto del club. */
export function rutaConClub(path: string, clubSlug?: string | null): string {
  const slug = clubSlug?.trim() || obtenerClubSlugSesion();
  if (!slug) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}club=${encodeURIComponent(slug)}`;
}
