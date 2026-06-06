"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import { canonicalizarUnidad } from "@/src/lib/unidades";
import { queryColeccionClub } from "@/src/lib/clubScope";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";
import { recargarEspecialidadesClub } from "@/src/lib/sembrarEspecialidades";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Award,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  History,
  Layers,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import {
  type EspecialidadEnCurso,
  type EstadoEspecialidad,
  ESTADOS_ESPECIALIDAD,
  ESTADO_INICIAL_ESPECIALIDAD,
  claveEspecialidadEnCurso,
  etiquetaEstadoEspecialidad,
  estiloEstadoEspecialidad,
  parseEspecialidadesEnCurso,
} from "@/src/lib/especialidadEnCurso";
import {
  formatearFechaAvance,
  parseHistorialAvanceDoc,
  registrarAvanceEspecialidad,
  type EspecialidadAvanceHistorialEntry,
} from "@/src/lib/especialidadAvance";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { rutaConClub } from "@/src/lib/rutasClub";

type EspecialidadCatalogo = {
  area: string;
  categoria: string;
  especialidad: string;
};

type CatalogoEsp = EspecialidadCatalogo & { id: string };

type ConquisRow = {
  id: string;
  nombre: string;
  apellido: string;
  unidad: string;
  unidadCanon: string;
  clase: string;
  pin: string;
  especialidadesEnCurso: EspecialidadEnCurso[];
};

function nombreCompleto(c: Pick<ConquisRow, "nombre" | "apellido">): string {
  return [c.nombre, c.apellido].filter(Boolean).join(" ").trim();
}

async function registrarAvanceMiembro(
  miembro: ConquisRow,
  esp: EspecialidadEnCurso,
  estadoAnterior: EstadoEspecialidad | null,
  estadoNuevo: EstadoEspecialidad,
  tipo: "asignacion" | "cambio_estado",
  origen: "individual" | "unidad"
) {
  if (!miembro.pin.trim()) return;
  await registrarAvanceEspecialidad({
    conquisId: miembro.id,
    pin: miembro.pin,
    nombre: nombreCompleto(miembro),
    unidad: miembro.unidadCanon,
    esp,
    estadoAnterior,
    estadoNuevo,
    tipo,
    origen,
  });
}

function parseClaveEspecialidad(clave: string): EspecialidadEnCurso | null {
  if (!clave) return null;
  const [area, categoria, especialidad] = clave.split("|||");
  if (!especialidad?.trim()) return null;
  return {
    area: area?.trim() ?? "",
    categoria: categoria?.trim() ?? "",
    especialidad: especialidad.trim(),
    estado: ESTADO_INICIAL_ESPECIALIDAD,
  };
}

export function claveEspecialidad(e: EspecialidadCatalogo): string {
  return claveEspecialidadEnCurso(e);
}

function etiquetaEspecialidad(e: EspecialidadCatalogo): string {
  const partes = [e.area, e.categoria, e.especialidad].filter(Boolean);
  return partes.join(" · ");
}

function mergeEspecialidad(
  lista: EspecialidadEnCurso[],
  nueva: EspecialidadEnCurso
): EspecialidadEnCurso[] {
  const clave = claveEspecialidad(nueva);
  if (lista.some((e) => claveEspecialidad(e) === clave)) return lista;
  return [...lista, nueva];
}

function actualizarEstadoEnLista(
  lista: EspecialidadEnCurso[],
  clave: string,
  estado: EstadoEspecialidad
): EspecialidadEnCurso[] {
  return lista.map((e) =>
    claveEspecialidad(e) === clave ? { ...e, estado } : e
  );
}

function quitarDeLista(lista: EspecialidadEnCurso[], clave: string): EspecialidadEnCurso[] {
  return lista.filter((e) => claveEspecialidad(e) !== clave);
}

function especialidadesUnicasMiembros(miembros: ConquisRow[]): EspecialidadEnCurso[] {
  const map = new Map<string, EspecialidadEnCurso>();
  for (const m of miembros) {
    for (const e of m.especialidadesEnCurso) {
      map.set(claveEspecialidad(e), e);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.especialidad.localeCompare(b.especialidad, "es")
  );
}

function estadoComunUnidadEsp(
  miembros: ConquisRow[],
  claveEsp: string
): { estado: EstadoEspecialidad; mixta: boolean } {
  const estados = miembros
    .flatMap((m) =>
      m.especialidadesEnCurso
        .filter((e) => claveEspecialidad(e) === claveEsp)
        .map((e) => e.estado)
    );
  if (estados.length === 0) return { estado: ESTADO_INICIAL_ESPECIALIDAD, mixta: false };
  const primera = estados[0];
  return { estado: primera, mixta: !estados.every((e) => e === primera) };
}

function SelectEstado({
  value,
  onChange,
  disabled,
  className = "",
}: {
  value: EstadoEspecialidad;
  onChange: (estado: EstadoEspecialidad) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EstadoEspecialidad)}
      disabled={disabled}
      className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 ${className}`}
    >
      {ESTADOS_ESPECIALIDAD.map((e) => (
        <option key={e.id} value={e.id}>
          {e.label}
        </option>
      ))}
    </select>
  );
}

function BadgeEstado({ estado }: { estado: EstadoEspecialidad }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${estiloEstadoEspecialidad(estado)}`}
    >
      {etiquetaEstadoEspecialidad(estado)}
    </span>
  );
}

function agruparCatalogo(catalogo: CatalogoEsp[]) {
  const porArea = new Map<string, Map<string, CatalogoEsp[]>>();
  for (const item of catalogo) {
    const area = item.area || "Sin área";
    const categoria = item.categoria || "Sin categoría";
    if (!porArea.has(area)) porArea.set(area, new Map());
    const porCategoria = porArea.get(area)!;
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria)!.push(item);
  }

  return [...porArea.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([area, porCategoria]) => ({
      area,
      categorias: [...porCategoria.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "es"))
        .map(([categoria, items]) => ({
          categoria,
          items: items.sort((a, b) =>
            a.especialidad.localeCompare(b.especialidad, "es")
          ),
        })),
    }));
}

const AREA_STYLES: Record<string, { badge: string; border: string; icon: string }> = {
  ADRA: { badge: "bg-red-100 text-red-800", border: "border-red-200", icon: "🤝" },
  "Artes y habilidades manuales": { badge: "bg-violet-100 text-violet-800", border: "border-violet-200", icon: "🎨" },
  "Actividades agrícolas": { badge: "bg-lime-100 text-lime-800", border: "border-lime-200", icon: "🌾" },
  "Actividades misioneras y comunitarias": { badge: "bg-indigo-100 text-indigo-800", border: "border-indigo-200", icon: "✝️" },
  "Actividades profesionales": { badge: "bg-slate-100 text-slate-800", border: "border-slate-300", icon: "🔧" },
  "Actividades recreativas": { badge: "bg-sky-100 text-sky-800", border: "border-sky-200", icon: "⛺" },
  "Ciencia y salud": { badge: "bg-rose-100 text-rose-800", border: "border-rose-200", icon: "❤️" },
  "Estudio de la naturaleza": { badge: "bg-emerald-100 text-emerald-800", border: "border-emerald-200", icon: "🌿" },
  "Habilidades domésticas": { badge: "bg-orange-100 text-orange-800", border: "border-orange-200", icon: "🏠" },
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

function ResumenEspecialidad({ esp }: { esp: EspecialidadCatalogo | EspecialidadEnCurso | null }) {
  if (!esp) return null;
  const estilo = estiloArea(esp.area);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
      {esp.area ? (
        <span className={`rounded-full px-2 py-0.5 font-bold ${estilo.badge}`}>{esp.area}</span>
      ) : null}
      {esp.categoria ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
          {esp.categoria}
        </span>
      ) : null}
      {esp.especialidad ? (
        <span className="font-medium text-slate-600">{esp.especialidad}</span>
      ) : null}
    </div>
  );
}

function PanelCatalogoEspecialidades({
  catalogo,
  seleccionada,
  onSeleccionar,
  className = "",
}: {
  catalogo: CatalogoEsp[];
  seleccionada: string;
  onSeleccionar: (clave: string) => void;
  className?: string;
}) {
  const [busquedaCat, setBusquedaCat] = useState("");
  const [openAreas, setOpenAreas] = useState<Set<string>>(() => new Set());
  const [openCategorias, setOpenCategorias] = useState<Set<string>>(() => new Set());

  const catalogoFiltrado = useMemo(() => {
    const term = busquedaCat.trim().toLowerCase();
    if (!term) return catalogo;
    return catalogo.filter(
      (e) =>
        e.area.toLowerCase().includes(term) ||
        e.categoria.toLowerCase().includes(term) ||
        e.especialidad.toLowerCase().includes(term)
    );
  }, [catalogo, busquedaCat]);

  const agrupado = useMemo(() => agruparCatalogo(catalogoFiltrado), [catalogoFiltrado]);

  useEffect(() => {
    if (!busquedaCat.trim() || agrupado.length === 0) return;
    setOpenAreas(new Set(agrupado.map((a) => a.area)));
    setOpenCategorias(
      new Set(agrupado.flatMap((a) => a.categorias.map((c) => `${a.area}::${c.categoria}`)))
    );
  }, [busquedaCat, agrupado]);

  const seleccion = seleccionada ? parseClaveEspecialidad(seleccionada) : null;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 bg-indigo-600 px-3 py-2 text-white">
        <div>
          <p className="text-sm font-black">Catálogo IASD ({catalogo.length})</p>
          {seleccion ? (
            <p className="text-[11px] text-indigo-100">
              Seleccionada: <strong>{seleccion.especialidad}</strong>
              <button
                type="button"
                onClick={() => onSeleccionar("")}
                className="ml-2 underline hover:text-white"
              >
                quitar
              </button>
            </p>
          ) : (
            <p className="text-[11px] text-indigo-100">Clic para elegir y asignar</p>
          )}
        </div>
      </div>

      <div className="relative border-b border-slate-100 px-2 py-1.5">
        <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={busquedaCat}
          onChange={(e) => setBusquedaCat(e.target.value)}
          placeholder="Buscar…"
          className="w-full rounded-md border border-slate-200 py-1.5 pl-7 pr-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
      </div>

      <div className="max-h-56 space-y-1 overflow-y-auto p-1.5 sm:max-h-64">
        {agrupado.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Sin resultados</p>
        ) : (
          agrupado.map(({ area, categorias }) => {
            const estilo = estiloArea(area);
            const areaAbierta = openAreas.has(area);
            return (
              <div key={area} className={`overflow-hidden rounded-lg border ${estilo.border}`}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenAreas((prev) => {
                      const n = new Set(prev);
                      if (n.has(area)) n.delete(area);
                      else n.add(area);
                      return n;
                    })
                  }
                  className="flex w-full items-center justify-between gap-1 bg-white px-2 py-1 text-left hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="text-sm">{estilo.icon}</span>
                    <span className="truncate">{area}</span>
                  </span>
                  {areaAbierta ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  )}
                </button>
                {areaAbierta && (
                  <div className="space-y-0.5 border-t border-slate-100 bg-slate-50/80 p-1">
                    {categorias.map(({ categoria, items }) => {
                      const catKey = `${area}::${categoria}`;
                      const catAbierta = openCategorias.has(catKey);
                      return (
                        <div key={catKey} className="overflow-hidden rounded border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenCategorias((prev) => {
                                const n = new Set(prev);
                                if (n.has(catKey)) n.delete(catKey);
                                else n.add(catKey);
                                return n;
                              })
                            }
                            className="flex w-full items-center justify-between px-2 py-1 text-left text-[11px] font-semibold text-slate-600 hover:bg-indigo-50/50"
                          >
                            <span className="truncate">{categoria}</span>
                            <span className="ml-1 shrink-0 text-slate-400">{items.length}</span>
                          </button>
                          {catAbierta && (
                            <ul className="border-t border-slate-100">
                              {items.map((item) => {
                                const clave = claveEspecialidad(item);
                                const activa = seleccionada === clave;
                                return (
                                  <li key={item.id || clave}>
                                    <button
                                      type="button"
                                      onClick={() => onSeleccionar(clave)}
                                      className={`w-full px-2 py-1 text-left text-[11px] leading-tight transition ${
                                        activa
                                          ? "bg-indigo-600 font-bold text-white"
                                          : "text-slate-700 hover:bg-indigo-50"
                                      }`}
                                    >
                                      {item.especialidad}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function EspecialidadesEnCursoPage() {
  const { clubId, clubSlug, listo } = useClubActivo();
  const [catalogo, setCatalogo] = useState<CatalogoEsp[]>([]);
  const [catalogoUnidades, setCatalogoUnidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [vista, setVista] = useState<"unidad" | "individual">("unidad");
  const [menuSeccion, setMenuSeccion] = useState<"asignacion" | "seguimiento">("asignacion");
  const [guardando, setGuardando] = useState<Set<string>>(new Set());
  const [guardandoUnidad, setGuardandoUnidad] = useState<Set<string>>(new Set());
  const [unidadesAbiertas, setUnidadesAbiertas] = useState<Set<string>>(new Set());
  const [historialAvance, setHistorialAvance] = useState<EspecialidadAvanceHistorialEntry[]>([]);

  const manejarErrorSnapshot = useCallback((etiqueta: string) => (err: Error) => {
    console.error(`[especialidades-en-curso] ${etiqueta}`, err);
    setErrorCarga(mensajeErrorFirestore(err));
    setLoading(false);
  }, []);

  type ConquisFirestoreRow = {
    id: string;
    nombre: string;
    apellido: string;
    unidad: string;
    clase: string;
    pin: string;
    especialidadRaw: unknown;
  };

  const [conquisRaw, setConquisRaw] = useState<ConquisFirestoreRow[]>([]);

  const conquis = useMemo(() => {
    return conquisRaw
      .map((row) => {
        const unidadRaw = row.unidad;
        const unidadCanon = unidadRaw
          ? canonicalizarUnidad(unidadRaw, catalogoUnidades)
          : "Sin unidad";
        return {
          id: row.id,
          nombre: row.nombre,
          apellido: row.apellido,
          unidad: unidadRaw,
          unidadCanon,
          clase: row.clase,
          pin: row.pin,
          especialidadesEnCurso: parseEspecialidadesEnCurso(row.especialidadRaw),
        };
      })
      .sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, "es")
      );
  }, [conquisRaw, catalogoUnidades]);

  useEffect(() => {
    if (!listo) return;
    if (!clubId) {
      setLoading(false);
      setErrorCarga("Club no identificado. Abre esta página con ?club= en la URL.");
      return;
    }

    let cancelado = false;
    const unsubs: (() => void)[] = [];

    setLoading(true);
    setErrorCarga(null);
    setConquisRaw([]);
    setCatalogo([]);
    setCatalogoUnidades([]);

    void (async () => {
      try {
        await ensureFirebaseSession();
        if (cancelado) return;

        const qUnidades = queryColeccionClub("unidades", clubId);
        if (qUnidades) {
          unsubs.push(
            onSnapshot(
              qUnidades,
              (snap) => {
                setCatalogoUnidades(
                  snap.docs
                    .map((d) => String((d.data() as { nombre?: string }).nombre ?? "").trim())
                    .filter(Boolean)
                );
                setLoading(false);
              },
              manejarErrorSnapshot("unidades")
            )
          );
        }

        const qEsp = queryColeccionClub("especialidades", clubId);
        if (qEsp) {
          unsubs.push(
            onSnapshot(
              qEsp,
              (snap) => {
                const lista = snap.docs
                  .map((d) => {
                    const data = d.data();
                    return {
                      id: d.id,
                      area: String(data.area ?? "").trim(),
                      categoria: String(data.categoria ?? "").trim(),
                      especialidad: String(data.especialidad ?? "").trim(),
                    };
                  })
                  .filter((e) => e.especialidad)
                  .sort(
                    (a, b) =>
                      a.area.localeCompare(b.area, "es") ||
                      a.categoria.localeCompare(b.categoria, "es") ||
                      a.especialidad.localeCompare(b.especialidad, "es")
                  );
                setCatalogo(lista);
                setLoading(false);
              },
              manejarErrorSnapshot("especialidades")
            )
          );
        }

        const qConquis = queryColeccionClub("RegistroConquis", clubId);
        if (qConquis) {
          unsubs.push(
            onSnapshot(
              qConquis,
              (snap) => {
                setConquisRaw(
                  snap.docs.map((d) => {
                    const data = d.data();
                    return {
                      id: d.id,
                      nombre: String(data.nombre ?? ""),
                      apellido: String(data.apellido ?? ""),
                      unidad: String(data.unidad ?? "").trim(),
                      clase: String(data.clase ?? ""),
                      pin: String(data.pin ?? ""),
                      especialidadRaw: data.especialidades ?? data.especialidad,
                    };
                  })
                );
                setLoading(false);
              },
              manejarErrorSnapshot("RegistroConquis")
            )
          );
        }
      } catch (err) {
        if (!cancelado) {
          setErrorCarga(mensajeErrorFirestore(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelado = true;
      unsubs.forEach((u) => u());
    };
  }, [listo, clubId, manejarErrorSnapshot]);

  useEffect(() => {
    if (menuSeccion !== "seguimiento" || !listo) return;
    void ensureFirebaseSession();
    return onSnapshot(
      collection(db, "especialidadAvanceHistorial"),
      (snap) => {
        const items = snap.docs
          .map((d) => parseHistorialAvanceDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setHistorialAvance(items.slice(0, 80));
      },
      manejarErrorSnapshot("historial")
    );
  }, [menuSeccion, listo, clubId, manejarErrorSnapshot]);

  const agregarEspecialidadConquis = useCallback(
    async (conquisId: string, clave: string) => {
      const miembro = conquis.find((c) => c.id === conquisId);
      const parsed = parseClaveEspecialidad(clave);
      if (!parsed || !miembro) return;
      const esp = { ...parsed, estado: ESTADO_INICIAL_ESPECIALIDAD };
      const lista = mergeEspecialidad(miembro.especialidadesEnCurso, esp);
      if (lista.length === miembro.especialidadesEnCurso.length) {
        toast.error("Esa especialidad ya está asignada");
        return;
      }
      setGuardando((s) => new Set(s).add(conquisId));
      try {
        await updateDoc(doc(db, "RegistroConquis", conquisId), { especialidades: lista });
        await registrarAvanceMiembro(miembro, esp, null, esp.estado, "asignacion", "individual");
        setConquisRaw((prev) =>
          prev.map((c) => (c.id === conquisId ? { ...c, especialidadRaw: lista } : c))
        );
        toast.success("Especialidad agregada");
      } catch (err) {
        console.error(err);
        toast.error("No se pudo guardar en Firebase");
      } finally {
        setGuardando((s) => {
          const n = new Set(s);
          n.delete(conquisId);
          return n;
        });
      }
    },
    [conquis]
  );

  const quitarEspecialidadConquis = useCallback(
    async (conquisId: string, clave: string) => {
      const miembro = conquis.find((c) => c.id === conquisId);
      if (!miembro) return;
      const lista = quitarDeLista(miembro.especialidadesEnCurso, clave);
      setGuardando((s) => new Set(s).add(conquisId));
      try {
        await updateDoc(doc(db, "RegistroConquis", conquisId), { especialidades: lista });
        setConquisRaw((prev) =>
          prev.map((c) => (c.id === conquisId ? { ...c, especialidadRaw: lista } : c))
        );
        toast.success("Especialidad quitada");
      } catch (err) {
        console.error(err);
        toast.error("No se pudo quitar");
      } finally {
        setGuardando((s) => {
          const n = new Set(s);
          n.delete(conquisId);
          return n;
        });
      }
    },
    [conquis]
  );

  const guardarEstadoConquis = useCallback(
    async (conquisId: string, claveEsp: string, estado: EstadoEspecialidad) => {
      const miembro = conquis.find((c) => c.id === conquisId);
      if (!miembro) return;
      const actual = miembro.especialidadesEnCurso.find(
        (e) => claveEspecialidad(e) === claveEsp
      );
      if (!actual || actual.estado === estado) return;
      const estadoAnterior = actual.estado;
      const lista = actualizarEstadoEnLista(miembro.especialidadesEnCurso, claveEsp, estado);
      const payload = lista.find((e) => claveEspecialidad(e) === claveEsp)!;
      setGuardando((s) => new Set(s).add(`${conquisId}::${claveEsp}`));
      try {
        await updateDoc(doc(db, "RegistroConquis", conquisId), { especialidades: lista });
        await registrarAvanceMiembro(
          miembro,
          payload,
          estadoAnterior,
          estado,
          "cambio_estado",
          "individual"
        );
        setConquisRaw((prev) =>
          prev.map((c) => (c.id === conquisId ? { ...c, especialidadRaw: lista } : c))
        );
        toast.success("Estado actualizado");
      } catch (err) {
        console.error(err);
        toast.error("No se pudo guardar el estado");
      } finally {
        setGuardando((s) => {
          const n = new Set(s);
          n.delete(`${conquisId}::${claveEsp}`);
          return n;
        });
      }
    },
    [conquis]
  );

  const agregarATodaUnidad = async (unidad: string, clave: string) => {
    const miembros = conquis.filter((c) => c.unidadCanon === unidad);
    const parsed = parseClaveEspecialidad(clave);
    if (!parsed || miembros.length === 0) return;
    const esp = { ...parsed, estado: ESTADO_INICIAL_ESPECIALIDAD };
    setGuardandoUnidad((s) => new Set(s).add(`${unidad}::add`));
    try {
      await Promise.all(
        miembros.map(async (m) => {
          const lista = mergeEspecialidad(m.especialidadesEnCurso, esp);
          await updateDoc(doc(db, "RegistroConquis", m.id), { especialidades: lista });
          if (lista.length > m.especialidadesEnCurso.length) {
            await registrarAvanceMiembro(m, esp, null, esp.estado, "asignacion", "unidad");
          }
        })
      );
      const ids = new Set(miembros.map((m) => m.id));
      setConquisRaw((prev) =>
        prev.map((c) => {
          if (!ids.has(c.id)) return c;
          const actuales = parseEspecialidadesEnCurso(c.especialidadRaw);
          return { ...c, especialidadRaw: mergeEspecialidad(actuales, esp) };
        })
      );
      toast.success(`«${esp.especialidad}» agregada a «${unidad}»`);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la unidad");
    } finally {
      setGuardandoUnidad((s) => {
        const n = new Set(s);
        n.delete(`${unidad}::add`);
        return n;
      });
    }
  };

  const quitarDeUnidad = async (unidad: string, clave: string) => {
    const miembros = conquis.filter((c) => c.unidadCanon === unidad);
    if (miembros.length === 0) return;
    setGuardandoUnidad((s) => new Set(s).add(`${unidad}::${clave}`));
    try {
      await Promise.all(
        miembros.map(async (m) => {
          const lista = quitarDeLista(m.especialidadesEnCurso, clave);
          await updateDoc(doc(db, "RegistroConquis", m.id), { especialidades: lista });
        })
      );
      const ids = new Set(miembros.map((m) => m.id));
      setConquisRaw((prev) =>
        prev.map((c) =>
          ids.has(c.id)
            ? { ...c, especialidadRaw: quitarDeLista(parseEspecialidadesEnCurso(c.especialidadRaw), clave) }
            : c
        )
      );
      toast.success("Especialidad quitada de la unidad");
    } catch (err) {
      console.error(err);
      toast.error("Error al quitar de la unidad");
    } finally {
      setGuardandoUnidad((s) => {
        const n = new Set(s);
        n.delete(`${unidad}::${clave}`);
        return n;
      });
    }
  };

  const guardarEstadoUnidad = async (
    unidad: string,
    claveEsp: string,
    estado: EstadoEspecialidad
  ) => {
    const miembros = conquis.filter(
      (c) =>
        c.unidadCanon === unidad &&
        c.especialidadesEnCurso.some((e) => claveEspecialidad(e) === claveEsp)
    );
    if (miembros.length === 0) return;
    setGuardandoUnidad((s) => new Set(s).add(`${unidad}::${claveEsp}`));
    try {
      await Promise.all(
        miembros.map(async (m) => {
          const actual = m.especialidadesEnCurso.find(
            (e) => claveEspecialidad(e) === claveEsp
          );
          if (!actual || actual.estado === estado) return;
          const lista = actualizarEstadoEnLista(m.especialidadesEnCurso, claveEsp, estado);
          const payload = lista.find((e) => claveEspecialidad(e) === claveEsp)!;
          await updateDoc(doc(db, "RegistroConquis", m.id), { especialidades: lista });
          await registrarAvanceMiembro(
            m,
            payload,
            actual.estado,
            estado,
            "cambio_estado",
            "unidad"
          );
        })
      );
      const ids = new Set(miembros.map((m) => m.id));
      setConquisRaw((prev) =>
        prev.map((c) => {
          if (!ids.has(c.id)) return c;
          const actuales = parseEspecialidadesEnCurso(c.especialidadRaw);
          return { ...c, especialidadRaw: actualizarEstadoEnLista(actuales, claveEsp, estado) };
        })
      );
      toast.success(
        `«${etiquetaEstadoEspecialidad(estado)}» en «${unidad}»`
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el estado de la unidad");
    } finally {
      setGuardandoUnidad((s) => {
        const n = new Set(s);
        n.delete(`${unidad}::${claveEsp}`);
        return n;
      });
    }
  };

  const filtrada = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return conquis;
    return conquis.filter((c) => {
      const nombre = `${c.nombre} ${c.apellido}`.toLowerCase();
      const esp = c.especialidadesEnCurso
        .map((e) => etiquetaEspecialidad(e).toLowerCase())
        .join(" ");
      return (
        nombre.includes(term) ||
        c.unidadCanon.toLowerCase().includes(term) ||
        c.unidad.toLowerCase().includes(term) ||
        c.clase.toLowerCase().includes(term) ||
        esp.includes(term)
      );
    });
  }, [conquis, busqueda]);

  const porUnidad = useMemo(() => {
    const map = new Map<string, ConquisRow[]>();
    for (const c of filtrada) {
      const u = c.unidadCanon || "Sin unidad";
      if (!map.has(u)) map.set(u, []);
      map.get(u)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [filtrada]);

  const filtradaSeguimiento = useMemo(
    () => filtrada.filter((c) => c.especialidadesEnCurso.length > 0),
    [filtrada]
  );

  const porUnidadSeguimiento = useMemo(() => {
    const map = new Map<string, ConquisRow[]>();
    for (const c of filtradaSeguimiento) {
      const u = c.unidadCanon || "Sin unidad";
      if (!map.has(u)) map.set(u, []);
      map.get(u)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [filtradaSeguimiento]);

  const historialFiltrado = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return historialAvance;
    return historialAvance.filter(
      (h) =>
        h.nombre.toLowerCase().includes(term) ||
        h.unidad.toLowerCase().includes(term) ||
        h.especialidad.toLowerCase().includes(term) ||
        h.pin.includes(term)
    );
  }, [historialAvance, busqueda]);

  const stats = useMemo(() => {
    const conEsp = conquis.filter((c) => c.especialidadesEnCurso.length > 0).length;
    return { total: conquis.length, conEsp, sinEsp: conquis.length - conEsp };
  }, [conquis]);

  const statsSeguimiento = useMemo(() => {
    const todasEsp = conquis.flatMap((c) => c.especialidadesEnCurso);
    const porEstado = ESTADOS_ESPECIALIDAD.map((e) => ({
      ...e,
      count: todasEsp.filter((esp) => esp.estado === e.id).length,
    }));
    return { total: todasEsp.length, porEstado };
  }, [conquis]);

  const unidadesInicializadas = useRef(false);

  useEffect(() => {
    if (unidadesInicializadas.current || porUnidad.length === 0) return;
    unidadesInicializadas.current = true;
    setUnidadesAbiertas(new Set(porUnidad.map(([u]) => u)));
  }, [porUnidad]);

  const cargarCatalogoIasd = async () => {
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    setCargandoCatalogo(true);
    try {
      const { agregados } = await recargarEspecialidadesClub(clubId);
      toast.success(`Catálogo cargado: ${agregados} especialidades en Firebase.`);
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const espSeleccionada = especialidadSeleccionada
    ? parseClaveEspecialidad(especialidadSeleccionada)
    : null;

  const toggleUnidad = (nombre: string) => {
    setUnidadesAbiertas((prev) => {
      const n = new Set(prev);
      if (n.has(nombre)) n.delete(nombre);
      else n.add(nombre);
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl">
        <Link
          href={rutaConClub("/admin", clubSlug)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-800 shadow-sm hover:bg-indigo-50"
        >
          <ArrowLeft size={18} />
          Volver al panel admin
        </Link>

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Especialidades en curso</h1>
              <p className="text-sm text-slate-600">
                {menuSeccion === "asignacion"
                  ? "Elige una especialidad del catálogo y asígnala por unidad o a cada conquistador."
                  : "Actualiza el avance de cada especialidad asignada."}
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 xl:flex-row">
          <aside className="shrink-0 xl:w-52">
            <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setMenuSeccion("asignacion")}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                  menuSeccion === "asignacion"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Award size={18} />
                Asignar especialidades
              </button>
              <button
                type="button"
                onClick={() => setMenuSeccion("seguimiento")}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                  menuSeccion === "seguimiento"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ClipboardList size={18} />
                Seguimiento de avances
              </button>
            </nav>
          </aside>

          <main className="min-w-0 flex-1">
        {menuSeccion === "asignacion" ? (
          <>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-72 xl:max-w-xs">
        <section>
          {!listo || (loading && catalogo.length === 0) ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-slate-500 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando catálogo de especialidades…
            </div>
          ) : catalogo.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
              <p className="font-semibold text-amber-900">No hay especialidades cargadas</p>
              <p className="mt-1 text-sm text-amber-800">
                Carga el catálogo oficial IASD aquí mismo para poder elegir y asignar.
              </p>
              <button
                type="button"
                disabled={cargandoCatalogo}
                onClick={cargarCatalogoIasd}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {cargandoCatalogo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando…
                  </>
                ) : (
                  "Cargar catálogo IASD (178 especialidades)"
                )}
              </button>
            </div>
          ) : (
            <PanelCatalogoEspecialidades
              catalogo={catalogo}
              seleccionada={especialidadSeleccionada}
              onSeleccionar={setEspecialidadSeleccionada}
            />
          )}
        </section>
        </aside>

        {catalogo.length > 0 ? (
        <div className="min-w-0 flex-1">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Conquistadores", value: stats.total, icon: Users },
            { label: "Con especialidad", value: stats.conEsp, icon: Award },
            { label: "Sin asignar", value: stats.sinEsp, icon: Layers },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-2xl font-black text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setVista("unidad")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                vista === "unidad"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Por unidad
            </button>
            <button
              type="button"
              onClick={() => setVista("individual")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                vista === "individual"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Individual
            </button>
          </div>
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar nombre, unidad o especialidad…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        {errorCarga ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-800">No se pudo cargar los datos</p>
            <p className="mt-2 text-sm text-red-700">{errorCarga}</p>
          </div>
        ) : !listo || loading ? (
          <p className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando conquistadores…
          </p>
        ) : conquis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">No hay conquistadores registrados</p>
          </div>
        ) : vista === "individual" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-indigo-50 text-left text-xs font-bold uppercase tracking-wide text-indigo-900">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Clase</th>
                    <th className="px-4 py-3">Especialidad en curso</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrada.map((c) => {
                    const busy = guardando.has(c.id);
                    return (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                          {c.pin ? (
                            <span className="mt-0.5 block text-xs font-normal text-slate-400">
                              PIN {c.pin}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.unidadCanon}</td>
                        <td className="px-4 py-3 text-slate-600">{c.clase || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            {c.especialidadesEnCurso.length > 0 ? (
                              <ul className="space-y-1.5">
                                {c.especialidadesEnCurso.map((esp) => {
                                  const clave = claveEspecialidad(esp);
                                  return (
                                    <li
                                      key={clave}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">
                                          {esp.especialidad}
                                        </p>
                                        <BadgeEstado estado={esp.estado} />
                                      </div>
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => quitarEspecialidadConquis(c.id, clave)}
                                        className="text-[10px] font-semibold text-red-600 hover:underline disabled:opacity-60"
                                      >
                                        Quitar
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-400">Sin asignar</p>
                            )}
                            {especialidadSeleccionada ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  agregarEspecialidadConquis(c.id, especialidadSeleccionada)
                                }
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                              >
                                + Agregar seleccionada
                              </button>
                            ) : null}
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {porUnidad.map(([unidad, miembrosVisibles]) => {
              const abierta = unidadesAbiertas.has(unidad);
              const miembrosUnidad = conquis.filter((c) => c.unidadCanon === unidad);
              const espsUnidad = especialidadesUnicasMiembros(miembrosUnidad);
              const busyAdd = guardandoUnidad.has(`${unidad}::add`);
              return (
                <section
                  key={unidad}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleUnidad(unidad)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      {abierta ? (
                        <ChevronDown className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-indigo-600" />
                      )}
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{unidad}</h2>
                        <p className="text-xs text-slate-500">
                          {miembrosUnidad.length} conquistador
                          {miembrosUnidad.length === 1 ? "" : "es"}
                          {espsUnidad.length > 0
                            ? ` · ${espsUnidad.length} especialidad${espsUnidad.length === 1 ? "" : "es"}`
                            : " · sin especialidades"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                      {espsUnidad.length}
                    </span>
                  </button>

                  {abierta && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                        <p className="mb-2 text-sm font-semibold text-indigo-900">
                          Especialidades de «{unidad}» (pueden ser varias)
                        </p>
                        {espsUnidad.length > 0 ? (
                          <ul className="mb-3 space-y-2">
                            {espsUnidad.map((esp) => {
                              const clave = claveEspecialidad(esp);
                              const busyQuitar = guardandoUnidad.has(`${unidad}::${clave}`);
                              return (
                                <li
                                  key={clave}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-indigo-900">
                                      {esp.especialidad}
                                    </p>
                                    <ResumenEspecialidad esp={esp} />
                                  </div>
                                  <button
                                    type="button"
                                    disabled={busyQuitar}
                                    onClick={() => quitarDeUnidad(unidad, clave)}
                                    className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                                  >
                                    Quitar
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mb-3 text-sm text-slate-500">Sin especialidades asignadas</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {especialidadSeleccionada ? (
                            <button
                              type="button"
                              disabled={busyAdd}
                              onClick={() => agregarATodaUnidad(unidad, especialidadSeleccionada)}
                              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                              + Agregar «{espSeleccionada?.especialidad}» a la unidad
                            </button>
                          ) : (
                            <p className="text-xs font-medium text-amber-800">
                              ↑ Elige una especialidad en el catálogo de arriba
                            </p>
                          )}
                          {busyAdd ? (
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                          ) : null}
                        </div>
                      </div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Miembros de {unidad}
                      </p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {miembrosVisibles.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <p className="font-bold text-slate-800">
                              {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                            </p>
                            <p className="text-xs text-slate-500">
                              {c.clase || "Sin clase"}
                              {c.pin ? ` · PIN ${c.pin}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
        </div>
        ) : null}
        </div>
          </>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-1">
                <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Con especialidad</p>
                  <p className="text-2xl font-black text-slate-800">{statsSeguimiento.total}</p>
                </div>
              </div>
              {statsSeguimiento.porEstado.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <BadgeEstado estado={e.id} />
                  <p className="mt-1 text-xl font-black text-slate-800">{e.count}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setVista("unidad")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    vista === "unidad"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Por unidad
                </button>
                <button
                  type="button"
                  onClick={() => setVista("individual")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    vista === "individual"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Individual
                </button>
              </div>
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar unidad, nombre o especialidad…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {loading ? (
              <p className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando seguimiento…
              </p>
            ) : statsSeguimiento.total === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="font-semibold text-slate-700">No hay especialidades asignadas aún</p>
                <p className="mt-1 text-sm text-slate-500">
                  Primero asigna especialidades en «Asignar especialidades».
                </p>
              </div>
            ) : vista === "individual" ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-indigo-50 text-left text-xs font-bold uppercase tracking-wide text-indigo-900">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Unidad</th>
                        <th className="px-4 py-3">Especialidad</th>
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradaSeguimiento.flatMap((c) =>
                        c.especialidadesEnCurso.map((esp) => {
                          const clave = claveEspecialidad(esp);
                          const busy = guardando.has(`${c.id}::${clave}`);
                          return (
                            <tr key={`${c.id}::${clave}`} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{c.unidadCanon}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-800">{esp.especialidad}</p>
                                <ResumenEspecialidad esp={esp} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <SelectEstado
                                    value={esp.estado}
                                    disabled={busy}
                                    onChange={(estado) =>
                                      guardarEstadoConquis(c.id, clave, estado)
                                    }
                                  />
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {porUnidadSeguimiento.map(([unidad, miembrosVisibles]) => {
                  const abierta = unidadesAbiertas.has(unidad);
                  const miembrosUnidad = conquis.filter(
                    (c) => c.unidadCanon === unidad && c.especialidadesEnCurso.length > 0
                  );
                  const espsUnidad = especialidadesUnicasMiembros(miembrosUnidad);
                  return (
                    <section
                      key={unidad}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleUnidad(unidad)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          {abierta ? (
                            <ChevronDown className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-indigo-600" />
                          )}
                          <div>
                            <h2 className="text-lg font-black text-slate-900">{unidad}</h2>
                            <p className="text-xs text-slate-500">
                              {espsUnidad.length} especialidad
                              {espsUnidad.length === 1 ? "" : "es"} en curso
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                          {espsUnidad.length}
                        </span>
                      </button>

                      {abierta && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                          <div className="space-y-3">
                            {espsUnidad.map((esp) => {
                              const clave = claveEspecialidad(esp);
                              const { estado: estadoUnidad, mixta: estadoMixto } =
                                estadoComunUnidadEsp(miembrosUnidad, clave);
                              const busyUnidad = guardandoUnidad.has(`${unidad}::${clave}`);
                              return (
                                <div
                                  key={clave}
                                  className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3"
                                >
                                  <p className="mb-1 text-sm font-bold text-indigo-900">
                                    {esp.especialidad}
                                  </p>
                                  <ResumenEspecialidad esp={esp} />
                                  <p className="mb-2 mt-2 text-xs font-semibold text-indigo-800">
                                    Estado de avance
                                  </p>
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <SelectEstado
                                      value={estadoUnidad}
                                      disabled={busyUnidad}
                                      className="sm:min-w-[220px]"
                                      onChange={(estado) =>
                                        guardarEstadoUnidad(unidad, clave, estado)
                                      }
                                    />
                                    {busyUnidad ? (
                                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-500" />
                                    ) : null}
                                  </div>
                                  {estadoMixto ? (
                                    <p className="mt-2 text-xs text-amber-700">
                                      Hay estados distintos entre miembros. Elige uno para unificar.
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Miembros
                          </p>
                          <ul className="grid gap-2 sm:grid-cols-2">
                            {miembrosVisibles.map((c) => (
                              <li
                                key={c.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                              >
                                <p className="font-bold text-slate-800">
                                  {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                                </p>
                                <p className="text-xs text-slate-500">{c.clase || "Sin clase"}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {c.especialidadesEnCurso.map((e) => (
                                    <BadgeEstado key={claveEspecialidad(e)} estado={e.estado} />
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <History className="h-5 w-5 text-indigo-600" />
                <div>
                  <h2 className="font-bold text-slate-900">Historial de avances</h2>
                  <p className="text-xs text-slate-500">
                    Cambios y asignaciones en tiempo real — también visibles para cada conquistador
                  </p>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {historialFiltrado.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-500">
                    Aún no hay movimientos registrados.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {historialFiltrado.map((h) => (
                      <li key={h.id} className="px-5 py-3.5 hover:bg-slate-50">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {h.nombre || "Conquistador"}{" "}
                              <span className="font-normal text-slate-500">· {h.unidad}</span>
                            </p>
                            <p className="text-xs text-slate-600">{h.especialidad}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {h.tipo === "asignacion" ? "Asignación" : "Cambio de estado"} ·{" "}
                              {h.origen === "unidad" ? "Por unidad" : "Individual"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {h.estadoAnterior ? (
                                <BadgeEstado estado={h.estadoAnterior} />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">Nuevo</span>
                              )}
                              <span className="text-slate-300">→</span>
                              <BadgeEstado estado={h.estadoNuevo} />
                            </div>
                            <p className="mt-1 text-[10px] font-medium text-slate-400">
                              {formatearFechaAvance(h.createdAt)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}
