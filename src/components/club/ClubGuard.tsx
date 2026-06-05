"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buscarClubPorSlug } from "@/src/lib/clubs";
import {
  guardarSesionClub,
  obtenerClubIdSesion,
  obtenerClubNombreSesion,
} from "@/src/lib/clubSession";

type ClubGuardProps = {
  children: React.ReactNode;
  loginHref?: string;
  mostrarBarra?: boolean;
};

export default function ClubGuard({
  children,
  loginHref = "/login/club",
  mostrarBarra = true,
}: ClubGuardProps) {
  const router = useRouter();
  const params = useSearchParams();
  const clubUrl = params.get("club");

  const [listo, setListo] = useState(false);
  const [nombreClub, setNombreClub] = useState(obtenerClubNombreSesion() ?? "");

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const slug = clubUrl || obtenerClubIdSesion();
      if (!slug) {
        router.replace(loginHref);
        return;
      }

      if (clubUrl && clubUrl !== obtenerClubIdSesion()) {
        const club = await buscarClubPorSlug(clubUrl);
        if (!club || !club.activo) {
          router.replace(loginHref);
          return;
        }
        guardarSesionClub(club);
        if (!cancelado) setNombreClub(club.nombre);
      } else if (!cancelado) {
        setNombreClub(obtenerClubNombreSesion() || slug);
      }

      if (!cancelado) setListo(true);
    })();

    return () => {
      cancelado = true;
    };
  }, [clubUrl, loginHref, router]);

  if (!listo) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Verificando acceso al club…</p>
      </div>
    );
  }

  return (
    <>
      {mostrarBarra && nombreClub && (
        <div className="border-b border-indigo-200/60 bg-indigo-50 px-4 py-2 text-center text-xs font-semibold text-indigo-800">
          Club activo: <span className="font-black">{nombreClub}</span>
          {clubUrl && (
            <span className="ml-2 text-indigo-500/70">({clubUrl})</span>
          )}
        </div>
      )}
      {children}
    </>
  );
}
