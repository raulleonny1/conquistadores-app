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

export function useClubActivo() {
  const params = useSearchParams();
  const clubSlugUrl = params.get("club");
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!clubSlugUrl) {
      setSynced(true);
      return;
    }
    let cancelado = false;
    (async () => {
      const club = await buscarClubPorSlug(clubSlugUrl);
      if (!cancelado && club?.activo) {
        guardarSesionClub(club);
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
    return { clubId: id, clubSlug: slug, clubNombre: nombre, listo: synced };
  }, [clubSlugUrl, synced]);
}
