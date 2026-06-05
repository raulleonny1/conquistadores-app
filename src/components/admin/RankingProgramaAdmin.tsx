"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { ArrowLeft, Medal, Search, Trophy, UserRound, Users } from "lucide-react";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { queryColeccionClub } from "@/src/lib/clubScope";
import {
  COLECCION_POR_PROGRAMA,
  type ColeccionCalificacionesPrograma,
} from "@/src/constants/categoriasPrograma";
import {
  claveDocCalificacionesGrupoPrograma,
  esDocumentoCalificacionesGrupoPrograma,
  indexarTotalesPorGrupoPrograma,
} from "@/src/lib/calificacionesPrograma";
import { calcularRankingGruposPrograma } from "@/src/lib/rankingGruposPrograma";
import { indexarTotalesPorPin, getCategoriasConPuntos, sumarPuntos } from "@/src/lib/categoriasPuntos";
import BotonNotificarPadres from "@/src/components/padres/BotonNotificarPadres";
import { mensajePadresResumenAvance } from "@/src/utils/mensajesPadres";
import {
  progresoInsigniasClase,
  normalizarInsignias,
} from "@/src/lib/progresoAventurero";
import { progresoInsigniasClaseJA } from "@/src/lib/progresoJA";

type VistaRanking = "miembros" | "grupos";

type MiembroRanking = {
  id: string;
  pin: string;
  nombre: string;
  clase: string;
  grupo: string;
  whatsapp: string;
  insignias: Record<string, boolean>;
};

type RankingProgramaAdminProps = {
  programa: "aventureros" | "ja";
  titulo: string;
  coleccionMiembros: "aventureros" | "jovenesJA";
  campoGrupo: "club" | "grupo";
  etiquetaGrupo: string;
  color: "amber" | "violet";
};

export default function RankingProgramaAdmin({
  programa,
  titulo,
  coleccionMiembros,
  campoGrupo,
  etiquetaGrupo,
  color,
}: RankingProgramaAdminProps) {
  const router = useRouter();
  const { clubId, clubSlug, clubNombre } = useClubActivo();
  const coleccionPts = COLECCION_POR_PROGRAMA[programa] as ColeccionCalificacionesPrograma;
  const rutaActividades =
    programa === "aventureros"
      ? "/admin/registros/actividades-aventureros"
      : "/admin/registros/actividades-ja";

  const [vistaRanking, setVistaRanking] = useState<VistaRanking>("miembros");
  const [loading, setLoading] = useState(true);
  const [miembros, setMiembros] = useState<MiembroRanking[]>([]);
  const [totalesPorPin, setTotalesPorPin] = useState<Record<string, number>>({});
  const [totalesPorGrupo, setTotalesPorGrupo] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [filtroClase, setFiltroClase] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [pinSeleccionado, setPinSeleccionado] = useState("");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [detallePuntos, setDetallePuntos] = useState<Record<string, number>>({});
  const [detalleEtiquetas, setDetalleEtiquetas] = useState<Record<string, string>>({});
  const [detalleGrupoPuntos, setDetalleGrupoPuntos] = useState<Record<string, number>>({});
  const [detalleGrupoEtiquetas, setDetalleGrupoEtiquetas] = useState<Record<string, string>>({});

  const accent = color === "amber" ? "text-amber-700" : "text-violet-700";
  const activeBorder = color === "amber" ? "border-amber-300 bg-amber-50" : "border-violet-300 bg-violet-50";
  const vistaActive = color === "amber" ? "bg-amber-600 text-white" : "bg-violet-600 text-white";
  const badgePts = color === "amber" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800";
  const cardGrupo = color === "amber" ? "border-amber-200 bg-amber-50" : "border-violet-200 bg-violet-50";
  const cardGrupoText = color === "amber" ? "text-amber-900" : "text-violet-900";
  const cardGrupoSub = color === "amber" ? "text-amber-700" : "text-violet-700";

  useEffect(() => {
    if (!clubId) return;
    (async () => {
      setLoading(true);
      try {
        const qM = queryColeccionClub(coleccionMiembros, clubId);
        if (!qM) return;
        const snap = await getDocs(qM);
        const lista = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
          const rawGrupo = String(data[campoGrupo] ?? "").trim();
          return {
            id: d.id,
            pin: String(data.pin ?? d.id).trim(),
            nombre: nombre || "Sin nombre",
            clase: String(data.clase ?? ""),
            grupo: rawGrupo || "Sin asignar",
            whatsapp: String(data.whatsapp ?? ""),
            insignias: normalizarInsignias(data.insignias as Record<string, unknown>),
          };
        });

        const pinsClub = new Set(lista.map((m) => m.pin));
        const ptsSnap = await getDocs(collection(db, coleccionPts));

        const docsPersonas = ptsSnap.docs
          .filter((d) => {
            const data = d.data() as { clubId?: string; pin?: string };
            if (esDocumentoCalificacionesGrupoPrograma(d.id, data as Record<string, unknown>)) {
              return false;
            }
            if (data.clubId && data.clubId !== clubId) return false;
            return pinsClub.has(d.id) || pinsClub.has(String(data.pin ?? ""));
          })
          .map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> }));

        const docsGrupos = ptsSnap.docs
          .filter((d) => {
            const data = d.data() as { clubId?: string };
            if (!esDocumentoCalificacionesGrupoPrograma(d.id, data as Record<string, unknown>)) {
              return false;
            }
            if (data.clubId && data.clubId !== clubId) return false;
            return true;
          })
          .map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> }));

        setMiembros(lista);
        setTotalesPorPin(indexarTotalesPorPin(docsPersonas));
        setTotalesPorGrupo(indexarTotalesPorGrupoPrograma(docsGrupos));
        if (lista.length > 0) setPinSeleccionado(lista[0].pin);

        const rankingG = calcularRankingGruposPrograma(
          lista.map((m) => ({ pin: m.pin, nombre: m.nombre, grupo: m.grupo })),
          indexarTotalesPorPin(docsPersonas),
          indexarTotalesPorGrupoPrograma(docsGrupos)
        );
        if (rankingG.length > 0) {
          setGrupoSeleccionado((prev) => prev || rankingG[0].grupo);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId, coleccionMiembros, coleccionPts, campoGrupo]);

  useEffect(() => {
    if (vistaRanking !== "miembros" || !pinSeleccionado) return;
    (async () => {
      const ref = doc(db, coleccionPts, pinSeleccionado);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setDetallePuntos({});
        setDetalleEtiquetas({});
        return;
      }
      const data = snap.data();
      const raw = (data.puntos as Record<string, unknown>) || {};
      const pts: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        pts[k] = typeof v === "number" ? v : parseInt(String(v), 10) || 0;
      }
      setDetallePuntos(pts);
      setDetalleEtiquetas((data.etiquetasActividades as Record<string, string>) || {});
    })();
  }, [pinSeleccionado, coleccionPts, vistaRanking]);

  useEffect(() => {
    if (vistaRanking !== "grupos" || !grupoSeleccionado) return;
    (async () => {
      const docId = claveDocCalificacionesGrupoPrograma(grupoSeleccionado);
      const ref = doc(db, coleccionPts, docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setDetalleGrupoPuntos({});
        setDetalleGrupoEtiquetas({});
        return;
      }
      const data = snap.data();
      const raw = (data.puntos as Record<string, unknown>) || {};
      const pts: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        pts[k] = typeof v === "number" ? v : parseInt(String(v), 10) || 0;
      }
      setDetalleGrupoPuntos(pts);
      setDetalleGrupoEtiquetas((data.etiquetasActividades as Record<string, string>) || {});
    })();
  }, [grupoSeleccionado, coleccionPts, vistaRanking]);

  const clases = useMemo(
    () => [...new Set(miembros.map((m) => m.clase).filter(Boolean))].sort(),
    [miembros]
  );
  const gruposFiltro = useMemo(
    () => [...new Set(miembros.map((m) => m.grupo).filter(Boolean))].sort(),
    [miembros]
  );

  const ranking = useMemo(() => {
    let lista = [...miembros];
    if (filtroClase) lista = lista.filter((m) => m.clase === filtroClase);
    if (filtroGrupo) lista = lista.filter((m) => m.grupo === filtroGrupo);
    const t = search.trim().toLowerCase();
    if (t) {
      lista = lista.filter(
        (m) =>
          m.nombre.toLowerCase().includes(t) ||
          m.pin.includes(t) ||
          m.grupo.toLowerCase().includes(t)
      );
    }
    return lista
      .map((m) => ({ ...m, total: totalesPorPin[m.pin] ?? 0 }))
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es"));
  }, [miembros, filtroClase, filtroGrupo, search, totalesPorPin]);

  const rankingGrupos = useMemo(
    () =>
      calcularRankingGruposPrograma(
        miembros.map((m) => ({ pin: m.pin, nombre: m.nombre, grupo: m.grupo })),
        totalesPorPin,
        totalesPorGrupo
      ),
    [miembros, totalesPorPin, totalesPorGrupo]
  );

  const rankingGruposFiltrado = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rankingGrupos;
    return rankingGrupos.filter((g) => g.grupo.toLowerCase().includes(t));
  }, [rankingGrupos, search]);

  const seleccionado = ranking.find((m) => m.pin === pinSeleccionado) ?? ranking[0];
  const posicion =
    seleccionado != null ? ranking.findIndex((m) => m.pin === seleccionado.pin) + 1 : 0;

  const grupoActivo =
    rankingGrupos.find((g) => g.grupo === grupoSeleccionado) ?? rankingGrupos[0];

  const progInsignias =
    seleccionado && programa === "aventureros"
      ? progresoInsigniasClase(seleccionado.clase, seleccionado.insignias)
      : seleccionado
        ? progresoInsigniasClaseJA(seleccionado.clase, seleccionado.insignias)
        : null;

  const categorias = getCategoriasConPuntos(detallePuntos, detalleEtiquetas);
  const totalDetalle = sumarPuntos(detallePuntos, detalleEtiquetas);
  const categoriasGrupo = getCategoriasConPuntos(detalleGrupoPuntos, detalleGrupoEtiquetas);
  const totalGrupoDetalle = sumarPuntos(detalleGrupoPuntos, detalleGrupoEtiquetas);

  const mensajeWhatsapp =
    seleccionado && seleccionado.whatsapp
      ? mensajePadresResumenAvance({
          nombreHijo: seleccionado.nombre,
          programa,
          clubNombre: clubNombre || clubSlug,
          clubSlug,
          pin: seleccionado.pin,
          totalPuntos: seleccionado.total,
          clase: seleccionado.clase,
          insigniasCompletadas: progInsignias?.completadas,
          insigniasTotal: progInsignias?.total,
          posicionRanking: posicion,
        })
      : "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Panel admin
          </button>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setVistaRanking("miembros")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                vistaRanking === "miembros" ? vistaActive : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserRound className="h-3.5 w-3.5" />
              Por miembro
            </button>
            <button
              type="button"
              onClick={() => setVistaRanking("grupos")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                vistaRanking === "grupos" ? vistaActive : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Por {etiquetaGrupo.toLowerCase()}
            </button>
          </div>
        </div>

        <h1 className={`flex items-center gap-2 text-2xl font-black ${accent}`}>
          <Trophy className="h-7 w-7" />
          {titulo}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Por miembro: puntos individuales. Por {etiquetaGrupo.toLowerCase()}: total del grupo (modo
          grupo, no se reparten).
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border bg-white p-5 shadow-sm">
            {vistaRanking === "miembros" ? (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  <select
                    value={filtroClase}
                    onChange={(e) => setFiltroClase(e.target.value)}
                    className="rounded-lg border px-2 py-1 text-sm"
                  >
                    <option value="">Todas las clases</option>
                    {clases.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value)}
                    className="rounded-lg border px-2 py-1 text-sm"
                  >
                    <option value="">Todos los {etiquetaGrupo.toLowerCase()}s</option>
                    {gruposFiltro.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar miembro..."
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                {loading ? (
                  <p className="py-8 text-center text-sm text-slate-500">Cargando…</p>
                ) : ranking.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Sin miembros.</p>
                ) : (
                  <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                    {ranking.map((m, idx) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setPinSeleccionado(m.pin)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                            pinSeleccionado === m.pin
                              ? activeBorder
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">
                              #{idx + 1} {m.nombre}
                            </p>
                            <p className="text-xs text-slate-500">
                              {m.clase}
                              {m.grupo ? ` · ${m.grupo}` : ""}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgePts}`}>
                            {m.total}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p className="mb-3 text-xs text-slate-500">
                  Puntos otorgados en modo «por {etiquetaGrupo.toLowerCase()}» (un registro por{" "}
                  {etiquetaGrupo.toLowerCase()} en Firebase).
                </p>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Buscar ${etiquetaGrupo.toLowerCase()}...`}
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                {loading ? (
                  <p className="py-8 text-center text-sm text-slate-500">Cargando…</p>
                ) : rankingGruposFiltrado.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No hay {etiquetaGrupo.toLowerCase()}s con miembros registrados.
                  </p>
                ) : (
                  <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                    {rankingGruposFiltrado.map((g, idx) => (
                      <li key={g.grupo}>
                        <button
                          type="button"
                          onClick={() => setGrupoSeleccionado(g.grupo)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            grupoSeleccionado === g.grupo
                              ? activeBorder
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">
                                #{idx + 1} {g.grupo}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {g.cantidadMiembros} miembro
                                {g.cantidadMiembros !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-bold ${badgePts}`}>
                              {g.totalPuntosGrupo}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </aside>

          <section className="lg:col-span-8 rounded-2xl border bg-white p-5 shadow-sm">
            {vistaRanking === "grupos" ? (
              !grupoActivo ? (
                <p className="py-16 text-center text-slate-500">
                  Selecciona un {etiquetaGrupo.toLowerCase()} para ver el detalle.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${cardGrupo}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest ${cardGrupoSub}`}>
                        Puntos del {etiquetaGrupo.toLowerCase()}
                      </p>
                      <div className={`mt-2 flex items-center gap-2 text-3xl font-black ${cardGrupoText}`}>
                        <Trophy className="h-7 w-7" />
                        {grupoActivo.totalPuntosGrupo}
                      </div>
                      <p className={`text-sm ${cardGrupoSub}`}>
                        calificaciones en modo grupo (no se dividen entre miembros)
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {etiquetaGrupo}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                        <Users className="h-5 w-5" />
                        {grupoActivo.grupo}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {grupoActivo.cantidadMiembros} miembros en el registro
                      </p>
                    </div>
                  </div>

                  {categoriasGrupo.length > 0 && (
                    <div className="rounded-xl border border-slate-200">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                          Desglose puntos del {etiquetaGrupo.toLowerCase()} ({totalGrupoDetalle} pts)
                        </h2>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {categoriasGrupo.map((c) => (
                          <li
                            key={c.id}
                            className="flex justify-between px-4 py-2.5 text-sm"
                          >
                            <span>{c.nombre}</span>
                            <span className="font-bold">{c.valor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                        Puntos personales por miembro
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Nombre</th>
                            <th className="px-4 py-3 text-right">Pts personales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupoActivo.miembros.map((m, i) => (
                            <tr key={m.pin} className="border-t border-slate-200">
                              <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-800">{m.nombre}</td>
                              <td className="px-4 py-3 text-right font-bold text-indigo-700">
                                {m.puntosPersonales}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                          <tr>
                            <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-700">
                              Total {etiquetaGrupo.toLowerCase()} (modo grupo)
                            </td>
                            <td className={`px-4 py-3 text-right font-black ${accent}`}>
                              {grupoActivo.totalPuntosGrupo}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Para calificar a todo el {etiquetaGrupo.toLowerCase()} de una vez: Admin →
                    Registros →{" "}
                    <button
                      type="button"
                      className={`font-semibold underline ${accent}`}
                      onClick={() => router.push(rutaActividades)}
                    >
                      Puntos actividades
                    </button>{" "}
                    → modo «Por {etiquetaGrupo.toLowerCase()}».
                  </p>
                </div>
              )
            ) : seleccionado ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      <Medal className="h-5 w-5 text-amber-500" />
                      {seleccionado.nombre}
                    </h2>
                    <p className="text-sm text-slate-500">
                      #{posicion} en ranking · {totalDetalle} pts · {seleccionado.grupo}
                    </p>
                  </div>
                  {seleccionado.whatsapp && mensajeWhatsapp && (
                    <BotonNotificarPadres
                      whatsapp={seleccionado.whatsapp}
                      mensaje={mensajeWhatsapp}
                      label="WhatsApp padres"
                      compacto
                    />
                  )}
                </div>
                {categorias.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin desglose de puntos.</p>
                ) : (
                  <ul className="space-y-2">
                    {categorias.map((c) => (
                      <li
                        key={c.id}
                        className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                      >
                        <span>{c.nombre}</span>
                        <span className="font-bold">{c.valor}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {progInsignias && progInsignias.total > 0 && (
                  <p className="mt-4 text-sm text-slate-600">
                    Insignias: {progInsignias.completadas}/{progInsignias.total}
                  </p>
                )}
                {seleccionado.whatsapp && mensajeWhatsapp && (
                  <div className="mt-6">
                    <BotonNotificarPadres
                      whatsapp={seleccionado.whatsapp}
                      mensaje={mensajeWhatsapp}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Selecciona un miembro.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
