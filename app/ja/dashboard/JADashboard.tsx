"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/src/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Calendar, LogOut, Trophy, User } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { COLECCION_POR_PROGRAMA } from "@/src/constants/categoriasPrograma";
import { getCategoriasConPuntos, sumarPuntos } from "@/src/lib/categoriasPuntos";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";
import { buscarClubPorSlug } from "@/src/lib/clubs";
import { ordenarEventosPorFecha, type EventoFirestore } from "@/src/lib/eventos";
import { LOGO_JA } from "@/src/constants/programLogos";
import Image from "next/image";
import PanelInsignias from "@/src/components/programas/PanelInsignias";
import {
  getSiguienteClaseJA,
  normalizarInsignias,
  progresoInsigniasClaseJA,
  progresoProgramaJA,
} from "@/src/lib/progresoJA";

type JovenPerfil = {
  nombre: string;
  apellido: string;
  clase: string;
  grupo: string;
  edad: string;
  pin: string;
  insignias: Record<string, boolean>;
};

export default function JADashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const pin = params.get("pin") ?? "";
  const clubSlug = params.get("club") ?? "";

  const [perfil, setPerfil] = useState<JovenPerfil | null>(null);
  const [clubNombre, setClubNombre] = useState("");
  const [eventos, setEventos] = useState<EventoFirestore[]>([]);
  const [puntos, setPuntos] = useState<Record<string, number>>({});
  const [etiquetas, setEtiquetas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pin || !clubSlug) {
      setError("Falta el PIN o el código del club. Entra desde el login de JA.");
      setLoading(false);
      return;
    }

    let cancelado = false;

    (async () => {
      try {
        await ensureFirebaseSession();
        const club = await buscarClubPorSlug(clubSlug);
        if (!club?.activo) {
          if (!cancelado) setError("Club no encontrado.");
          return;
        }
        if (!club.programas.includes("ja")) {
          if (!cancelado) setError("Este club no tiene habilitado el programa JA.");
          return;
        }

        const snap = await getDocs(
          query(
            collection(db, "jovenesJA"),
            where("clubId", "==", club.id),
            where("pin", "==", pin)
          )
        );

        if (snap.empty) {
          if (!cancelado) setError("PIN incorrecto para este club.");
          return;
        }

        const data = snap.docs[0].data();
        const eventosSnap = await getDocs(
          query(collection(db, "eventos"), where("clubId", "==", club.id))
        );
        const listaEventos = eventosSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EventoFirestore, "id">),
        }));

        if (!cancelado) {
          setClubNombre(club.nombre);
          setPerfil({
            nombre: String(data.nombre ?? ""),
            apellido: String(data.apellido ?? ""),
            clase: String(data.clase ?? ""),
            grupo: String(data.grupo ?? ""),
            edad: String(data.edad ?? ""),
            pin,
            insignias: normalizarInsignias(data.insignias as Record<string, unknown>),
          });
          setEventos(ordenarEventosPorFecha(listaEventos).slice(0, 5));
        }
      } catch {
        if (!cancelado) setError("No se pudo cargar tu panel. Revisa la conexión.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [pin, clubSlug]);

  useEffect(() => {
    if (!pin) return;
    const ref = doc(db, COLECCION_POR_PROGRAMA.ja, pin);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setPuntos({});
        setEtiquetas({});
        return;
      }
      const data = snap.data();
      const raw = (data.puntos as Record<string, unknown>) || {};
      const pts: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        pts[k] = typeof v === "number" ? v : parseInt(String(v), 10) || 0;
      }
      setPuntos(pts);
      setEtiquetas((data.etiquetasActividades as Record<string, string>) || {});
    });
    return () => unsub();
  }, [pin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-violet-950 text-violet-100">
        Cargando tu panel…
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-violet-950 px-6 text-center text-white">
        <p className="text-lg font-semibold text-violet-200">{error || "Sin datos"}</p>
        <Link
          href="/login/ja"
          className="mt-6 rounded-xl bg-violet-500 px-6 py-3 font-bold text-white hover:bg-violet-400"
        >
          Ir al login
        </Link>
      </div>
    );
  }

  const progreso = progresoInsigniasClaseJA(perfil.clase, perfil.insignias);
  const siguienteClase = getSiguienteClaseJA(perfil.clase);
  const progresoPrograma = progresoProgramaJA(perfil.clase, perfil.insignias);
  const totalPuntos = sumarPuntos(puntos);
  const categorias = getCategoriasConPuntos(puntos, etiquetas);

  return (
    <div className="min-h-screen bg-linear-to-b from-violet-950 via-slate-950 to-slate-950 text-white">
      <header className="border-b border-violet-500/20 bg-violet-950/50 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LOGO_JA} alt="Jóvenes Adventistas" width={40} height={40} className="rounded-lg" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400/80">
                {clubNombre}
              </p>
              <h1 className="text-xl font-black">¡Hola, {perfil.nombre}!</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-violet-500/25 bg-violet-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-violet-500/20 p-3">
              <User className="h-8 w-8 text-violet-300" />
            </div>
            <div>
              <p className="text-2xl font-black">
                {perfil.nombre} {perfil.apellido}
              </p>
              <p className="mt-1 text-violet-200/90">
                Clase: <strong className="text-white">{perfil.clase}</strong>
                {perfil.edad && <> · {perfil.edad} años</>}
              </p>
              {perfil.grupo && (
                <p className="mt-1 text-sm text-violet-200/70">Grupo: {perfil.grupo}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Mis puntos — {totalPuntos}
          </h2>
          {categorias.length === 0 ? (
            <p className="text-sm text-slate-400">Aún no tienes puntos registrados.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {categorias.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2.5"
                >
                  <span className="text-sm">{c.nombre}</span>
                  <span className="font-bold text-violet-400">{c.valor}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <PanelInsignias
          titulo="Insignias JA"
          clase={perfil.clase}
          siguienteClase={siguienteClase}
          progresoClase={progreso.porcentaje}
          progresoPrograma={progresoPrograma}
          completadas={progreso.completadas}
          total={progreso.total}
          insignias={progreso.insignias}
          tema="violet"
        />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Calendar className="h-5 w-5 text-violet-400" />
            Próximas actividades
          </h2>
          {eventos.length === 0 ? (
            <p className="text-sm text-slate-400">No hay eventos programados aún.</p>
          ) : (
            <ul className="space-y-3">
              {eventos.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3"
                >
                  <p className="font-semibold">{ev.nombre}</p>
                  <p className="text-sm text-slate-400">
                    {ev.fecha}
                    {ev.hora ? ` · ${ev.hora}` : ""}
                    {ev.lugar ? ` · ${ev.lugar}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
