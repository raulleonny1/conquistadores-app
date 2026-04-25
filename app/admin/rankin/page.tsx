"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, Medal, Search, Trophy, UserRound } from "lucide-react";

type Participante = {
  id: string;
  nombre: string;
  pin: string;
  tipo: "conquistador" | "aspirante";
};

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
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "conquistador" | "aspirante">("todos");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [totalesPorPin, setTotalesPorPin] = useState<TotalesPorPin>({});
  const [selectedPin, setSelectedPin] = useState<string>("");
  const [resumenCategorias, setResumenCategorias] = useState<CategoriaResumen[]>([]);
  const [historial, setHistorial] = useState<RegistroSemanal[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);

  useEffect(() => {
    const loadParticipantes = async () => {
      setLoading(true);
      try {
        const [conquisSnap, aspirantesSnap] = await Promise.all([
          getDocs(collection(db, "RegistroConquis")),
          getDocs(collection(db, "aspirantesGuiaMayor")),
        ]);

        const conquis: Participante[] = conquisSnap.docs.map((d) => {
          const data = d.data() as Partial<{ nombre: string; apellido: string; pin: string }>;
          const fullName = [data.nombre || "", data.apellido || ""].join(" ").trim();
          return {
            id: d.id,
            nombre: fullName || "Sin nombre",
            pin: data.pin || d.id,
            tipo: "conquistador",
          };
        });

        const aspirantes: Participante[] = aspirantesSnap.docs.map((d) => {
          const data = d.data() as Partial<{ nombre: string; pin: string }>;
          return {
            id: d.id,
            nombre: data.nombre || "Sin nombre",
            pin: data.pin || d.id,
            tipo: "aspirante",
          };
        });

        const merged = [...conquis, ...aspirantes]
          .filter((p) => Boolean(p.pin))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

        const totalesSnapshot = await getDocs(collection(db, "calificacionesConquis"));
        const totalesMap: TotalesPorPin = {};
        totalesSnapshot.docs.forEach((d) => {
          const data = d.data() as Partial<{ puntos: Record<string, unknown> }>;
          const puntos = data.puntos || {};
          totalesMap[d.id] = Object.values(puntos).reduce((acc, value) => acc + toNumber(value), 0);
        });

        setParticipantes(merged);
        setTotalesPorPin(totalesMap);
        if (merged.length > 0) {
          setSelectedPin((prev) => prev || merged[0].pin);
        }
      } finally {
        setLoading(false);
      }
    };

    loadParticipantes();
  }, []);

  useEffect(() => {
    if (!selectedPin) return;

    const loadDetalle = async () => {
      setLoadingDetail(true);
      try {
        const [totalesSnap, historialSnap] = await Promise.all([
          getDoc(doc(db, "calificacionesConquis", selectedPin)),
          getDocs(query(collection(db, "calificacionesSemanal"), where("pin", "==", selectedPin))),
        ]);

        const puntosMap = (totalesSnap.exists() ? (totalesSnap.data().puntos as Record<string, unknown>) : {}) || {};

        const categorias = CATEGORIAS_PUNTOS.map((cat) => ({
          categoria: cat.nombre,
          puntos: toNumber(puntosMap[cat.id]),
        })).filter((c) => c.puntos > 0);

        const computedTotal = Object.values(puntosMap).reduce((acc, value) => acc + toNumber(value), 0);
        setResumenCategorias(categorias);
        setTotalGeneral(computedTotal);

        const eventos: RegistroSemanal[] = historialSnap.docs
          .map((d) => {
            const data = d.data() as Partial<{ fecha: string; puntos: Record<string, number | string> }>;
            const puntos = data.puntos || {};
            const totalEvento = Object.values(puntos).reduce((acc, value) => acc + toNumber(value), 0);
            return {
              id: d.id,
              fecha: data.fecha || "",
              puntos,
              totalEvento,
            };
          })
          .sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha));

        setHistorial(eventos);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetalle();
  }, [selectedPin]);

  const filteredParticipantes = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filteredByType =
      tipoFiltro === "todos" ? participantes : participantes.filter((p) => p.tipo === tipoFiltro);
    const filteredBySearch = term
      ? filteredByType.filter((p) => p.nombre.toLowerCase().includes(term))
      : filteredByType;

    return [...filteredBySearch].sort((a, b) => {
      const totalA = totalesPorPin[a.pin] ?? 0;
      const totalB = totalesPorPin[b.pin] ?? 0;
      if (totalA !== totalB) return totalB - totalA;
      return a.nombre.localeCompare(b.nombre, "es");
    });
  }, [participantes, search, tipoFiltro, totalesPorPin]);

  const selectedParticipante = useMemo(
    () => participantes.find((p) => p.pin === selectedPin),
    [participantes, selectedPin]
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Ranking General</h1>
            <p className="text-sm text-slate-500">Puntos totales y detalle por evento para conquistadores y aspirantes.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
          >
            <ArrowLeft size={16} />
            Volver al menu
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                {filteredParticipantes.map((p) => {
                  const active = p.pin === selectedPin;
                  const total = totalesPorPin[p.pin] ?? 0;
                  const rank = filteredParticipantes.findIndex((item) => item.pin === p.pin) + 1;
                  return (
                    <li key={`${p.tipo}-${p.id}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedPin(p.pin)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800">#{rank} {p.nombre}</p>
                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                              {p.tipo === "conquistador" ? "Conquistador" : "Aspirante"}
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                            {total}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedParticipante ? (
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
                    <p className="text-sm text-amber-700">puntos</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Participante</p>
                    <div className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                      <UserRound className="h-5 w-5 text-indigo-600" />
                      {selectedParticipante.nombre}
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                      {selectedParticipante.tipo === "conquistador" ? "Conquistador" : "Aspirante a guía mayor"}
                    </p>
                  </div>
                </div>

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
