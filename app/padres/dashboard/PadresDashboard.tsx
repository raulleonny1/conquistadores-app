"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/src/firebase";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Award, Calendar, Heart, Trophy, User } from "lucide-react";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";
import { buscarClubPorSlug } from "@/src/lib/clubs";
import {
  buscarMiembroPorPinClub,
  etiquetaPrograma,
  type MiembroClubEncontrado,
} from "@/src/lib/buscarMiembroClub";
import { ordenarEventosPorFecha, type EventoFirestore } from "@/src/lib/eventos";
import { getCategoriasConPuntos, sumarPuntos } from "@/src/lib/categoriasPuntos";
import {
  getSiguienteClaseAventurero,
  progresoInsigniasClase,
  progresoProgramaAventurero,
} from "@/src/lib/progresoAventurero";
import {
  getSiguienteClaseJA,
  progresoInsigniasClaseJA,
  progresoProgramaJA,
} from "@/src/lib/progresoJA";
import PanelInsignias from "@/src/components/programas/PanelInsignias";

export default function PadresDashboard() {
  const params = useSearchParams();
  const clubSlug = params.get("club") ?? "";
  const pin = params.get("pin") ?? "";

  const [clubNombre, setClubNombre] = useState("");
  const [miembro, setMiembro] = useState<MiembroClubEncontrado | null>(null);
  const [puntos, setPuntos] = useState<Record<string, number>>({});
  const [etiquetas, setEtiquetas] = useState<Record<string, string>>({});
  const [eventos, setEventos] = useState<EventoFirestore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clubSlug || !pin) {
      setError("Faltan datos. Entra desde el portal de padres.");
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

        const encontrado = await buscarMiembroPorPinClub(club.id, pin);
        if (!encontrado) {
          if (!cancelado) setError("No encontramos un miembro con ese PIN en este club.");
          return;
        }

        const eventosSnap = await getDocs(
          query(collection(db, "eventos"), where("clubId", "==", club.id))
        );

        if (!cancelado) {
          setClubNombre(club.nombre);
          setMiembro(encontrado);
          setEventos(
            ordenarEventosPorFecha(
              eventosSnap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<EventoFirestore, "id">),
              }))
            ).slice(0, 5)
          );
        }
      } catch {
        if (!cancelado) setError("No se pudo cargar la información.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [clubSlug, pin]);

  useEffect(() => {
    if (!miembro) return;
    const ref = doc(db, miembro.coleccionCalificaciones, miembro.pin);
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
  }, [miembro]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-950 text-sky-100">
        Cargando avance…
      </div>
    );
  }

  if (error || !miembro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sky-950 px-6 text-center text-white">
        <p className="text-lg font-semibold text-sky-200">{error || "Sin datos"}</p>
        <Link href="/padres" className="mt-6 rounded-xl bg-sky-500 px-6 py-3 font-bold text-slate-950">
          Volver al portal
        </Link>
      </div>
    );
  }

  const nombreCompleto = [miembro.nombre, miembro.apellido].filter(Boolean).join(" ");
  const totalPuntos = sumarPuntos(puntos);
  const categorias = getCategoriasConPuntos(puntos, etiquetas);
  const temaInsignias = miembro.programa === "ja" ? "violet" : "amber";

  let panelInsignias = null;
  if (miembro.programa === "aventureros") {
    const prog = progresoInsigniasClase(miembro.clase, miembro.insignias);
    panelInsignias = (
      <PanelInsignias
        titulo="Insignias de clase"
        clase={miembro.clase}
        siguienteClase={getSiguienteClaseAventurero(miembro.clase)}
        progresoClase={prog.porcentaje}
        progresoPrograma={progresoProgramaAventurero(miembro.clase, miembro.insignias)}
        completadas={prog.completadas}
        total={prog.total}
        insignias={prog.insignias}
        tema="amber"
      />
    );
  } else if (miembro.programa === "ja") {
    const prog = progresoInsigniasClaseJA(miembro.clase, miembro.insignias);
    panelInsignias = (
      <PanelInsignias
        titulo="Insignias JA"
        clase={miembro.clase}
        siguienteClase={getSiguienteClaseJA(miembro.clase)}
        progresoClase={prog.porcentaje}
        progresoPrograma={progresoProgramaJA(miembro.clase, miembro.insignias)}
        completadas={prog.completadas}
        total={prog.total}
        insignias={prog.insignias}
        tema="violet"
      />
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-950 via-slate-950 to-slate-950 text-white">
      <header className="border-b border-sky-500/20 px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400/80">
            Portal de padres · {clubNombre}
          </p>
          <h1 className="mt-1 text-xl font-black">Avance de {miembro.nombre}</h1>
          <p className="text-sm text-slate-400">{etiquetaPrograma(miembro.programa)}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-3xl border border-sky-500/25 bg-sky-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-sky-500/20 p-3">
              <User className="h-8 w-8 text-sky-300" />
            </div>
            <div>
              <p className="text-2xl font-black">{nombreCompleto}</p>
              {miembro.clase && (
                <p className="mt-1 text-sky-200/90">
                  {miembro.programa === "conquistadores" ? "Clase" : "Nivel"}:{" "}
                  <strong>{miembro.clase}</strong>
                </p>
              )}
              {miembro.grupo && (
                <p className="text-sm text-slate-400">
                  {miembro.programa === "conquistadores" ? "Unidad" : "Grupo"}: {miembro.grupo}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Puntos — {totalPuntos} total
          </h2>
          {categorias.length === 0 ? (
            <p className="text-sm text-slate-400">Aún no hay puntos registrados.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {categorias.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2.5"
                >
                  <span className="text-sm">{c.nombre}</span>
                  <span className="font-bold text-yellow-400">{c.valor}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {panelInsignias}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Calendar className="h-5 w-5 text-sky-400" />
            Próximas actividades del club
          </h2>
          {eventos.length === 0 ? (
            <p className="text-sm text-slate-400">Sin eventos programados.</p>
          ) : (
            <ul className="space-y-3">
              {eventos.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-white/10 px-4 py-3">
                  <p className="font-semibold">{ev.nombre}</p>
                  <p className="text-sm text-slate-400">
                    {ev.fecha}
                    {ev.lugar ? ` · ${ev.lugar}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Heart className="h-4 w-4 text-sky-600" />
          Vista de solo lectura para padres y tutores
        </p>

        <div className="text-center">
          <Link href="/padres" className="text-sm font-semibold text-sky-400 hover:text-sky-300">
            Consultar otro PIN
          </Link>
        </div>
      </main>
    </div>
  );
}
