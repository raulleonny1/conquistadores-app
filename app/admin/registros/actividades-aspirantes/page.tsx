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
import { nombreCompletoAspirante } from "@/src/constants/aspirante";
import {
  aplicarCalificacionCatalogo,
  esCatalogoAdminCalificaciones,
  type CatalogoCalificacion,
} from "@/src/lib/actividadesCalificacion";
import { indexarTotalesPorPin, toNumberPuntos } from "@/src/lib/categoriasPuntos";
import { nombreGrupoCoincide } from "@/src/lib/unidades";
import QuitarPuntosPanel from "@/src/components/calificaciones/QuitarPuntosPanel";

type Modo = "individual" | "grupo";

type AspiranteRegistro = {
  id: string;
  pin: string;
  nombre: string;
  asociacion: string;
};

type PendienteItem = {
  id: string;
  pin: string;
  nombreAspirante: string;
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

export default function RegistroActividadesAspirantesPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("individual");
  const [busqueda, setBusqueda] = useState("");
  const [aspirantes, setAspirantes] = useState<AspiranteRegistro[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoCalificacion[]>([]);
  const [pinSeleccionado, setPinSeleccionado] = useState("");
  const [asociacionGrupo, setAsociacionGrupo] = useState("");
  const [seleccionadosGrupo, setSeleccionadosGrupo] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(fechaHoyInput);
  const [catalogoGrupoId, setCatalogoGrupoId] = useState("");
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [totalesPin, setTotalesPin] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubAspirantes = onSnapshot(collection(db, "aspirantesGuiaMayor"), (snap) => {
      const lista: AspiranteRegistro[] = snap.docs
        .map((d) => {
          const data = d.data() as {
            nombre?: string;
            apellido?: string;
            pin?: string;
            asociacion?: string;
          };
          const pin = (data.pin || d.id).trim();
          const nombre = nombreCompletoAspirante(data) || "Sin nombre";
          return {
            id: d.id,
            pin,
            nombre,
            asociacion: (data.asociacion || "Sin asociación").trim(),
          };
        })
        .filter((a) => Boolean(a.pin))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      setAspirantes(lista);
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
      unsubAspirantes();
      unsubCatalogo();
      unsubTotales();
    };
  }, []);

  useEffect(() => {
    if (aspirantes.length > 0 && !pinSeleccionado) {
      setPinSeleccionado(aspirantes[0].pin);
    }
  }, [aspirantes, pinSeleccionado]);

  useEffect(() => {
    if (catalogo.length > 0 && !catalogoGrupoId) {
      setCatalogoGrupoId(catalogo[0].id);
    }
  }, [catalogo, catalogoGrupoId]);

  const aspirantesFiltrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return aspirantes;
    return aspirantes.filter(
      (a) =>
        a.nombre.toLowerCase().includes(t) ||
        a.pin.includes(t) ||
        a.asociacion.toLowerCase().includes(t)
    );
  }, [aspirantes, busqueda]);

  const asociaciones = useMemo(() => {
    const set = new Set(aspirantes.map((a) => a.asociacion).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [aspirantes]);

  const seleccionado = useMemo(
    () => aspirantes.find((a) => a.pin === pinSeleccionado),
    [aspirantes, pinSeleccionado]
  );

  const miembrosAsociacion = useMemo(() => {
    if (!asociacionGrupo) return [];
    return aspirantes.filter((a) => nombreGrupoCoincide(a.asociacion, asociacionGrupo));
  }, [aspirantes, asociacionGrupo]);

  const listaSidebar = useMemo(() => {
    if (modo === "grupo" && asociacionGrupo) {
      return aspirantesFiltrados.filter((a) =>
        nombreGrupoCoincide(a.asociacion, asociacionGrupo)
      );
    }
    return aspirantesFiltrados;
  }, [modo, asociacionGrupo, aspirantesFiltrados]);

  useEffect(() => {
    if (asociaciones.length > 0 && !asociacionGrupo) {
      setAsociacionGrupo(asociaciones[0]);
    }
  }, [asociaciones, asociacionGrupo]);

  useEffect(() => {
    if (modo !== "grupo" || !asociacionGrupo) return;
    const next: Record<string, boolean> = {};
    miembrosAsociacion.forEach((m) => {
      next[m.pin] = true;
    });
    setSeleccionadosGrupo(next);
  }, [modo, asociacionGrupo, miembrosAsociacion]);

  useEffect(() => {
    setPendientes([]);
  }, [modo]);

  const puntosPendientes = useMemo(
    () => pendientes.reduce((acc, p) => acc + p.catalogo.puntos, 0),
    [pendientes]
  );

  const agregarIndividual = (item: CatalogoCalificacion) => {
    if (!seleccionado) {
      toast.error("Selecciona un aspirante.");
      return;
    }
    setPendientes((prev) => [
      ...prev,
      {
        id: `${seleccionado.pin}_${item.id}_${Date.now()}`,
        pin: seleccionado.pin,
        nombreAspirante: seleccionado.nombre,
        catalogo: item,
      },
    ]);
    toast.success(`Agregado: ${item.nombre} (+${item.puntos} pts)`);
  };

  const agregarGrupoPendiente = (pinsForzados?: string[]) => {
    const cat = catalogo.find((c) => c.id === catalogoGrupoId);
    if (!cat) {
      toast.error("Selecciona una calificacion del catalogo.");
      return;
    }
    const pins =
      pinsForzados ??
      Object.keys(seleccionadosGrupo).filter((p) => seleccionadosGrupo[p]);
    if (pins.length === 0) {
      toast.error("Marca al menos un aspirante o usa «Todo el grupo».");
      return;
    }
    const nuevos: PendienteItem[] = pins.map((pin) => {
      const m = aspirantes.find((a) => a.pin === pin)!;
      return {
        id: `${pin}_${cat.id}_${Date.now()}_${Math.random()}`,
        pin: m.pin,
        nombreAspirante: m.nombre,
        catalogo: cat,
      };
    });
    setPendientes((prev) => [...prev, ...nuevos]);
    toast.success(`${nuevos.length} registro(s) en la lista. Pulsa Guardar para subir a Firebase.`);
  };

  const agregarTodoElGrupo = () => {
    if (miembrosAsociacion.length === 0) {
      toast.error("No hay aspirantes en esta asociación / misión.");
      return;
    }
    agregarGrupoPendiente(miembrosAsociacion.map((m) => m.pin));
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
          nombre: p.nombreAspirante,
          catalogo: p.catalogo,
          fecha: fechaFmt,
          origen:
            modo === "individual" ? "admin_aspirante_individual" : "admin_aspirante_grupo",
        });
        if (!res.ok) {
          toast.error(`${p.nombreAspirante}: ${res.mensaje}`);
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
    miembrosAsociacion.forEach((m) => {
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
            <h1 className="text-2xl font-black text-rose-800">Registro actividades aspirantes</h1>
            <p className="mt-1 text-sm text-slate-600">
              Aspirantes registrados en{" "}
              <button
                type="button"
                className="font-bold text-orange-600 underline"
                onClick={() => router.push("/admin/aspirante")}
              >
                Admin / Aspirante
              </button>
              . Catalogo desde{" "}
              <button
                type="button"
                className="font-bold text-indigo-600 underline"
                onClick={() => router.push("/admin/calificaciones")}
              >
                Calificaciones
              </button>
              . Agrega a la lista y pulsa{" "}
              <span className="font-bold text-emerald-700">Guardar en Firebase</span> para actualizar{" "}
              <button
                type="button"
                className="font-bold text-indigo-600 underline"
                onClick={() => router.push("/admin/rankin")}
              >
                ranking
              </button>{" "}
              y el dashboard de cada aspirante.
            </p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setModo("individual")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === "individual"
                  ? "bg-rose-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserRound size={18} />
              Por aspirante
            </button>
            <button
              type="button"
              onClick={() => setModo("grupo")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === "grupo"
                  ? "bg-rose-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users size={18} />
              Por grupo (asociación / misión)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border border-rose-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h2 className="mb-3 font-bold text-slate-800">Aspirantes a Guía Mayor</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Buscar nombre, PIN o asociación..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{aspirantes.length} registrados</p>
            </div>
            <ul className="max-h-[28rem] overflow-y-auto p-2">
              {modo === "grupo" && asociacionGrupo && (
                <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  Grupo: {asociacionGrupo} · {listaSidebar.length} aspirante(s)
                </p>
              )}
              {listaSidebar.length === 0 ? (
                <li className="p-4 text-center text-sm text-slate-400">
                  {modo === "grupo"
                    ? "No hay aspirantes en esta asociación / misión."
                    : "No hay aspirantes. Regístralos en Admin / Aspirante."}
                </li>
              ) : (
                listaSidebar.map((a) => {
                  const activo =
                    modo === "individual"
                      ? a.pin === pinSeleccionado
                      : Boolean(seleccionadosGrupo[a.pin]);
                  return (
                    <li key={a.pin}>
                      <button
                        type="button"
                        onClick={() => {
                          if (modo === "individual") {
                            setPinSeleccionado(a.pin);
                          } else {
                            setSeleccionadosGrupo((prev) => ({
                              ...prev,
                              [a.pin]: !prev[a.pin],
                            }));
                          }
                        }}
                        className={`mb-1 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          activo
                            ? "border-rose-400 bg-rose-50 ring-1 ring-rose-200"
                            : "border-transparent hover:bg-slate-50"
                        }`}
                      >
                        {modo === "grupo" ? (
                          activo ? (
                            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                          ) : (
                            <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                          )
                        ) : (
                          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800">{a.nombre}</p>
                          <p className="text-xs text-slate-500">
                            PIN {a.pin} · {a.asociacion}
                          </p>
                          <p className="mt-1 text-xs font-bold text-indigo-600">
                            {totalesPin[a.pin] ?? 0} pts totales
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
                        <span className="font-semibold">{p.nombreAspirante.split(" ")[0]}</span>
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
                  Al guardar, los puntos aparecen en el ranking y en el dashboard de cada aspirante.
                </p>
              </div>
            )}

            {modo === "individual" ? (
              <>
                {seleccionado ? (
                  <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                      Calificando a
                    </p>
                    <p className="text-lg font-black text-slate-800">{seleccionado.nombre}</p>
                    <p className="text-sm text-slate-600">
                      {seleccionado.asociacion} · PIN {seleccionado.pin} ·{" "}
                      <span className="font-bold text-indigo-600">
                        {totalesPin[seleccionado.pin] ?? 0} pts
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mb-4 text-slate-500">Selecciona un aspirante a la izquierda.</p>
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
                        className="mt-4 w-full rounded-xl bg-rose-600 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
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
                    origen="admin_resta_aspirante"
                    aplicadoPor="admin"
                  />
                )}
              </>
            ) : (
              <>
                <h3 className="mb-3 font-bold text-slate-800">Calificar por asociación</h3>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Asociación / misión
                    <select
                      value={asociacionGrupo}
                      onChange={(e) => {
                        setAsociacionGrupo(e.target.value);
                        setSeleccionadosGrupo({});
                      }}
                      className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2"
                    >
                      {asociaciones.map((u) => (
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
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Marcar todos ({miembrosAsociacion.length})
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
                  Los aspirantes de la asociación se marcan solos. En aspirantes el grupo es por
                  asociación / misión (no por unidad del club).
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={catalogo.length === 0 || miembrosAsociacion.length === 0}
                    onClick={agregarTodoElGrupo}
                    className="rounded-xl bg-rose-700 py-3 px-6 font-bold text-white hover:bg-rose-800 disabled:opacity-50"
                  >
                    Todo el grupo ({miembrosAsociacion.length}) → lista
                  </button>
                  <button
                    type="button"
                    disabled={catalogo.length === 0}
                    onClick={() => agregarGrupoPendiente()}
                    className="rounded-xl border-2 border-rose-600 py-3 px-6 font-bold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Solo marcados → lista
                  </button>
                </div>
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
