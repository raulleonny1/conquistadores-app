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
import BotonNotificarPadres from "@/src/components/padres/BotonNotificarPadres";
import CatalogoActividadesEditor from "@/src/components/admin/CatalogoActividadesEditor";
import QuitarPuntosPanel from "@/src/components/calificaciones/QuitarPuntosPanel";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import {
  mensajePadresNuevosPuntos,
  mensajePadresResumenAvance,
} from "@/src/utils/mensajesPadres";
import { queryColeccionClub } from "@/src/lib/clubScope";
import {
  COLECCION_POR_PROGRAMA,
  type ColeccionCalificacionesPrograma,
} from "@/src/constants/categoriasPrograma";
import {
  aplicarCalificacionCatalogoGrupoPrograma,
  aplicarCalificacionCatalogoPrograma,
  indexarTotalesPorGrupoPrograma,
} from "@/src/lib/calificacionesPrograma";
import {
  esCatalogoPrograma,
  type CatalogoCalificacion,
} from "@/src/lib/actividadesCalificacion";
import { indexarTotalesPorPin, toNumberPuntos } from "@/src/lib/categoriasPuntos";

type Modo = "individual" | "grupo";

type Miembro = {
  id: string;
  pin: string;
  nombre: string;
  whatsapp: string;
  clase: string;
  grupo: string;
};

type PendienteItem =
  | {
      tipo: "individual";
      id: string;
      pin: string;
      nombre: string;
      catalogo: CatalogoCalificacion;
    }
  | {
      tipo: "grupo";
      id: string;
      grupo: string;
      catalogo: CatalogoCalificacion;
      cantidadMiembros: number;
    };

type NotifReciente = {
  pin: string;
  nombre: string;
  whatsapp: string;
  puntosAgregados: number;
  totalPuntos: number;
  actividad: string;
  multiples: boolean;
};

type ActividadesProgramaAdminProps = {
  programa: "aventureros" | "ja";
  titulo: string;
  coleccionMiembros: "aventureros" | "jovenesJA";
  color: "amber" | "violet";
  /** Campo Firestore del miembro: club (Aventureros) o grupo (JA). */
  campoGrupo: "club" | "grupo";
  etiquetaGrupo: string;
};

function fechaHoyInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function miembroEnGrupo(m: Miembro, nombreGrupo: string): boolean {
  const g = m.grupo.trim();
  if (!g) return nombreGrupo === "Sin asignar";
  return g.toLowerCase() === nombreGrupo.trim().toLowerCase();
}

export default function ActividadesProgramaAdmin({
  programa,
  titulo,
  coleccionMiembros,
  color,
  campoGrupo,
  etiquetaGrupo,
}: ActividadesProgramaAdminProps) {
  const router = useRouter();
  const { clubId, clubSlug, clubNombre } = useClubActivo();
  const coleccionPts = COLECCION_POR_PROGRAMA[programa] as ColeccionCalificacionesPrograma;
  const origenResta = programa === "aventureros" ? "admin_resta_aventureros" : "admin_resta_ja";

  const [modo, setModo] = useState<Modo>("individual");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoCalificacion[]>([]);
  const [totalesPin, setTotalesPin] = useState<Record<string, number>>({});
  const [totalesGrupo, setTotalesGrupo] = useState<Record<string, number>>({});
  const [busqueda, setBusqueda] = useState("");
  const [pinSeleccionado, setPinSeleccionado] = useState("");
  const [grupoActivo, setGrupoActivo] = useState("");
  const [seleccionadosGrupo, setSeleccionadosGrupo] = useState<Record<string, boolean>>({});
  const [catalogoGrupoId, setCatalogoGrupoId] = useState("");
  const [fecha, setFecha] = useState(fechaHoyInput);
  const [pendientes, setPendientes] = useState<PendienteItem[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [notifReciente, setNotifReciente] = useState<NotifReciente | null>(null);

  const btnColor = color === "amber" ? "bg-amber-600 hover:bg-amber-700" : "bg-violet-600 hover:bg-violet-700";
  const accent = color === "amber" ? "text-amber-700" : "text-violet-700";
  const selBg = color === "amber" ? "border-amber-300 bg-amber-50" : "border-violet-300 bg-violet-50";
  const modoActive = color === "amber" ? "bg-amber-600 text-white shadow" : "bg-violet-600 text-white shadow";

  useEffect(() => {
    const qM = queryColeccionClub(coleccionMiembros, clubId);
    const qCat = queryColeccionClub("calificaciones", clubId);
    if (!qM || !qCat) return;

    const unsubM = onSnapshot(qM, (snap) => {
      const lista = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
          const pin = String(data.pin ?? d.id).trim();
          const rawGrupo = String(data[campoGrupo] ?? "").trim();
          return {
            id: d.id,
            pin,
            nombre: nombre || "Sin nombre",
            whatsapp: String(data.whatsapp ?? "").trim(),
            clase: String(data.clase ?? ""),
            grupo: rawGrupo || "Sin asignar",
          };
        })
        .filter((m) => Boolean(m.pin))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      setMiembros(lista);
    });

    const unsubCat = onSnapshot(qCat, (snap) => {
      const items = snap.docs
        .map((d) => {
          const data = d.data() as { nombre?: string; puntos?: string | number; pin?: string; programa?: string };
          if (!esCatalogoPrograma(data as Record<string, unknown>, programa)) return null;
          const pts = toNumberPuntos(data.puntos);
          const nombre = (data.nombre || "").trim();
          if (!nombre || pts <= 0) return null;
          return { id: d.id, nombre, puntos: pts };
        })
        .filter((x): x is CatalogoCalificacion => x !== null);
      setCatalogo(items);
    });

    let unsubPts = () => {};
    const unsubPins = onSnapshot(qM, (snapM) => {
      const pinsClub = new Set(
        snapM.docs.map((d) => String((d.data() as { pin?: string }).pin ?? d.id).trim())
      );
      unsubPts();
      unsubPts = onSnapshot(collection(db, coleccionPts), (snap) => {
        const docsClub = snap.docs
          .filter((d) => {
            const data = d.data() as { clubId?: string; pin?: string };
            if (data.clubId && clubId && data.clubId !== clubId) return false;
            return pinsClub.has(d.id) || pinsClub.has(String(data.pin ?? ""));
          })
          .map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          }));
        const docsGrupo = snap.docs
          .filter((d) => {
            const data = d.data() as { clubId?: string; tipo?: string; alcance?: string };
            if (data.clubId && clubId && data.clubId !== clubId) return false;
            return d.id.startsWith("grupo_") || data.tipo === "grupo" || data.alcance === "grupo";
          })
          .map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          }));
        setTotalesPin(indexarTotalesPorPin(docsClub));
        setTotalesGrupo(indexarTotalesPorGrupoPrograma(docsGrupo));
      });
    });

    return () => {
      unsubM();
      unsubCat();
      unsubPins();
      unsubPts();
    };
  }, [clubId, coleccionMiembros, coleccionPts, programa, campoGrupo]);

  const filtrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    let lista = miembros;
    if (t) {
      lista = lista.filter(
        (m) =>
          m.nombre.toLowerCase().includes(t) ||
          m.pin.includes(t) ||
          m.grupo.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [miembros, busqueda]);

  const grupos = useMemo(
    () => [...new Set(miembros.map((m) => m.grupo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
    [miembros]
  );

  const miembrosGrupo = useMemo(
    () => miembros.filter((m) => miembroEnGrupo(m, grupoActivo)),
    [miembros, grupoActivo]
  );

  const listaSidebar = useMemo(() => {
    if (modo === "grupo" && grupoActivo) {
      return filtrados.filter((m) => miembroEnGrupo(m, grupoActivo));
    }
    return filtrados;
  }, [modo, grupoActivo, filtrados]);

  const seleccionado = useMemo(
    () => miembros.find((m) => m.pin === pinSeleccionado || m.id === pinSeleccionado),
    [miembros, pinSeleccionado]
  );

  useEffect(() => {
    if (modo !== "individual" || miembros.length === 0) return;
    const listaVisible = busqueda.trim() ? filtrados : miembros;
    if (listaVisible.length === 0) return;
    const enLista = listaVisible.some((m) => m.pin === pinSeleccionado);
    if (!pinSeleccionado || !enLista) {
      setPinSeleccionado(listaVisible[0].pin);
    }
  }, [modo, miembros, pinSeleccionado, busqueda, filtrados]);

  useEffect(() => {
    if (grupos.length > 0 && !grupoActivo) {
      setGrupoActivo(grupos[0]);
    }
  }, [grupos, grupoActivo]);

  useEffect(() => {
    if (catalogo.length > 0 && !catalogoGrupoId) {
      setCatalogoGrupoId(catalogo[0].id);
    }
  }, [catalogo, catalogoGrupoId]);

  useEffect(() => {
    if (modo !== "grupo" || !grupoActivo) return;
    const next: Record<string, boolean> = {};
    miembrosGrupo.forEach((m) => {
      next[m.pin] = true;
    });
    setSeleccionadosGrupo(next);
  }, [modo, grupoActivo, miembrosGrupo]);

  useEffect(() => {
    setPendientes([]);
  }, [modo]);

  const puntosPendientes = useMemo(
    () => pendientes.reduce((acc, p) => acc + p.catalogo.puntos, 0),
    [pendientes]
  );

  const totalGrupoActivo = totalesGrupo[grupoActivo.trim().toLowerCase()] ?? 0;

  const agregarIndividual = (cat: CatalogoCalificacion) => {
    if (!seleccionado) {
      toast.error("Selecciona un miembro.");
      return;
    }
    setPendientes((prev) => [
      ...prev,
      {
        tipo: "individual",
        id: `${seleccionado.pin}_${cat.id}_${Date.now()}`,
        pin: seleccionado.pin,
        nombre: seleccionado.nombre,
        catalogo: cat,
      },
    ]);
    toast.success(`Agregado: ${cat.nombre} (+${cat.puntos} pts)`);
  };

  const agregarGrupoPendiente = (pinsForzados?: string[]) => {
    const cat = catalogo.find((c) => c.id === catalogoGrupoId);
    if (!cat) {
      toast.error("Selecciona una actividad del catálogo.");
      return;
    }
    const pins =
      pinsForzados ?? Object.keys(seleccionadosGrupo).filter((p) => seleccionadosGrupo[p]);
    if (pins.length === 0) {
      toast.error(`Marca al menos un miembro o usa «Todo el ${etiquetaGrupo.toLowerCase()}».`);
      return;
    }
    setPendientes((prev) => [
      ...prev,
      {
        tipo: "grupo",
        id: `grupo_${grupoActivo}_${cat.id}_${Date.now()}`,
        grupo: grupoActivo,
        catalogo: cat,
        cantidadMiembros: pins.length,
      },
    ]);
    toast.success(
      `${etiquetaGrupo} «${grupoActivo}»: +${cat.puntos} pts al total (${pins.length} miembros referidos). Pulsa Guardar.`
    );
  };

  const agregarTodoElGrupo = () => {
    if (miembrosGrupo.length === 0) {
      toast.error(`No hay miembros en este ${etiquetaGrupo.toLowerCase()}.`);
      return;
    }
    agregarGrupoPendiente(miembrosGrupo.map((m) => m.pin));
  };

  const quitarPendiente = (id: string) => {
    setPendientes((prev) => prev.filter((p) => p.id !== id));
  };

  const limpiarPendientes = () => {
    if (pendientes.length === 0) return;
    setPendientes([]);
    toast("Lista limpiada. Nada se guardó en Firebase.", { icon: "🧹" });
  };

  const toggleTodosGrupo = (marcar: boolean) => {
    const next: Record<string, boolean> = {};
    miembrosGrupo.forEach((m) => {
      next[m.pin] = marcar;
    });
    setSeleccionadosGrupo(next);
  };

  const guardar = async () => {
    if (pendientes.length === 0) {
      toast.error("Agrega actividades a la lista primero.");
      return;
    }
    if (!clubId) {
      toast.error("Sesión de club no válida.");
      return;
    }
    setGuardando(true);
    const fechaFmt = formatFechaDDMMYYYY(new Date(fecha + "T12:00:00"));
    let ok = 0;
    const individualesGuardados: PendienteItem[] = [];

    try {
      for (const p of pendientes) {
        if (p.tipo === "grupo") {
          const res = await aplicarCalificacionCatalogoGrupoPrograma({
            coleccion: coleccionPts,
            programa,
            clubId,
            grupo: p.grupo,
            catalogo: p.catalogo,
            fecha: fechaFmt,
            miembrosEnGrupo: p.cantidadMiembros,
          });
          if (!res.ok) {
            toast.error(`${p.grupo}: ${res.mensaje}`);
            break;
          }
        } else {
          const res = await aplicarCalificacionCatalogoPrograma({
            coleccion: coleccionPts,
            programa,
            pin: p.pin,
            nombre: p.nombre,
            catalogo: p.catalogo,
            fecha: fechaFmt,
          });
          if (!res.ok) {
            toast.error(`${p.nombre}: ${res.mensaje}`);
            break;
          }
          individualesGuardados.push(p);
        }
        ok++;
      }

      if (ok > 0) {
        toast.success(`${ok} calificación(es) guardadas.`);
        setPendientes([]);
        if (modo === "grupo") setSeleccionadosGrupo({});

        const soloInd = individualesGuardados.filter((x) => x.tipo === "individual");
        if (soloInd.length > 0) {
          const first = soloInd[0];
          if (first.tipo === "individual") {
            const miembro = miembros.find((m) => m.pin === first.pin);
            const puntosAgregados = soloInd.reduce((s, item) => {
              if (item.tipo === "individual") return s + item.catalogo.puntos;
              return s;
            }, 0);
            const totalPuntos = (totalesPin[first.pin] ?? 0) + puntosAgregados;
            if (miembro?.whatsapp) {
              setNotifReciente({
                pin: first.pin,
                nombre: first.nombre,
                whatsapp: miembro.whatsapp,
                puntosAgregados,
                totalPuntos,
                actividad: first.catalogo.nombre,
                multiples: soloInd.length > 1,
              });
            } else {
              setNotifReciente(null);
            }
          }
        } else {
          setNotifReciente(null);
        }
      }
    } catch {
      toast.error("Error al guardar. Revisa la conexión e intenta de nuevo.");
    }
    setGuardando(false);
  };

  const mensajeNotif =
    notifReciente && clubSlug
      ? notifReciente.multiples
        ? mensajePadresResumenAvance({
            nombreHijo: notifReciente.nombre,
            programa,
            clubNombre: clubNombre || clubSlug,
            clubSlug,
            pin: notifReciente.pin,
            totalPuntos: notifReciente.totalPuntos,
            clase: miembros.find((m) => m.pin === notifReciente.pin)?.clase ?? "",
          })
        : mensajePadresNuevosPuntos({
            nombreHijo: notifReciente.nombre,
            clubNombre: clubNombre || clubSlug,
            actividad: notifReciente.actividad,
            puntos: notifReciente.puntosAgregados,
            totalPuntos: notifReciente.totalPuntos,
            clubSlug,
            pin: notifReciente.pin,
          })
      : "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/registros")}
              className="mb-3 inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Registros
            </button>
            <h1 className={`text-2xl font-black ${accent}`}>{titulo}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Individual o por {etiquetaGrupo.toLowerCase()}. Crea actividades, asigna y quita puntos.
            </p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setModo("individual")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === "individual" ? modoActive : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserRound className="h-4 w-4" />
              Por miembro
            </button>
            <button
              type="button"
              onClick={() => setModo("grupo")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                modo === "grupo" ? modoActive : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4" />
              Por {etiquetaGrupo.toLowerCase()}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold">
                {modo === "grupo" ? `Miembros del ${etiquetaGrupo.toLowerCase()}` : "Buscar miembro"}
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={`Nombre, PIN o ${etiquetaGrupo.toLowerCase()}...`}
                  className="w-full rounded-xl border py-2 pl-9 pr-3 outline-none focus:border-slate-400"
                />
              </div>
              {modo === "grupo" && grupoActivo && (
                <p className={`mb-2 rounded-lg px-3 py-2 text-xs font-semibold ${selBg}`}>
                  {etiquetaGrupo}: {grupoActivo} · {listaSidebar.length} miembro(s) ·{" "}
                  {totalGrupoActivo} pts del {etiquetaGrupo.toLowerCase()}
                </p>
              )}
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {listaSidebar.length === 0 ? (
                  <li className="p-3 text-center text-sm text-slate-400">Sin miembros.</li>
                ) : (
                  listaSidebar.map((m) => (
                    <li key={m.id}>
                      {modo === "grupo" ? (
                        <label
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 ${
                            seleccionadosGrupo[m.pin] ? selBg : "border-transparent hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={seleccionadosGrupo[m.pin] === true}
                            onChange={(e) =>
                              setSeleccionadosGrupo((prev) => ({
                                ...prev,
                                [m.pin]: e.target.checked,
                              }))
                            }
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm">{m.nombre}</p>
                            <p className="text-xs text-slate-500">
                              PIN {m.pin} · {m.grupo}
                            </p>
                          </div>
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPinSeleccionado(m.pin)}
                          className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm ${
                            pinSeleccionado === m.pin ? selBg : "border-transparent hover:bg-slate-100"
                          }`}
                        >
                          <p className="font-semibold">{m.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {m.grupo} · PIN {m.pin} · {totalesPin[m.pin] ?? 0} pts
                          </p>
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {clubId && (
              <CatalogoActividadesEditor clubId={clubId} programa={programa} color={color} />
            )}
          </aside>

          <section className="lg:col-span-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Fecha del registro
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="mt-1 block rounded-lg border px-3 py-2"
                />
              </label>
              {catalogo.length === 0 && (
                <p className="text-sm text-amber-700">
                  Crea actividades en el panel izquierdo antes de asignar puntos.
                </p>
              )}
            </div>

            {pendientes.length > 0 && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-emerald-900">
                    Lista pendiente ({pendientes.length}) · {puntosPendientes} pts por guardar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={limpiarPendientes}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpiar
                    </button>
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={guardar}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {guardando ? "Guardando…" : "Guardar en Firebase"}
                    </button>
                  </div>
                </div>
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {pendientes.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-slate-800">
                        {p.tipo === "grupo" ? (
                          <>
                            <span className="font-semibold">
                              {etiquetaGrupo} {p.grupo}
                            </span>
                            {" · "}
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">{p.nombre.split(" ")[0]}</span>
                            {" · "}
                          </>
                        )}
                        {p.catalogo.nombre}{" "}
                        <span className={`font-bold ${accent}`}>+{p.catalogo.puntos} pts</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarPendiente(p.id)}
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Quitar de la lista"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-emerald-800">
                  Individual: suma al PIN del miembro. {etiquetaGrupo}: un solo total del{" "}
                  {etiquetaGrupo.toLowerCase()} (no se reparte entre miembros).
                </p>
              </div>
            )}

            {modo === "individual" ? (
              <>
                {seleccionado ? (
                  <div className={`mb-4 rounded-xl border px-4 py-3 ${selBg}`}>
                    <p className="text-xs font-bold uppercase tracking-wide opacity-70">Calificando a</p>
                    <p className="text-lg font-black text-slate-800">{seleccionado.nombre}</p>
                    <p className="text-sm text-slate-600">
                      {seleccionado.grupo} · {seleccionado.clase} · PIN {seleccionado.pin} ·{" "}
                      <span className={`font-bold ${accent}`}>
                        {totalesPin[seleccionado.pin] ?? 0} pts
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mb-4 text-slate-500">Selecciona un miembro a la izquierda.</p>
                )}

                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                  <Trophy className="h-5 w-5" />
                  Actividades disponibles
                </h3>
                {catalogo.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin actividades en el catálogo.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {catalogo.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{cat.nombre}</p>
                          <p className={`mt-1 text-sm font-black ${accent}`}>{cat.puntos} puntos</p>
                        </div>
                        <button
                          type="button"
                          disabled={!seleccionado}
                          onClick={() => agregarIndividual(cat)}
                          className={`mt-4 w-full rounded-xl py-2 text-sm font-bold text-white disabled:opacity-50 ${btnColor}`}
                        >
                          Agregar a la lista
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {seleccionado && (
                  <QuitarPuntosPanel
                    className="mt-8"
                    pin={seleccionado.pin}
                    nombre={seleccionado.nombre}
                    origen={origenResta}
                    coleccionPuntos={coleccionPts}
                    programa={programa}
                    aplicadoPor="admin"
                  />
                )}
              </>
            ) : (
              <>
                <h3 className="mb-3 font-bold text-slate-800">
                  Calificar por {etiquetaGrupo.toLowerCase()}
                </h3>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    {etiquetaGrupo}
                    <select
                      value={grupoActivo}
                      onChange={(e) => {
                        setGrupoActivo(e.target.value);
                        setSeleccionadosGrupo({});
                      }}
                      className="mt-1 block w-full rounded-lg border px-3 py-2"
                    >
                      {grupos.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Actividad (catálogo)
                    <select
                      value={catalogoGrupoId}
                      onChange={(e) => setCatalogoGrupoId(e.target.value)}
                      className="mt-1 block w-full rounded-lg border px-3 py-2"
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
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold hover:opacity-90 ${selBg}`}
                  >
                    <CheckSquare className="h-3 w-3" />
                    Marcar todos ({miembrosGrupo.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTodosGrupo(false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <Square className="h-3 w-3" />
                    Desmarcar todos
                  </button>
                </div>

                <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${selBg}`}>
                  Los puntos van al <strong>total del {etiquetaGrupo.toLowerCase()}</strong> (
                  {totalGrupoActivo} pts actuales), no a cada miembro marcado. Marca miembros solo
                  como referencia de quién participó.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={catalogo.length === 0 || miembrosGrupo.length === 0}
                    onClick={agregarTodoElGrupo}
                    className={`rounded-xl py-3 px-6 font-bold text-white disabled:opacity-50 ${btnColor}`}
                  >
                    Todo el {etiquetaGrupo.toLowerCase()} ({miembrosGrupo.length}) → lista
                  </button>
                  <button
                    type="button"
                    disabled={catalogo.length === 0}
                    onClick={() => agregarGrupoPendiente()}
                    className={`rounded-xl border-2 py-3 px-6 font-bold disabled:opacity-50 ${
                      color === "amber"
                        ? "border-amber-600 text-amber-800 hover:bg-amber-50"
                        : "border-violet-600 text-violet-800 hover:bg-violet-50"
                    }`}
                  >
                    Solo marcados → lista
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {notifReciente && mensajeNotif && (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <h3 className="font-bold text-sky-900">¿Notificar a los padres por WhatsApp?</h3>
            <p className="mt-1 text-sm text-sky-800">
              Se guardaron {notifReciente.puntosAgregados} pts para {notifReciente.nombre}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <BotonNotificarPadres
                whatsapp={notifReciente.whatsapp}
                mensaje={mensajeNotif}
                label="Enviar aviso por WhatsApp"
              />
              <button
                type="button"
                onClick={() => setNotifReciente(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Omitir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
