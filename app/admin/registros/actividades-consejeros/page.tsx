"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  CheckSquare,
  Save,
  Search,
  Square,
  Trash2,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  aplicarCalificacionCatalogo,
  esCatalogoAdminCalificaciones,
  expandirConsejerosYAsociados,
  type CatalogoCalificacion,
  type ConsejeroRegistro,
} from "@/src/lib/actividadesCalificacion";
import { indexarTotalesPorPin, toNumberPuntos } from "@/src/lib/categoriasPuntos";
import { consejeroAsesoraUnidad } from "@/src/lib/unidades";
import QuitarPuntosPanel from "@/src/components/calificaciones/QuitarPuntosPanel";

type Modo = "individual" | "grupo";

type PendienteItem = {
  id: string;
  pin: string;
  nombreConsejero: string;
  catalogo: CatalogoCalificacion;
};

function fechaHoyInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function fechaHoyDisplay(): string {
  return formatFechaDDMMYYYY(new Date());
}

function fechaInputADDisplay(iso: string): string {
  if (!iso) return fechaHoyDisplay();
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  return fechaHoyDisplay();
}

export default function RegistroActividadesConsejerosPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("individual");
  const [busqueda, setBusqueda] = useState("");
  const [consejeros, setConsejeros] = useState<ConsejeroRegistro[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoCalificacion[]>([]);
  const [pinSeleccionado, setPinSeleccionado] = useState("");
  const [unidadGrupo, setUnidadGrupo] = useState("");
  const [seleccionadosGrupo, setSeleccionadosGrupo] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(fechaHoyInput);
  const [catalogoGrupoId, setCatalogoGrupoId] = useState("");
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [totalesPin, setTotalesPin] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubConsejeros = onSnapshot(collection(db, "consejeros"), (snap) => {
      setConsejeros(expandirConsejerosYAsociados(snap.docs));
    });

    const unsubCatalogo = onSnapshot(collection(db, "calificaciones"), (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data() as { nombre?: string; puntos?: string | number; pin?: string };
          if (!esCatalogoAdminCalificaciones(data as Record<string, unknown>)) return null;
          const pts = toNumberPuntos(data.puntos);
          const nombre = (data.nombre || "").trim();
          if (!nombre || pts <= 0) return null;
          return { id: d.id, nombre, puntos: pts };
        })
        .filter((x): x is CatalogoCalificacion => x !== null);
      setCatalogo(items);
    });

    const unsubTotales = onSnapshot(collection(db, "calificacionesConquis"), (snap) => {
      setTotalesPin(
        indexarTotalesPorPin(
          snap.docs.map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          }))
        )
      );
    });

    return () => {
      unsubConsejeros();
      unsubCatalogo();
      unsubTotales();
    };
  }, []);

  useEffect(() => {
    if (consejeros.length > 0 && !pinSeleccionado) {
      setPinSeleccionado(consejeros[0].pin);
    }
  }, [consejeros, pinSeleccionado]);

  useEffect(() => {
    if (catalogo.length > 0 && !catalogoGrupoId) {
      setCatalogoGrupoId(catalogo[0].id);
    }
  }, [catalogo, catalogoGrupoId]);

  const consejerosFiltrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return consejeros;
    return consejeros.filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        c.pin.includes(t) ||
        c.unidades.some((u) => u.toLowerCase().includes(t)) ||
        (c.consejeroTitular || "").toLowerCase().includes(t) ||
        c.rol.includes(t)
    );
  }, [consejeros, busqueda]);

  const unidades = useMemo(() => {
    const set = new Set<string>();
    consejeros.forEach((c) => c.unidades.forEach((u) => set.add(u)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [consejeros]);

  const seleccionado = useMemo(
    () => consejeros.find((c) => c.pin === pinSeleccionado),
    [consejeros, pinSeleccionado]
  );

  const miembrosUnidad = useMemo(() => {
    if (!unidadGrupo) return [];
    return consejeros.filter((c) => consejeroAsesoraUnidad(c.unidades, unidadGrupo));
  }, [consejeros, unidadGrupo]);

  useEffect(() => {
    if (unidades.length > 0 && !unidadGrupo) {
      setUnidadGrupo(unidades[0]);
    }
  }, [unidades, unidadGrupo]);

  useEffect(() => {
    setPendientes([]);
  }, [modo]);

  const puntosPendientes = useMemo(
    () => pendientes.reduce((acc, p) => acc + p.catalogo.puntos, 0),
    [pendientes]
  );

  const agregarIndividual = (item: CatalogoCalificacion) => {
    if (!seleccionado) {
      toast.error("Selecciona un consejero o asociado.");
      return;
    }
    setPendientes((prev) => [
      ...prev,
      {
        id: `${seleccionado.pin}_${item.id}_${Date.now()}`,
        pin: seleccionado.pin,
        nombreConsejero: seleccionado.nombre,
        catalogo: item,
      },
    ]);
    toast.success(`Agregado: ${item.nombre} (+${item.puntos} pts)`);
  };

  const agregarGrupoPendiente = () => {
    const cat = catalogo.find((c) => c.id === catalogoGrupoId);
    if (!cat) {
      toast.error("Selecciona una calificacion del catalogo.");
      return;
    }
    const pins = Object.keys(seleccionadosGrupo).filter((p) => seleccionadosGrupo[p]);
    if (pins.length === 0) {
      toast.error("Marca al menos un consejero o asociado.");
      return;
    }
    const nuevos: PendienteItem[] = pins.map((pin) => {
      const m = consejeros.find((c) => c.pin === pin)!;
      return {
        id: `${pin}_${cat.id}_${Date.now()}_${Math.random()}`,
        pin: m.pin,
        nombreConsejero: m.nombre,
        catalogo: cat,
      };
    });
    setPendientes((prev) => [...prev, ...nuevos]);
    toast.success(`${nuevos.length} registro(s) en la lista. Pulsa Guardar para subir a Firebase.`);
  };

  const quitarPendiente = (id: string) => {
    setPendientes((prev) => prev.filter((p) => p.id !== id));
  };

  const limpiarPendientes = () => {
    if (pendientes.length === 0) return;
    setPendientes([]);
    toast("Lista limpiada. Nada se guardo en Firebase.", { icon: "🧹" });
  };

  const guardarPendientes = async () => {
    if (pendientes.length === 0) {
      toast.error("Agrega calificaciones a la lista antes de guardar.");
      return;
    }
    setGuardando(true);
    const fechaFmt = fechaInputADDisplay(fecha);
    let ok = 0;
    try {
      for (const p of pendientes) {
        const res = await aplicarCalificacionCatalogo({
          pin: p.pin,
          nombre: p.nombreConsejero,
          catalogo: p.catalogo,
          fecha: fechaFmt,
          origen:
            modo === "individual" ? "admin_consejero_individual" : "admin_consejero_grupo",
        });
        if (!res.ok) {
          toast.error(`${p.nombreConsejero}: ${res.mensaje}`);
          break;
        }
        ok++;
      }
      toast.success(
        `${ok} calificacion(es) guardadas. Ranking y dashboards se actualizan en tiempo real.`
      );
      setPendientes([]);
      if (modo === "grupo") setSeleccionadosGrupo({});
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar. Revisa la conexion e intenta de nuevo.");
    }
    setGuardando(false);
  };

  const toggleTodosGrupo = (marcar: boolean) => {
    const next: Record<string, boolean> = {};
    miembrosUnidad.forEach((m) => {
      next[m.pin] = marcar;
    });
    setSeleccionadosGrupo(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/registros")}
              className="mb-3 inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-300"
            >
              <ArrowLeft size={16} />
              Volver a Registros
            </button>
            <h1 className="text-2xl font-black text-emerald-800">
              Registro puntos consejeros y asociados
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consejeros de{" "}
              <button
                type="button"
                className="font-bold text-green-700 underline"
                onClick={() => router.push("/admin/consejero")}
              >
                Admin / Consejeros
              </button>
              . Catalogo en{" "}
              <button
                type="button"
                className="font-bold text-indigo-600 underline"
                onClick={() => router.push("/admin/calificaciones")}
              >
                Calificaciones
              </button>
              . Lista pendiente →{" "}
              <span className="font-bold text-emerald-700">Guardar en Firebase</span> actualiza{" "}
              <button
                type="button"
                className="font-bold text-indigo-600 underline"
                onClick={() => router.push("/admin/rankin")}
              >
                ranking
              </button>{" "}
              y el dashboard de cada consejero.
            </p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setModo("individual")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === "individual"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserRound size={18} />
              Por consejero
            </button>
            <button
              type="button"
              onClick={() => setModo("grupo")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === "grupo"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users size={18} />
              Por grupo (unidad)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h2 className="mb-3 font-bold text-slate-800">Consejeros y asociados</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Buscar nombre, PIN, unidad o asociado..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{consejeros.length} registrados</p>
            </div>
            <ul className="max-h-[28rem] overflow-y-auto p-2">
              {consejerosFiltrados.length === 0 ? (
                <li className="p-4 text-center text-sm text-slate-400">
                  No hay consejeros. Regístralos en Admin / Consejeros.
                </li>
              ) : (
                consejerosFiltrados.map((c) => {
                  const activo =
                    modo === "individual"
                      ? c.pin === pinSeleccionado
                      : Boolean(seleccionadosGrupo[c.pin]);
                  return (
                    <li key={c.listaId}>
                      <button
                        type="button"
                        onClick={() => {
                          if (modo === "individual") {
                            setPinSeleccionado(c.pin);
                          } else {
                            setSeleccionadosGrupo((prev) => ({
                              ...prev,
                              [c.pin]: !prev[c.pin],
                            }));
                          }
                        }}
                        className={`mb-1 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          activo
                            ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                            : "border-transparent hover:bg-slate-50"
                        }`}
                      >
                        {modo === "grupo" ? (
                          activo ? (
                            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                          )
                        ) : (
                          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-bold text-slate-800">{c.nombre}</p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                c.rol === "asociado"
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {c.rol === "asociado" ? "Asociado" : "Consejero"}
                            </span>
                          </div>
                          {c.rol === "asociado" && c.consejeroTitular && (
                            <p className="truncate text-xs text-emerald-700">
                              Titular: {c.consejeroTitular}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {c.unidades.length > 0 ? c.unidades.join(", ") : "Sin unidades"} · clave{" "}
                            {c.pin}
                          </p>
                          <p className="mt-1 text-xs font-bold text-indigo-600">
                            {totalesPin[c.pin] ?? 0} pts totales
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Fecha del registro
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="mt-1 block rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              {catalogo.length === 0 && (
                <p className="text-sm text-amber-700">
                  No hay items en el catalogo. Agrega en{" "}
                  <button
                    type="button"
                    className="font-bold underline"
                    onClick={() => router.push("/admin/calificaciones")}
                  >
                    Admin / Calificaciones
                  </button>
                  .
                </p>
              )}
            </div>

            {pendientes.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-amber-900">
                    Lista pendiente ({pendientes.length}) · {puntosPendientes} pts por guardar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={limpiarPendientes}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Limpiar
                    </button>
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={guardarPendientes}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {guardando ? "Guardando..." : "Guardar en Firebase"}
                    </button>
                  </div>
                </div>
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {pendientes.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-slate-800">
                        <span className="font-semibold">{p.nombreConsejero.split(" ")[0]}</span>
                        {" · "}
                        {p.catalogo.nombre}{" "}
                        <span className="font-bold text-indigo-600">+{p.catalogo.puntos} pts</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarPendiente(p.id)}
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Quitar de la lista"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-800">
                  Al guardar, los puntos aparecen en el ranking y en el dashboard del consejero.
                </p>
              </div>
            )}

            {modo === "individual" ? (
              <>
                {seleccionado ? (
                  <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Calificando a ({seleccionado.rol === "asociado" ? "asociado" : "consejero"})
                    </p>
                    <p className="text-lg font-black text-slate-800">{seleccionado.nombre}</p>
                    {seleccionado.rol === "asociado" && seleccionado.consejeroTitular && (
                      <p className="text-sm text-emerald-800">
                        Consejero titular: {seleccionado.consejeroTitular}
                      </p>
                    )}
                    <p className="text-sm text-slate-600">
                      {seleccionado.unidades.join(", ") || "Sin unidades"} · clave {seleccionado.pin}{" "}
                      ·{" "}
                      <span className="font-bold text-indigo-600">
                        {totalesPin[seleccionado.pin] ?? 0} pts
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mb-4 text-slate-500">
                    Selecciona un consejero o asociado a la izquierda.
                  </p>
                )}

                <h3 className="mb-3 font-bold text-slate-800">Calificaciones disponibles</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {catalogo.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{item.nombre}</p>
                        <p className="mt-1 flex items-center gap-1 text-sm font-black text-indigo-600">
                          <Trophy size={16} />
                          {item.puntos} puntos
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!seleccionado}
                        onClick={() => agregarIndividual(item)}
                        className="mt-4 w-full rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Agregar a la lista
                      </button>
                    </div>
                  ))}
                </div>

                {seleccionado && (
                  <QuitarPuntosPanel
                    className="mt-8"
                    pin={seleccionado.pin}
                    nombre={seleccionado.nombre}
                    origen="admin_resta_consejero"
                    aplicadoPor="admin"
                  />
                )}
              </>
            ) : (
              <>
                <h3 className="mb-3 font-bold text-slate-800">Calificar por unidad</h3>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Unidad
                    <select
                      value={unidadGrupo}
                      onChange={(e) => {
                        setUnidadGrupo(e.target.value);
                        setSeleccionadosGrupo({});
                      }}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
                    >
                      {unidades.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Calificacion (catalogo)
                    <select
                      value={catalogoGrupoId}
                      onChange={(e) => setCatalogoGrupoId(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
                    >
                      {catalogo.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.puntos} pts)
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTodosGrupo(true)}
                    className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                  >
                    Marcar todos ({miembrosUnidad.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTodosGrupo(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Desmarcar todos
                  </button>
                </div>

                <p className="mb-4 text-sm text-slate-600">
                  Marca consejeros que atienden esa unidad en la lista izquierda.
                </p>

                <button
                  type="button"
                  disabled={catalogo.length === 0}
                  onClick={agregarGrupoPendiente}
                  className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:px-8"
                >
                  Agregar grupo a la lista
                </button>
              </>
            )}

            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                disabled={pendientes.length === 0 || guardando}
                onClick={limpiarPendientes}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Trash2 size={18} />
                Limpiar lista
              </button>
              <button
                type="button"
                disabled={pendientes.length === 0 || guardando}
                onClick={guardarPendientes}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                <Save size={18} />
                {guardando ? "Guardando en Firebase..." : "Guardar en Firebase"}
              </button>
              {pendientes.length === 0 && (
                <span className="self-center text-xs text-slate-500">
                  Agrega calificaciones con los botones de arriba para habilitar guardar.
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
