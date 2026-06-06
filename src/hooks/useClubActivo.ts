"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buscarClubPorSlug } from "@/src/lib/clubs";
import {
  guardarSesionClub,
  obtenerClubIdSesion,
  obtenerClubNombreSesion,
  obtenerClubSlugSesion,
} from "@/src/lib/clubSession";
import type { ProgramaClub } from "@/src/types/club";

export function useClubActivo() {
  const params = useSearchParams();
  const clubSlugUrl = params.get("club");
  const [synced, setSynced] = useState(false);
  const [programas, setProgramas] = useState<ProgramaClub[]>([]);

  useEffect(() => {
    const slug = clubSlugUrl || obtenerClubSlugSesion();
    if (!slug) {
      setSynced(true);
      setProgramas([]);
      return;
    }
    let cancelado = false;
    (async () => {
      const club = await buscarClubPorSlug(slug);
      if (!cancelado && club?.activo) {
        guardarSesionClub(club);
        setProgramas(club.programas ?? []);
      } else if (!cancelado) {
        setProgramas([]);
      }
      if (!cancelado) setSynced(true);
    })();
    return () => {
      cancelado = true;
    };
  }, [clubSlugUrl]);

  return useMemo(() => {
    const slug = clubSlugUrl || obtenerClubSlugSesion() || "";
    const id = slug || obtenerClubIdSesion() || "";
    const nombre = obtenerClubNombreSesion() || "";
    return { clubId: id, clubSlug: slug, clubNombre: nombre, programas, listo: synced };
  }, [clubSlugUrl, synced, programas]);
}
