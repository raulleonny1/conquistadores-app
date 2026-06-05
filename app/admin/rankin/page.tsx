"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, Medal, Search, Trophy, UserRound, Users } from "lucide-react";
import { expandirConsejerosYAsociados } from "@/src/lib/actividadesCalificacion";
import {
  getCategoriasConPuntos,
  indexarTotalesPorPin,
  indexarTotalesPorUnidad,
  sumarPuntos,
  toNumberPuntos,
} from "@/src/lib/categoriasPuntos";
import {
  construirEntradasRanking,
  etiquetaTipoParticipante,
  totalPuntosEntrada,
  type ParticipanteRankingRaw,
} from "@/src/lib/rankingPersonas";
import {
  calcularRankingUnidades,
  type ConquistadorUnidad,
} from "@/src/lib/rankingUnidades";
import { canonicalizarUnidad } from "@/src/lib/unidades";
import { nombreCompletoAspirante } from "@/src/constants/aspirante";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { queryColeccionClub } from "@/src/lib/clubScope";

type Participante = ParticipanteRankingRaw;

type TotalesPorPin = Record<string, number>;

type RegistroSemanal = {
  id: string;
  fecha: string;
  puntos: Record<string, number | string>;
  totalEvento: number;
};

type CategoriaResumen = {
  categoria: string;
  puntos: number;
};

const CATEGORIAS_PUNTOS = [
  { id: "puntualidad", nombre: "Puntualidad" },
  { id: "asistencia", nombre: "Asistencia" },
  { id: "disciplina", nombre: "Disciplina" },
  { id: "reclutador", nombre: "Reclutador" },
  { id: "materiales", nombre: "Materiales" },
  { id: "fidelidad", nombre: "Fidelidad Eclesiástica" },
  { id: "misionero", nombre: "Misionero" },
  { id: "colaborador", nombre: "Colaborador" },
  { id: "orden_cerrado", nombre: "Orden Cerrado" },
  { id: "tareas", nombre: "Completar Tareas" },
  { id: "especialidades", nombre: "Especialidades" },
];

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseInt(value, 10) || 0;
  return 0;
}

function parseDate(fecha: string): number {
  const [d, m, y] = (fecha || "").split("/");
  if (!d || !m || !y) return 0;
  const dd = parseInt(d, 10);
  const mm = parseInt(m, 10) - 1;
  const yy = parseInt(y, 10);
  if (Number.isNaN(dd) || Number.isNaN(mm) || Number.isNaN(yy)) return 0;
  return new Date(yy, mm, dd).getTime();
}

export default function RankinPage() {
  const router = useRouter();
  const { clubId } = useClubActivo();
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<
    "todos" | "conquistador" | "aspirante" | "consejero"
  >("todos");
  const [vistaRanking, setVistaRanking] = useState<"personas" | "unidades">("personas");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [conquisUnidad, setConquisUnidad] = useState<ConquistadorUnidad[]>([]);
  const [catalogoUnidades, setCatalogoUnidades] = useState<string[]>([]);
  const [selectedUnidad, setSelectedUnidad] = useState<string>("");
  const [totalesPorPin, setTotalesPorPin] = useState<TotalesPorPin>({});
  const [totalesPorUnidadClave, setTotalesPorUnidadClave] = useState<Record<string, number>>(
    {}
  );
  const [selectedRankingKey, setSelectedRankingKey] = useState<string>("");
  const [resumenCategorias, setResumenCategorias] = useState<CategoriaResumen[]>([]);
  const [historial, setHistorial] = useState<RegistroSemanal[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);

  useEffect(() => {
    if (!clubId) {
      setParticipantes([]);
      setLoading(false);
      return;
    }

    const loadParticipantes = async () => {
      setLoading(true);
      try {
        const qConquis = queryColeccionClub("RegistroConquis", clubId);
        const qAspirantes = queryColeccionClub("aspirantesGuiaMayor", clubId);
        const qConsejeros = queryColeccionClub("consejeros", clubId);
        const qUnidades = queryColeccionClub("unidades", clubId);
        if (!qConquis || !qAspirantes || !qConsejeros || !qUnidades) return;

        const [conquisSnap, aspirantesSnap, consejerosSnap, unidadesSnap] =
          await Promise.all([
          getDocs(qConquis),
          getDocs(qAspirantes),
          getDocs(qConsejeros),
          getDocs(qUnidades),
        ]);

        const unidadesOficiales = unidadesSnap.docs
          .map((d) => String((d.data() as { nombre?: string }).nombre ?? "").trim())
          .filter(Boolean);

        const conquisUnidadLista: ConquistadorUnidad[] = conquisSnap.docs.map((d) => {
          const data = d.data() as Partial<{
            nombre: string;
            apellido: string;
            pin: string;
            unidad: string;
          }>;
          const fullName = [data.nombre || "", data.apellido || ""].join(" ").trim();
          const rawUnidad = (data.unidad || "Sin unidad").trim() || "Sin unidad";
          return {
            pin: String(data.pin ?? d.id).trim(),
            nombre: fullName || "Sin nombre",
            unidad:
              rawUnidad === "Sin unidad"
                ? rawUnidad
                : canonicalizarUnidad(rawUnidad, unidadesOficiales),
          };
        });

        const conquis: Participante[] = conquisSnap.docs.map((d) => {
          const data = d.data() as Partial<{ nombre: string; apellido: string; pin: string }>;
          const fullName = [data.nombre || "", data.apellido || ""].join(" ").trim();
          return {
            id: d.id,
            nombre: fullName || "Sin nombre",
            pin: String(data.pin ?? d.id).trim(),
            tipo: "conquistador",
          };
        });

        const aspirantes: Participante[] = aspirantesSnap.docs.map((d) => {
          const data = d.data() as Partial<{ nombre: string; apellido: string; pin: string }>;
          return {
            id: d.id,
            nombre: nombreCompletoAspirante(data) || data.nombre || "Sin nombre",
            pin: String(data.pin ?? d.id).trim(),
            tipo: "aspirante",
          };
        });

        const consejeros: Participante[] = expandirConsejerosYAsociados(consejerosSnap.docs).map(
          (c) => ({
            id: c.listaId,
            nombre: c.nombre,
            pin: c.pin,
            tipo: c.rol === "asociado" ? ("asociado" as const) : ("consejero" as const),
          })
        );

        const merged = [...conquis, ...aspirantes, ...consejeros]
          .filter((p) => Boolean(p.pin))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

        const pinsClub = new Set(merged.map((p) => p.pin));
        const totalesSnapshot = await getDocs(collection(db, "calificacionesConquis"));
        const docsCalif = totalesSnapshot.docs
          .filter((d) => pinsClub.has(d.id) || pinsClub.has(String(d.data().pin ?? "")))
          .map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          }));
        const totalesMap: TotalesPorPin = indexarTotalesPorPin(docsCalif);
        const totalesUnidadMap = indexarTotalesPorUnidad(docsCalif, unidadesOficiales);

        setParticipantes(merged);
        setConquisUnidad(conquisUnidadLista.filter((c) => Boolean(c.pin)));
        setCatalogoUnidades(unidadesOficiales);
        setTotalesPorPin(totalesMap);
        setTotalesPorUnidadClave(totalesUnidadMap);
        const rankingUnidades = calcularRankingUnidades(
          conquisUnidadLista,
          totalesMap,
          totalesUnidadMap,
          unidadesOficiales
        );
        if (rankingUnidades.length > 0) {
          setSelectedUnidad((prev) => prev || rankingUnidades[0].unidad);
        }
      } finally {
        setLoading(false);
      }
    };

    loadParticipantes();
  }, [clubId]);

  const entradasRanking = useMemo(
    () => construirEntradasRanking(participantes, tipoFiltro),
    [participantes, tipoFiltro]
  );

  const entradasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? entradasRanking.filter((e) => e.nombre.toLowerCase().includes(term))
      : entradasRanking;

    return [...list].sort(
      (a, b) =>
        totalPuntosEntrada(b, totalesPorPin) - totalPuntosEntrada(a, totalesPorPin) ||
        a.nombre.localeCompare(b.nombre, "es")
    );
  }, [entradasRanking, search, totalesPorPin]);

  const entradaSeleccionada = useMemo(() => {
    if (entradasFiltradas.length === 0) return null;
    return (
      entradasFiltradas.find((e) => e.key === selectedRankingKey) ?? entradasFiltradas[0]
    );
  }, [entradasFiltradas, selectedRankingKey]);

  useEffect(() => {
    if (entradasFiltradas.length === 0) return;
    if (!entradasFiltradas.some((e) => e.key === selectedRankingKey)) {
      setSelectedRankingKey(entradasFiltradas[0].key);
    }
  }, [entradasFiltradas, selectedRankingKey]);

  useEffect(() => {
    if (!entradaSeleccionada || entradaSeleccionada.pins.length === 0) return;

    const loadDetalle = async () => {
      setLoadingDetail(true);
      try {
        const [totalesSnaps, historialSnaps] = await Promise.all([
          Promise.all(
            entradaSeleccionada.pins.map((pin) =>
              getDoc(doc(db, "calificacionesConquis", pin))
            )
          ),
          Promise.all(
            entradaSeleccionada.pins.map((pin) =>
              getDocs(
                query(collection(db, "calificacionesSemanal"), where("pin", "==", pin))
              )
            )
          ),
        ]);

        const puntosMap: Record<string, unknown> = {};
        const etiquetas: Record<string, string> = {};

        for (const snap of totalesSnaps) {
          if (!snap.exists()) continue;
          const data = snap.data();
          const pts = (data.puntos as Record<string, unknown>) || {};
          for (const [k, v] of Object.entries(pts)) {
            puntosMap[k] = toNumberPuntos(puntosMap[k]) + toNumberPuntos(v);
          }
          Object.assign(
            etiquetas,
            (data.etiquetasActividades as Record<string, string>) || {}
          );
        }

        const categorias = getCategoriasConPuntos(puntosMap, etiquetas).map((c) => ({
          categoria: c.nombre,
          puntos: c.valor,
        }));

        setResumenCategorias(categorias);
        setTotalGeneral(sumarPuntos(puntosMap, etiquetas));

        const eventos: RegistroSemanal[] = [];
        for (const snap of historialSnaps) {
          for (const d of snap.docs) {
            const data = d.data() as Partial<{
              fecha: string;
              puntos: Record<string, number | string>;
            }>;
            const pts = data.puntos || {};
            const totalEvento = Object.values(pts).reduce<number>(
              (acc, value) => acc + toNumber(value),
              0
            );
            eventos.push({
              id: d.id,
              fecha: data.fecha || "",
              puntos: pts,
              totalEvento,
            });
          }
        }
        eventos.sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha));
        setHistorial(eventos);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetalle();
  }, [entradaSeleccionada]);

  const rankingUnidades = useMemo(
    () =>
      calcularRankingUnidades(
        conquisUnidad,
        totalesPorPin,
        totalesPorUnidadClave,
        catalogoUnidades
      ),
    [conquisUnidad, totalesPorPin, totalesPorUnidadClave, catalogoUnidades]
  );

  const rankingUnidadesFiltrado = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rankingUnidades;
    return rankingUnidades.filter((u) => u.unidad.toLowerCase().includes(term));
  }, [rankingUnidades, search]);

  const unidadSeleccionada = useMemo(
    () => rankingUnidades.find((u) => u.unidad === selectedUnidad),
    [rankingUnidades, selectedUnidad]
  );

  const filteredParticipantes = entradasFiltradas;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Ranking General</h1>
            <p className="text-sm text-slate-500">
              Por persona: calificaciones individuales. Por unidad: total del grupo (no se reparten entre miembros).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setVistaRanking("personas")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  vistaRanking === "personas"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <UserRound className="h-3.5 w-3.5" />
                Por persona
              </button>
              <button
                type="button"
                onClick={() => setVistaRanking("unidades")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  vistaRanking === "unidades"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Por unidad
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push("/admin/rankin-aventureros")}
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200"
            >
              Aventureros
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/rankin-ja")}
              className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-200"
            >
              JA
            </button>
            <button
            type="button"
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
          >
            <ArrowLeft size={16} />
            Volver al menu
          </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {vistaRanking === "personas" ? (
              <>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setTipoFiltro("todos")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tipoFiltro === "todos" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTipoFiltro("conquistador")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tipoFiltro === "conquistador"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Conquistadores
              </button>
              <button
                type="button"
                onClick={() => setTipoFiltro("aspirante")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tipoFiltro === "aspirante"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Aspirantes
              </button>
              <button
                type="button"
                onClick={() => setTipoFiltro("consejero")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tipoFiltro === "consejero"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Consejeros
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Cargando participantes...</p>
            ) : filteredParticipantes.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No se encontraron participantes.</p>
            ) : (
              <ul className="space-y-2">
                {filteredParticipantes.map((entrada, idx) => {
                  const active = entrada.key === (entradaSeleccionada?.key ?? "");
                  const total = totalPuntosEntrada(entrada, totalesPorPin);
                  const rank = idx + 1;
                  return (
                    <li key={entrada.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedRankingKey(entrada.key)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800">
                              #{rank} {entrada.nombre}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {entrada.etiquetasTipos.map((etiq) => (
                                <span
                                  key={etiq}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                                >
                                  {etiq}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                            {total}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
              </>
            ) : (
              <>
                <p className="mb-3 text-xs text-slate-500">
                  Puntos otorgados en modo «por unidad» (un registro por unidad en Firebase).
                </p>
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar unidad..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                {loading ? (
                  <p className="py-8 text-center text-sm text-slate-500">Cargando unidades...</p>
                ) : rankingUnidadesFiltrado.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No hay conquistadores con unidad registrada.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {rankingUnidadesFiltrado.map((u, idx) => {
                      const active = u.unidad === selectedUnidad;
                      return (
                        <li key={u.unidad}>
                          <button
                            type="button"
                            onClick={() => setSelectedUnidad(u.unidad)}
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-cyan-300 bg-cyan-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  #{idx + 1} {u.unidad}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {u.cantidadMiembros} conquistador
                                  {u.cantidadMiembros !== 1 ? "es" : ""}
                                </p>
                              </div>
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                                {u.totalPuntosUnidad}
                              </span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </aside>

          <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {vistaRanking === "unidades" ? (
              !unidadSeleccionada ? (
                <div className="flex min-h-72 items-center justify-center text-slate-500">
                  Selecciona una unidad para ver el detalle.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                        Puntos de la unidad
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-3xl font-black text-cyan-900">
                        <Trophy className="h-7 w-7" />
                        {unidadSeleccionada.totalPuntosUnidad}
                      </div>
                      <p className="text-sm text-cyan-700">
                        calificaciones en modo grupo (no se dividen entre miembros)
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Unidad
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                        <Users className="h-5 w-5 text-cyan-600" />
                        {unidadSeleccionada.unidad}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {unidadSeleccionada.cantidadMiembros} miembros en el registro
                      </p>
                    </div>
                  </div>

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
                          {unidadSeleccionada.miembros.map((m, i) => (
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
                              Total unidad (modo grupo)
                            </td>
                            <td className="px-4 py-3 text-right font-black text-cyan-800">
                              {unidadSeleccionada.totalPuntosUnidad}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Para calificar a toda la unidad de una vez: Admin → Registros →{" "}
                    <button
                      type="button"
                      className="font-semibold text-cyan-700 underline"
                      onClick={() => router.push("/admin/registros/actividades-conquistadores")}
                    >
                      Actividades conquistadores
                    </button>{" "}
                    → modo «Por grupo (unidad)». Los consejeros pueden hacerlo desde su panel →
                    calificaciones por unidad.
                  </p>
                </div>
              )
            ) : !entradaSeleccionada ? (
              <div className="flex min-h-72 items-center justify-center text-slate-500">
                Selecciona una persona para ver su detalle.
              </div>
            ) : loadingDetail ? (
              <div className="flex min-h-72 items-center justify-center text-slate-500">Cargando detalle...</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Total acumulado</p>
                    <div className="mt-2 flex items-center gap-2 text-3xl font-black text-amber-900">
                      <Trophy className="h-7 w-7" />
                      {totalGeneral}
                    </div>
                    <p className="text-sm text-amber-700">
                      {entradaSeleccionada.pins.length > 1
                        ? "suma para ranking (cada cargo tiene su PIN aparte)"
                        : "puntos"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Participante</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                      <UserRound className="h-5 w-5 text-indigo-600" />
                      {entradaSeleccionada.nombre}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entradaSeleccionada.etiquetasTipos.map((etiq) => (
                        <span
                          key={etiq}
                          className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800"
                        >
                          {etiq}
                        </span>
                      ))}
                    </div>
                    {entradaSeleccionada.pins.length > 1 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Vista unificada solo en ranking. Login y dashboards usan un PIN por cargo.
                      </p>
                    )}
                  </div>
                </div>

                {entradaSeleccionada.entradas.length > 1 && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40">
                    <div className="border-b border-indigo-100 px-4 py-3">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
                        Puntos por cargo (PINs separados)
                      </h2>
                      <p className="mt-1 text-xs text-indigo-800">
                        Cada fila es un registro distinto en Firebase. No se fusionan PINs.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-indigo-100/60 text-xs uppercase tracking-wider text-indigo-900">
                          <tr>
                            <th className="px-4 py-2 text-left">Cargo</th>
                            <th className="px-4 py-2 text-left">PIN</th>
                            <th className="px-4 py-2 text-right">Puntos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entradaSeleccionada.entradas.map((e) => (
                            <tr key={`${e.tipo}-${e.pin}`} className="border-t border-indigo-100">
                              <td className="px-4 py-2 font-medium text-slate-800">
                                {etiquetaTipoParticipante(e.tipo)}
                              </td>
                              <td className="px-4 py-2 font-mono text-slate-600">{e.pin}</td>
                              <td className="px-4 py-2 text-right font-bold text-indigo-800">
                                {totalesPorPin[e.pin] ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-indigo-200 bg-indigo-100/40">
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-right font-bold text-indigo-900">
                              Total en ranking «Todos»
                            </td>
                            <td className="px-4 py-2 text-right font-black text-indigo-900">
                              {totalPuntosEntrada(entradaSeleccionada, totalesPorPin)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">Detalle por categorias</h2>
                  </div>
                  {resumenCategorias.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500">Sin puntos acumulados por categorias.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                      {resumenCategorias.map((item) => (
                        <div
                          key={item.categoria}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">{item.categoria}</span>
                          <span className="font-bold text-slate-900">{item.puntos}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">Historial por evento</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      <Medal className="h-3.5 w-3.5" />
                      {historial.length} eventos
                    </span>
                  </div>
                  {historial.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500">Aun no hay registros de eventos para esta persona.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left">Fecha</th>
                            <th className="px-4 py-3 text-left">Detalle</th>
                            <th className="px-4 py-3 text-right">Total evento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historial.map((ev) => (
                            <tr key={ev.id} className="border-t border-slate-200">
                              <td className="px-4 py-3 font-medium text-slate-700">{ev.fecha || "Sin fecha"}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {CATEGORIAS_PUNTOS.filter((cat) => toNumber(ev.puntos?.[cat.id]) > 0).map((cat) => (
                                    <span
                                      key={`${ev.id}-${cat.id}`}
                                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                                    >
                                      {cat.nombre}: {toNumber(ev.puntos?.[cat.id])}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-indigo-700">{ev.totalEvento}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
