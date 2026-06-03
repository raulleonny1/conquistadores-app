"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
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
      <p className="font-bold text-slate-800">{p.nombre}</p>
      <p className="text-xs text-slate-500">{p.detalle}</p>
      <p className="mt-1 text-xs font-semibold text-pink-700">
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
    const unsub = onSnapshot(
      collection(db, "RegistroConquis"),
      (snap) => {
        setRawConquis(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("conquistadores")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "aspirantesGuiaMayor"),
      (snap) => {
        setRawAspirantes(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("aspirantes")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "consejeros"),
      (snap) => {
        setRawConsejeros(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("consejeros")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "directivaClub"),
      (snap) => {
        setRawDirectiva(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      },
      manejarErrorSnapshot("directiva")
    );
    return () => unsub();
  }, []);

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
        unidad ? `Unidad: ${unidad}` : "Club Caleb",
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
    <section className="mb-10 rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-amber-50 p-6 shadow-sm text-left">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500 text-white shadow-md">
          <Cake className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Cumpleaños próximos</h3>
          <p className="text-sm text-slate-600">
            Secretaría: todos los registrados del club — conquistadores, aspirantes, consejeros,
            asociados y directiva ({totalRegistrados} personas). Cumpleaños en los próximos{" "}
            {VENTANA_DIAS} días.
          </p>
        </div>
      </div>

      {estaCargando ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando registros del club…
        </p>
      ) : (
        <>
          {errorCarga && (
            <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {errorCarga}
            </p>
          )}
          {lista.length === 0 ? (
            <p className="mb-4 rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-600">
              No hay cumpleaños en los próximos {VENTANA_DIAS} días entre quienes tienen fecha de
              nacimiento guardada.
            </p>
          ) : (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              {hoy.length > 0 && (
                <div className="rounded-xl border border-pink-300 bg-pink-100/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pink-800">
                    Hoy
                  </p>
                  <ul className="space-y-2">
                    {hoy.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                      >
                        <PersonaCard p={p} fechaDisplay={fechaDisplay} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className={`rounded-xl border border-amber-200 bg-white/80 p-4 ${
                  hoy.length === 0 ? "md:col-span-2" : ""
                }`}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                  Próximos días
                </p>
                {proximos.length === 0 ? (
                  <p className="text-sm text-slate-500">Nadie más en esta ventana aparte de hoy.</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {proximos.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{p.nombre}</p>
                          <p className="text-xs text-slate-500">{p.detalle}</p>
                          <p className="text-xs text-slate-600">{fechaDisplay(p.fechaTexto)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
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
            <details className="rounded-xl border border-slate-200 bg-white/90 p-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-700">
                Sin fecha de nacimiento ({sinFechaUnicas.length}) — clic en el nombre para abrir su
                registro y poner la fecha
              </summary>
              <div className="mt-3 text-sm">
                <ul className="flex flex-wrap gap-2">
                  {sinFechaUnicas.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={urlEditarPersona(
                          p.tipo,
                          p.editRegistroId ?? p.id
                        )}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-800 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
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
