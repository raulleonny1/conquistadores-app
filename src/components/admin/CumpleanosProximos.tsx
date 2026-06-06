"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { queryColeccionClub } from "@/src/lib/clubScope";
import { nombreCompletoAspirante } from "@/src/constants/aspirante";
import {
  etiquetaDiasCumpleanos,
  extraerFechaNacimiento,
  extraerFechaNacimientoTitular,
  extraerFechaNacimientoAsociado,
  filtrarCumpleanosProximos,
  deduplicarRegistrosSinFecha,
  quitarSinFechaSiYaTieneFecha,
  contarPersonasUnicas,
  IndiceFechasNacimiento,
  type CumpleanosPersona,
  type RegistradoSinFecha,
  type TipoPersonaClub,
} from "@/src/lib/cumpleanos";
import { sincronizarFechasNacimientoClub } from "@/src/lib/sincronizarFechasNacimiento";
import Link from "next/link";
import { Cake, Loader2, Pencil } from "lucide-react";
import { urlEditarPersona } from "@/src/lib/cumpleanos";
import { rutaConClub } from "@/src/lib/rutasClub";

const VENTANA_DIAS = 14;

type FilaCumple = Omit<CumpleanosPersona, "diasHasta">;
type BloqueDatos = { conFecha: FilaCumple[]; sinFecha: RegistradoSinFecha[] };

const bloqueVacio = (): BloqueDatos => ({ conFecha: [], sinFecha: [] });

function registrarPersona(
  conFecha: FilaCumple[],
  sinFecha: RegistradoSinFecha[],
  id: string,
  nombre: string,
  tipo: TipoPersonaClub,
  detalle: string,
  data: Record<string, unknown>,
  fechaExplicita?: string,
  indice?: IndiceFechasNacimiento,
  pin?: string
) {
  if (!nombre.trim()) return;
  let fecha =
    fechaExplicita !== undefined
      ? fechaExplicita.trim()
      : extraerFechaNacimiento(data);
  if (!fecha && indice) {
    fecha = indice.buscar(nombre, pin) ?? "";
  }
  if (fecha) {
    conFecha.push({ id, nombre: nombre.trim(), tipo, detalle, fechaTexto: fecha });
  } else {
    sinFecha.push({ id, nombre: nombre.trim(), tipo, tipos: [tipo], detalle });
  }
}

function construirIndiceDesdeDatos(
  conquisDocs: { id: string; data: Record<string, unknown> }[],
  aspirantesDocs: { id: string; data: Record<string, unknown> }[],
  consejerosDocs: { id: string; data: Record<string, unknown> }[],
  directivaDocs: { id: string; data: Record<string, unknown> }[],
  fichasDocs: { id: string; data: Record<string, unknown> }[]
): IndiceFechasNacimiento {
  const indice = new IndiceFechasNacimiento();

  for (const { id, data } of conquisDocs) {
    const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "RegistroConquis", id);
  }

  for (const { id, data } of aspirantesDocs) {
    const nombre = nombreCompletoAspirante(data);
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "aspirantesGuiaMayor", id);
  }

  for (const { id, data } of consejerosDocs) {
    const titular = String(data.nombre ?? "").trim();
    const asoc = String(data.consejeroAsociado ?? "").trim();
    const fTit = extraerFechaNacimientoTitular(data);
    const fAsoc = extraerFechaNacimientoAsociado(data);
    if (titular && fTit) indice.agregar(titular, fTit, "consejeros", id);
    if (asoc && fAsoc) indice.agregar(asoc, fAsoc, "consejeros", id);
  }

  for (const { id, data } of directivaDocs) {
    const nombre = String(data.nombre ?? "").trim();
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "directivaClub", id);
  }

  for (const { id, data } of fichasDocs) {
    const nombre = String(data.nombre ?? "").trim();
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "fichasMedicas", id);
    if (fecha) indice.agregarPorPin(id, fecha);
  }

  return indice;
}

function PersonaCard({
  p,
  fechaDisplay,
}: {
  p: CumpleanosPersona;
  fechaDisplay: (raw: string) => string;
}) {
  return (
    <>
      <p className="font-bold text-white">{p.nombre}</p>
      <p className="text-xs text-white/50">{p.detalle}</p>
      <p className="mt-1 text-xs font-semibold text-pink-300">
        {fechaDisplay(p.fechaTexto)} · {etiquetaDiasCumpleanos(p.diasHasta)}
      </p>
    </>
  );
}

export default function CumpleanosProximos() {
  type DocRow = { id: string; data: Record<string, unknown> };

  const [rawConquis, setRawConquis] = useState<DocRow[] | null>(null);
  const [rawAspirantes, setRawAspirantes] = useState<DocRow[] | null>(null);
  const [rawConsejeros, setRawConsejeros] = useState<DocRow[] | null>(null);
  const [rawDirectiva, setRawDirectiva] = useState<DocRow[] | null>(null);
  const [rawFichas, setRawFichas] = useState<DocRow[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const syncHecho = useRef(false);
  const { clubId, clubSlug } = useClubActivo();

  const manejarErrorSnapshot = (etiqueta: string) => (err: Error) => {
    console.error(`Cumpleaños — error leyendo ${etiqueta}:`, err);
    setErrorCarga(
      (prev) =>
        prev ??
        `No se pudieron cargar todos los registros (${etiqueta}). Si acabas de actualizar firestore.rules, despliégalas en Firebase.`
    );
  };

  useEffect(() => {
    if (syncHecho.current) return;
    syncHecho.current = true;
    sincronizarFechasNacimientoClub().catch((err) => {
      console.warn("Cumpleaños — sincronización de fechas:", err);
    });
  }, []);

  useEffect(() => {
    if (!clubId) {
      setRawConquis([]);
      return;
    }
    const q = queryColeccionClub("RegistroConquis", clubId);
    if (!q) return;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawConquis(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("conquistadores")
    );
    return () => unsub();
  }, [clubId]);

  useEffect(() => {
    if (!clubId) {
      setRawAspirantes([]);
      return;
    }
    const q = queryColeccionClub("aspirantesGuiaMayor", clubId);
    if (!q) return;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawAspirantes(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("aspirantes")
    );
    return () => unsub();
  }, [clubId]);

  useEffect(() => {
    if (!clubId) {
      setRawConsejeros([]);
      return;
    }
    const q = queryColeccionClub("consejeros", clubId);
    if (!q) return;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawConsejeros(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("consejeros")
    );
    return () => unsub();
  }, [clubId]);

  useEffect(() => {
    if (!clubId) {
      setRawDirectiva([]);
      return;
    }
    const q = queryColeccionClub("directivaClub", clubId);
    if (!q) return;
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawDirectiva(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("directiva")
    );
    return () => unsub();
  }, [clubId]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "fichasMedicas"),
      (snap) => {
        setRawFichas(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      (err) => {
        console.warn("Cumpleaños — fichasMedicas no disponibles:", err);
        setRawFichas([]);
      }
    );
    return () => unsub();
  }, []);

  const bloques = useMemo(() => {
    if (
      rawConquis === null ||
      rawAspirantes === null ||
      rawConsejeros === null ||
      rawDirectiva === null ||
      rawFichas === null
    ) {
      return null;
    }

    const indice = construirIndiceDesdeDatos(
      rawConquis,
      rawAspirantes,
      rawConsejeros,
      rawDirectiva,
      rawFichas
    );

    const conquis: BloqueDatos = bloqueVacio();
    for (const { id, data } of rawConquis) {
      const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
      const unidad = typeof data.unidad === "string" ? data.unidad : "";
      registrarPersona(
        conquis.conFecha,
        conquis.sinFecha,
        `c_${id}`,
        nombre,
        "conquistador",
        unidad ? `Unidad: ${unidad}` : "Club",
        data,
        undefined,
        indice
      );
    }

    const aspirantes: BloqueDatos = bloqueVacio();
    for (const { id, data } of rawAspirantes) {
      const nombre = nombreCompletoAspirante(data);
      const asoc = typeof data.asociacion === "string" ? data.asociacion : "";
      registrarPersona(
        aspirantes.conFecha,
        aspirantes.sinFecha,
        `a_${id}`,
        nombre,
        "aspirante",
        asoc ? `Asociación: ${asoc}` : "Aspirante",
        data,
        undefined,
        indice
      );
    }

    const consejeros: BloqueDatos = bloqueVacio();
    for (const { id, data } of rawConsejeros) {
      const unidades = Array.isArray(data.unidades)
        ? (data.unidades as string[]).filter(Boolean).join(", ")
        : "";
      const detalleUnidades = unidades ? `Unidades: ${unidades}` : "Consejero";
      const nombreTitular = String(data.nombre ?? "").trim();

      if (nombreTitular) {
        const fechaTit = extraerFechaNacimientoTitular(data);
        registrarPersona(
          consejeros.conFecha,
          consejeros.sinFecha,
          `co_${id}`,
          nombreTitular,
          "consejero",
          detalleUnidades,
          data,
          fechaTit || undefined,
          indice,
          String(data.pin ?? "")
        );
      }

      const nombreAsoc = String(data.consejeroAsociado ?? "").trim();
      if (nombreAsoc) {
        const fechaAsoc = extraerFechaNacimientoAsociado(data);
        registrarPersona(
          consejeros.conFecha,
          consejeros.sinFecha,
          `as_${id}`,
          nombreAsoc,
          "asociado",
          `Asociado de ${nombreTitular || "consejero"}`,
          data,
          fechaAsoc || undefined,
          indice
        );
      }
    }

    const directiva: BloqueDatos = bloqueVacio();
    for (const { id, data } of rawDirectiva) {
      const nombre = String(data.nombre ?? "").trim();
      const cargo = String(data.cargo ?? "").trim();
      registrarPersona(
        directiva.conFecha,
        directiva.sinFecha,
        `d_${id}`,
        nombre,
        "directiva",
        cargo || "Directiva",
        data,
        undefined,
        indice,
        String(data.pin ?? "")
      );
    }

    return { conquis, aspirantes, consejeros, directiva };
  }, [rawConquis, rawAspirantes, rawConsejeros, rawDirectiva, rawFichas]);

  const conquis = bloques?.conquis ?? bloqueVacio();
  const aspirantes = bloques?.aspirantes ?? bloqueVacio();
  const consejeros = bloques?.consejeros ?? bloqueVacio();
  const directiva = bloques?.directiva ?? bloqueVacio();

  const todasConFecha = useMemo(
    () => [
      ...conquis.conFecha,
      ...aspirantes.conFecha,
      ...consejeros.conFecha,
      ...directiva.conFecha,
    ],
    [conquis, aspirantes, consejeros, directiva]
  );

  const todasSinFecha = useMemo(
    () => [
      ...conquis.sinFecha,
      ...aspirantes.sinFecha,
      ...consejeros.sinFecha,
      ...directiva.sinFecha,
    ],
    [conquis, aspirantes, consejeros, directiva]
  );

  const lista = useMemo(
    () => filtrarCumpleanosProximos(todasConFecha, VENTANA_DIAS),
    [todasConFecha]
  );

  const hoy = useMemo(() => lista.filter((p) => p.diasHasta === 0), [lista]);
  const proximos = useMemo(() => lista.filter((p) => p.diasHasta > 0), [lista]);

  const sinFechaUnicas = useMemo(
    () =>
      deduplicarRegistrosSinFecha(
        quitarSinFechaSiYaTieneFecha(todasSinFecha, todasConFecha)
      ),
    [todasSinFecha, todasConFecha]
  );

  const estaCargando = bloques === null;

  const totalRegistrados = useMemo(
    () => contarPersonasUnicas(todasConFecha, todasSinFecha),
    [todasConFecha, todasSinFecha]
  );

  const fechaDisplay = (raw: string) => {
    const fmt = formatFechaDDMMYYYY(raw);
    return fmt === "—" ? raw : fmt;
  };

  return (
    <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-pink-400/25 bg-white/5 p-6 text-left backdrop-blur-sm">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="relative mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30">
          <Cake className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Cumpleaños próximos</h3>
          <p className="text-sm text-white/55">
            Secretaría: todos los registrados del club — conquistadores, aspirantes, consejeros,
            asociados y directiva ({totalRegistrados} personas). Cumpleaños en los próximos{" "}
            {VENTANA_DIAS} días.
          </p>
        </div>
      </div>

      {estaCargando ? (
        <p className="relative flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando registros del club…
        </p>
      ) : (
        <>
          {errorCarga && (
            <p className="relative mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {errorCarga}
            </p>
          )}
          {lista.length === 0 ? (
            <p className="relative mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
              No hay cumpleaños en los próximos {VENTANA_DIAS} días entre quienes tienen fecha de
              nacimiento guardada.
            </p>
          ) : (
            <div className="relative mb-6 grid gap-4 md:grid-cols-2">
              {hoy.length > 0 && (
                <div className="rounded-2xl border border-pink-400/30 bg-pink-500/10 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-300">
                    Hoy
                  </p>
                  <ul className="space-y-2">
                    {hoy.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <PersonaCard p={p} fechaDisplay={fechaDisplay} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className={`rounded-2xl border border-amber-400/25 bg-amber-500/5 p-4 ${
                  hoy.length === 0 ? "md:col-span-2" : ""
                }`}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-300">
                  Próximos días
                </p>
                {proximos.length === 0 ? (
                  <p className="text-sm text-white/50">Nadie más en esta ventana aparte de hoy.</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {proximos.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{p.nombre}</p>
                          <p className="text-xs text-white/50">{p.detalle}</p>
                          <p className="text-xs text-white/60">{fechaDisplay(p.fechaTexto)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-200">
                          {etiquetaDiasCumpleanos(p.diasHasta)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {sinFechaUnicas.length > 0 && (
            <details className="relative rounded-2xl border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer text-sm font-bold text-white/75">
                Sin fecha de nacimiento ({sinFechaUnicas.length}) — clic en el nombre para abrir su
                registro y poner la fecha
              </summary>
              <div className="mt-3 text-sm">
                <ul className="flex flex-wrap gap-2">
                  {sinFechaUnicas.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={rutaConClub(
                          urlEditarPersona(p.tipo, p.editRegistroId ?? p.id),
                          clubSlug
                        )}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/20"
                        title="Editar registro y agregar fecha de nacimiento"
                      >
                        <Pencil className="h-3 w-3 shrink-0" />
                        <span>
                          {p.nombre}
                          {p.detalle ? ` · ${p.detalle}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
