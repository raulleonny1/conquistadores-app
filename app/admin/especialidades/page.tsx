"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/src/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { especialidadesBase } from "@/src/data/especialidades";
import { logInfo } from "@/src/lib/logger";
import { toast } from "react-hot-toast";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Award,
  ChevronDown,
  ChevronRight,
  Database,
  FolderTree,
  Layers,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";

type Especialidad = {
  id?: string;
  area: string;
  categoria: string;
  especialidad: string;
  consejero?: string;
};

const AREA_STYLES: Record<string, { badge: string; border: string; icon: string }> = {
  Naturaleza: { badge: "bg-emerald-100 text-emerald-800", border: "border-emerald-200", icon: "🌿" },
  "Aire Libre": { badge: "bg-sky-100 text-sky-800", border: "border-sky-200", icon: "⛺" },
  Salud: { badge: "bg-rose-100 text-rose-800", border: "border-rose-200", icon: "❤️" },
  "Habilidades Domésticas": { badge: "bg-orange-100 text-orange-800", border: "border-orange-200", icon: "🏠" },
  Arte: { badge: "bg-violet-100 text-violet-800", border: "border-violet-200", icon: "🎨" },
  Recreación: { badge: "bg-blue-100 text-blue-800", border: "border-blue-200", icon: "⚽" },
  Agricultura: { badge: "bg-lime-100 text-lime-800", border: "border-lime-200", icon: "🌾" },
  Misionero: { badge: "bg-indigo-100 text-indigo-800", border: "border-indigo-200", icon: "✝️" },
  Espiritual: { badge: "bg-amber-100 text-amber-900", border: "border-amber-200", icon: "📖" },
};

function estiloArea(area: string) {
  return (
    AREA_STYLES[area] ?? {
      badge: "bg-slate-100 text-slate-800",
      border: "border-slate-200",
      icon: "📌",
    }
  );
}

export default function EspecialidadesPage() {
  const { clubId } = useClubActivo();
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoBase, setCargandoBase] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [area, setArea] = useState("");
  const [categoria, setCategoria] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [consejero, setConsejero] = useState("");

  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());
  const [openCategorias, setOpenCategorias] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (clubId) cargarEspecialidades();
  }, [clubId]);

  const cargarEspecialidades = async () => {
    setLoading(true);
    try {
      const q = queryColeccionClub("especialidades", clubId);
      if (!q) return;
      const querySnapshot = await getDocs(q);
      const datos: Especialidad[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          area: data.area ?? "",
          categoria: data.categoria ?? "",
          especialidad: data.especialidad ?? "",
          consejero: data.consejero ?? "",
        };
      });
      setEspecialidades(datos);
    } catch {
      toast.error("No se pudieron cargar las especialidades.");
    }
    setLoading(false);
  };

  const cargarEspecialidadesBase = async () => {
    if (!clubId) {
      toast.error("Sesión de club no válida.");
      return;
    }
    setCargandoBase(true);
    try {
      const q = queryColeccionClub("especialidades", clubId);
      if (!q) return;
      const querySnapshot = await getDocs(q);
      const existentes = querySnapshot.docs.map((docSnap) => docSnap.data());
      let agregados = 0;

      for (const esp of especialidadesBase) {
        const yaExiste = existentes.some(
          (e) =>
            e.area === esp.area &&
            e.categoria === esp.categoria &&
            e.especialidad === esp.especialidad
        );
        if (!yaExiste) {
          const docRef = await addDoc(collection(db, "especialidades"), datosConClub(esp, clubId));
          logInfo("Especialidad agregada: " + docRef.id);
          agregados++;
        }
      }

      toast.success(
        agregados > 0
          ? `Se agregaron ${agregados} especialidades base.`
          : "Todas las especialidades base ya estaban registradas."
      );
      await cargarEspecialidades();
    } catch {
      toast.error("Error al cargar especialidades base.");
    }
    setCargandoBase(false);
  };

  const filtradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return especialidades;
    return especialidades.filter(
      (e) =>
        e.area.toLowerCase().includes(term) ||
        e.categoria.toLowerCase().includes(term) ||
        e.especialidad.toLowerCase().includes(term) ||
        (e.consejero || "").toLowerCase().includes(term)
    );
  }, [especialidades, busqueda]);

  const agrupadas = useMemo(() => {
    return filtradas.reduce(
      (acc, esp) => {
        if (!acc[esp.area]) acc[esp.area] = {};
        if (!acc[esp.area][esp.categoria]) acc[esp.area][esp.categoria] = [];
        acc[esp.area][esp.categoria].push(esp);
        return acc;
      },
      {} as Record<string, Record<string, Especialidad[]>>
    );
  }, [filtradas]);

  const areas = useMemo(() => [...new Set(especialidades.map((e) => e.area))].sort(), [especialidades]);

  const categorias = useMemo(
    () =>
      [...new Set(especialidades.filter((e) => e.area === area).map((e) => e.categoria))].sort(),
    [especialidades, area]
  );

  const stats = useMemo(() => {
    const numAreas = new Set(especialidades.map((e) => e.area)).size;
    const numCategorias = new Set(
      especialidades.map((e) => `${e.area}::${e.categoria}`)
    ).size;
    return { total: especialidades.length, numAreas, numCategorias };
  }, [especialidades]);

  const toggleArea = (nombre: string) => {
    setOpenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  };

  const toggleCategoria = (key: string) => {
    setOpenCategorias((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandirTodo = () => {
    setOpenAreas(new Set(Object.keys(agrupadas)));
    const cats = new Set<string>();
    Object.entries(agrupadas).forEach(([a, catsMap]) => {
      Object.keys(catsMap).forEach((c) => cats.add(`${a}::${c}`));
    });
    setOpenCategorias(cats);
  };

  const colapsarTodo = () => {
    setOpenAreas(new Set());
    setOpenCategorias(new Set());
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area.trim() || !categoria.trim() || !especialidad.trim()) {
      toast.error("Completa área, categoría y especialidad.");
      return;
    }

    const duplicada = especialidades.some(
      (e) =>
        e.area === area.trim() &&
        e.categoria === categoria.trim() &&
        e.especialidad === especialidad.trim()
    );
    if (duplicada) {
      toast.error("Esa especialidad ya existe.");
      return;
    }

    if (!clubId) {
      toast.error("Sesión de club no válida.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "especialidades"), datosConClub({
        area: area.trim(),
        categoria: categoria.trim(),
        especialidad: especialidad.trim(),
        consejero: consejero.trim(),
      }, clubId));
      setEspecialidades([
        ...especialidades,
        {
          id: docRef.id,
          area: area.trim(),
          categoria: categoria.trim(),
          especialidad: especialidad.trim(),
          consejero: consejero.trim(),
        },
      ]);
      setEspecialidad("");
      setConsejero("");
      toast.success("Especialidad agregada.");
      setOpenAreas((prev) => new Set(prev).add(area.trim()));
      setOpenCategorias((prev) => new Set(prev).add(`${area.trim()}::${categoria.trim()}`));
    } catch {
      toast.error("Error al guardar.");
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await deleteDoc(doc(db, "especialidades", id));
      setEspecialidades(especialidades.filter((e) => e.id !== id));
      toast.success("Especialidad eliminada.");
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200";

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50/80 via-slate-50 to-slate-100 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin/registros"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-amber-800 shadow-sm border border-amber-200 hover:bg-amber-50 transition-colors"
          >
            <ArrowLeft size={18} />
            Retornar a Admin
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={cargarEspecialidadesBase}
            disabled={cargandoBase}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <Database size={18} />
            {cargandoBase ? "Cargando..." : "Cargar especialidades base"}
          </Button>
        </div>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
              <Award size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Especialidades
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Catálogo por área y categoría · Firebase
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Total", value: stats.total, icon: Layers, color: "amber" },
              { label: "Áreas", value: stats.numAreas, icon: FolderTree, color: "emerald" },
              { label: "Categorías", value: stats.numCategorias, icon: Award, color: "violet" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className={
                  color === "amber"
                    ? "rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
                    : color === "emerald"
                      ? "rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
                      : "rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="text-2xl font-black text-slate-800">{value}</p>
                  </div>
                  <div
                    className={
                      color === "amber"
                        ? "rounded-xl p-2.5 bg-amber-100 text-amber-700"
                        : color === "emerald"
                          ? "rounded-xl p-2.5 bg-emerald-100 text-emerald-700"
                          : "rounded-xl p-2.5 bg-violet-100 text-violet-700"
                    }
                  >
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 rounded-3xl border border-amber-100 bg-white p-6 shadow-md shadow-amber-100/50 h-fit">
            <h2 className="text-lg font-bold text-amber-900 mb-1 flex items-center gap-2">
              <Plus size={20} />
              Nueva especialidad
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Puedes elegir un área existente o escribir una nueva.
            </p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Área</label>
                <input
                  list="areas-list"
                  placeholder="Ej. Naturaleza"
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setCategoria("");
                  }}
                  className={inputClass}
                  required
                />
                <datalist id="areas-list">
                  {areas.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoría</label>
                <input
                  list="categorias-list"
                  placeholder="Ej. Animales"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className={inputClass}
                  required
                />
                <datalist id="categorias-list">
                  {categorias.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Especialidad
                </label>
                <input
                  placeholder="Nombre de la especialidad"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Consejero (opcional)
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    placeholder="Consejero asociado"
                    value={consejero}
                    onChange={(e) => setConsejero(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 rounded-xl"
              >
                <Plus size={18} />
                Agregar especialidad
              </Button>
            </form>
          </section>

          <section className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-slate-800">Catálogo registrado</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={expandirTodo}
                  className="text-xs font-semibold text-amber-700 hover:underline"
                >
                  Expandir todo
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={colapsarTodo}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Colapsar
                </button>
              </div>
            </div>

            <div className="relative mb-5">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar área, categoría o especialidad..."
                className={`${inputClass} pl-10`}
              />
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600 mb-3" />
                <p className="text-sm font-medium">Cargando especialidades...</p>
              </div>
            ) : Object.keys(agrupadas).length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <Award className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="font-semibold text-slate-600">Sin especialidades</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                  Usa &quot;Cargar especialidades base&quot; o agrega una manualmente.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
                {Object.keys(agrupadas)
                  .sort()
                  .map((areaNombre) => {
                    const estilo = estiloArea(areaNombre);
                    const abierta = openAreas.has(areaNombre);
                    const itemsEnArea = Object.values(agrupadas[areaNombre]).flat().length;

                    return (
                      <div
                        key={areaNombre}
                        className={`rounded-2xl border overflow-hidden ${estilo.border} bg-white`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleArea(areaNombre)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{estilo.icon}</span>
                            <div className="min-w-0">
                              <span
                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-0.5 ${estilo.badge}`}
                              >
                                Área
                              </span>
                              <p className="font-bold text-slate-800 truncate">{areaNombre}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                              {itemsEnArea}
                            </span>
                            {abierta ? (
                              <ChevronDown size={20} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={20} className="text-slate-400" />
                            )}
                          </div>
                        </button>

                        {abierta && (
                          <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-3 space-y-2">
                            {Object.keys(agrupadas[areaNombre])
                              .sort()
                              .map((catNombre) => {
                                const catKey = `${areaNombre}::${catNombre}`;
                                const catAbierta = openCategorias.has(catKey);
                                const lista = agrupadas[areaNombre][catNombre];

                                return (
                                  <div
                                    key={catKey}
                                    className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleCategoria(catKey)}
                                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-amber-50/50 text-left"
                                    >
                                      <span className="font-semibold text-sm text-slate-700">
                                        {catNombre}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                          {lista.length}
                                        </span>
                                        {catAbierta ? (
                                          <ChevronDown size={16} className="text-slate-400" />
                                        ) : (
                                          <ChevronRight size={16} className="text-slate-400" />
                                        )}
                                      </div>
                                    </button>

                                    {catAbierta && (
                                      <ul className="border-t border-slate-100 divide-y divide-slate-100">
                                        {lista.map((esp) => (
                                          <li
                                            key={esp.id}
                                            className="flex items-start justify-between gap-3 px-3 py-2.5 group"
                                          >
                                            <div className="min-w-0">
                                              <p className="font-medium text-sm text-slate-800">
                                                {esp.especialidad}
                                              </p>
                                              {esp.consejero && (
                                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                  <User size={12} />
                                                  {esp.consejero}
                                                </p>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDelete(esp.id!, esp.especialidad)
                                              }
                                              className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-70 group-hover:opacity-100 transition-all"
                                              title="Eliminar"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
