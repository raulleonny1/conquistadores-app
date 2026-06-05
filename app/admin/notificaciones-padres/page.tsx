"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/src/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, Heart, MessageCircle, Search } from "lucide-react";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { queryColeccionClub } from "@/src/lib/clubScope";
import { COLECCION_POR_PROGRAMA } from "@/src/constants/categoriasPrograma";
import { indexarTotalesPorPin } from "@/src/lib/categoriasPuntos";
import { normalizarInsignias } from "@/src/lib/progresoAventurero";
import { progresoInsigniasClaseJA } from "@/src/lib/progresoJA";
import { progresoInsigniasClase as progAv } from "@/src/lib/progresoAventurero";
import BotonNotificarPadres from "@/src/components/padres/BotonNotificarPadres";
import {
  mensajePadresInvitacionPortal,
  mensajePadresResumenAvance,
} from "@/src/utils/mensajesPadres";
import { rutaConClub } from "@/src/lib/rutasClub";
import type { ProgramaMiembro } from "@/src/lib/buscarMiembroClub";

type FilaNotificacion = {
  id: string;
  pin: string;
  nombre: string;
  programa: ProgramaMiembro;
  clase: string;
  whatsapp: string;
  totalPuntos: number;
  insigniasCompletadas: number;
  insigniasTotal: number;
};

export default function NotificacionesPadresPage() {
  const router = useRouter();
  const { clubId, clubSlug, clubNombre } = useClubActivo();
  const [filas, setFilas] = useState<FilaNotificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"resumen" | "portal">("resumen");

  useEffect(() => {
    if (!clubId) return;
    (async () => {
      setLoading(true);
      try {
        const totales: Record<string, number> = {};

        const cargarPts = async (col: string, pins: Set<string>) => {
          const snap = await getDocs(collection(db, col));
          const docs = snap.docs
            .filter((d) => pins.has(d.id) || pins.has(String(d.data().pin ?? "")))
            .map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> }));
          Object.assign(totales, indexarTotalesPorPin(docs));
        };

        const resultado: FilaNotificacion[] = [];

        const qAv = queryColeccionClub("aventureros", clubId);
        if (qAv) {
          const snap = await getDocs(qAv);
          const pins = new Set(snap.docs.map((d) => String(d.data().pin ?? d.id).trim()));
          await cargarPts(COLECCION_POR_PROGRAMA.aventureros, pins);
          for (const d of snap.docs) {
            const data = d.data();
            const pin = String(data.pin ?? d.id).trim();
            const ins = normalizarInsignias(data.insignias as Record<string, unknown>);
            const prog = progAv(String(data.clase ?? ""), ins);
            const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
            if (!String(data.whatsapp ?? "").trim()) continue;
            resultado.push({
              id: d.id,
              pin,
              nombre,
              programa: "aventureros",
              clase: String(data.clase ?? ""),
              whatsapp: String(data.whatsapp ?? ""),
              totalPuntos: totales[pin] ?? 0,
              insigniasCompletadas: prog.completadas,
              insigniasTotal: prog.total,
            });
          }
        }

        const qJa = queryColeccionClub("jovenesJA", clubId);
        if (qJa) {
          const snap = await getDocs(qJa);
          const pins = new Set(snap.docs.map((d) => String(d.data().pin ?? d.id).trim()));
          await cargarPts(COLECCION_POR_PROGRAMA.ja, pins);
          for (const d of snap.docs) {
            const data = d.data();
            const pin = String(data.pin ?? d.id).trim();
            const ins = normalizarInsignias(data.insignias as Record<string, unknown>);
            const prog = progresoInsigniasClaseJA(String(data.clase ?? ""), ins);
            const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
            if (!String(data.whatsapp ?? "").trim()) continue;
            resultado.push({
              id: `ja-${d.id}`,
              pin,
              nombre,
              programa: "ja",
              clase: String(data.clase ?? ""),
              whatsapp: String(data.whatsapp ?? ""),
              totalPuntos: totales[pin] ?? 0,
              insigniasCompletadas: prog.completadas,
              insigniasTotal: prog.total,
            });
          }
        }

        const qConquis = queryColeccionClub("RegistroConquis", clubId);
        if (qConquis) {
          const snap = await getDocs(qConquis);
          const pins = new Set(snap.docs.map((d) => String(d.data().pin ?? d.id).trim()));
          await cargarPts("calificacionesConquis", pins);
          for (const d of snap.docs) {
            const data = d.data();
            const pin = String(data.pin ?? d.id).trim();
            const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
            if (!String(data.whatsapp ?? "").trim()) continue;
            resultado.push({
              id: `c-${d.id}`,
              pin,
              nombre,
              programa: "conquistadores",
              clase: String(data.clase ?? ""),
              whatsapp: String(data.whatsapp ?? ""),
              totalPuntos: totales[pin] ?? 0,
              insigniasCompletadas: 0,
              insigniasTotal: 0,
            });
          }
        }

        const qAsp = queryColeccionClub("aspirantesGuiaMayor", clubId);
        if (qAsp) {
          const snap = await getDocs(qAsp);
          const pins = new Set(snap.docs.map((d) => String(d.data().pin ?? d.id).trim()));
          await cargarPts("calificacionesConquis", pins);
          for (const d of snap.docs) {
            const data = d.data();
            const pin = String(data.pin ?? d.id).trim();
            const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
            const wa = String(data.whatsapp ?? data.telefono ?? "").trim();
            if (!wa) continue;
            resultado.push({
              id: `a-${d.id}`,
              pin,
              nombre,
              programa: "aspirante",
              clase: String(data.cargo ?? "Aspirante"),
              whatsapp: wa,
              totalPuntos: totales[pin] ?? 0,
              insigniasCompletadas: 0,
              insigniasTotal: 0,
            });
          }
        }

        setFilas(
          resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId]);

  const filtradas = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return filas;
    return filas.filter(
      (f) =>
        f.nombre.toLowerCase().includes(t) ||
        f.pin.includes(t) ||
        f.programa.includes(t)
    );
  }, [filas, busqueda]);

  const construirMensaje = (f: FilaNotificacion, posicion: number) => {
    if (tipoMensaje === "portal") {
      return mensajePadresInvitacionPortal({
        nombreHijo: f.nombre,
        programa: f.programa,
        clubNombre: clubNombre || clubSlug,
        clubSlug,
        pin: f.pin,
      });
    }
    return mensajePadresResumenAvance({
      nombreHijo: f.nombre,
      programa: f.programa,
      clubNombre: clubNombre || clubSlug,
      clubSlug,
      pin: f.pin,
      totalPuntos: f.totalPuntos,
      clase: f.clase,
      insigniasCompletadas: f.insigniasTotal > 0 ? f.insigniasCompletadas : undefined,
      insigniasTotal: f.insigniasTotal > 0 ? f.insigniasTotal : undefined,
      posicionRanking: posicion,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
      <div className="border-b border-sky-200 bg-linear-to-r from-sky-50 to-indigo-50 px-6 py-8">
        <button
          type="button"
          onClick={() => router.push(rutaConClub("/admin", clubSlug))}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Panel admin
        </button>
        <div className="flex items-center gap-3">
          <Heart className="h-10 w-10 text-sky-600" />
          <div>
            <h1 className="text-3xl font-black text-sky-950">Notificaciones a padres</h1>
            <p className="text-sm text-sky-800/80">
              Envía resúmenes por WhatsApp (abre la app con el mensaje listo).
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={tipoMensaje}
            onChange={(e) => setTipoMensaje(e.target.value as "resumen" | "portal")}
            className="rounded-xl border px-3 py-2 text-sm font-semibold"
          >
            <option value="resumen">Resumen de avance</option>
            <option value="portal">Invitación al portal de padres</option>
          </select>
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar miembro..."
              className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Solo aparecen miembros con WhatsApp registrado (número del padre/madre o tutor).
          El enlace del portal se genera automáticamente en cada mensaje.
        </p>

        {loading ? (
          <p className="text-center text-slate-500">Cargando…</p>
        ) : filtradas.length === 0 ? (
          <p className="text-center text-slate-500">
            No hay contactos con WhatsApp. Agrega el número al registrar miembros.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtradas.map((f, idx) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-bold text-slate-800">{f.nombre}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {f.programa} · {f.clase} · {f.totalPuntos} pts · PIN {f.pin}
                  </p>
                </div>
                <BotonNotificarPadres
                  whatsapp={f.whatsapp}
                  mensaje={construirMensaje(f, idx + 1)}
                  label="Enviar WhatsApp"
                />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Los padres también pueden entrar directamente en{" "}
          <Link href="/padres" className="font-semibold text-sky-600 underline">
            /padres
          </Link>
        </p>
      </div>
    </div>
  );
}
