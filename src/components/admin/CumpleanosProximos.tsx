"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import { nombreCompletoAspirante } from "@/src/constants/aspirante";
import {
  etiquetaDiasCumpleanos,
  etiquetaTipoPersona,
  extraerFechaNacimiento,
  filtrarCumpleanosProximos,
  type CumpleanosPersona,
  type RegistradoSinFecha,
  type TipoPersonaClub,
} from "@/src/lib/cumpleanos";
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
  data: Record<string, unknown>
) {
  if (!nombre.trim()) return;
  const fecha = extraerFechaNacimiento(data);
  if (fecha) {
    conFecha.push({ id, nombre: nombre.trim(), tipo, detalle, fechaTexto: fecha });
  } else {
    sinFecha.push({ id, nombre: nombre.trim(), tipo, detalle });
  }
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
      <p className="text-xs text-slate-500">
        {etiquetaTipoPersona(p.tipo)} · {p.detalle}
      </p>
      <p className="mt-1 text-xs font-semibold text-pink-700">
        {fechaDisplay(p.fechaTexto)} · {etiquetaDiasCumpleanos(p.diasHasta)}
      </p>
    </>
  );
}

export default function CumpleanosProximos() {
  const [conquis, setConquis] = useState<BloqueDatos>(bloqueVacio);
  const [aspirantes, setAspirantes] = useState<BloqueDatos>(bloqueVacio);
  const [consejeros, setConsejeros] = useState<BloqueDatos>(bloqueVacio);
  const [directiva, setDirectiva] = useState<BloqueDatos>(bloqueVacio);
  const [cargando, setCargando] = useState({
    conquis: true,
    aspirantes: true,
    consejeros: true,
    directiva: true,
  });
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const marcarListo = (clave: keyof typeof cargando) => {
    setCargando((s) => ({ ...s, [clave]: false }));
  };

  const manejarErrorSnapshot = (clave: keyof typeof cargando, etiqueta: string) => (err: Error) => {
    console.error(`Cumpleaños — error leyendo ${etiqueta}:`, err);
    marcarListo(clave);
    setErrorCarga(
      (prev) =>
        prev ??
        `No se pudieron cargar todos los registros (${etiqueta}). Si acabas de actualizar firestore.rules, despliégalas en Firebase.`
    );
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "RegistroConquis"),
      (snap) => {
      const conFecha: FilaCumple[] = [];
      const sinFecha: RegistradoSinFecha[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
        const unidad = typeof data.unidad === "string" ? data.unidad : "";
        registrarPersona(
          conFecha,
          sinFecha,
          `c_${docSnap.id}`,
          nombre,
          "conquistador",
          unidad ? `Unidad: ${unidad}` : "Club Caleb",
          data
        );
      });
      setConquis({ conFecha, sinFecha });
      marcarListo("conquis");
    },
    manejarErrorSnapshot("conquis", "conquistadores")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "aspirantesGuiaMayor"),
      (snap) => {
      const conFecha: FilaCumple[] = [];
      const sinFecha: RegistradoSinFecha[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const nombre = nombreCompletoAspirante(data);
        const asoc = typeof data.asociacion === "string" ? data.asociacion : "";
        registrarPersona(
          conFecha,
          sinFecha,
          `a_${docSnap.id}`,
          nombre,
          "aspirante",
          asoc ? `Asociación: ${asoc}` : "Aspirante",
          data
        );
      });
      setAspirantes({ conFecha, sinFecha });
      marcarListo("aspirantes");
    },
    manejarErrorSnapshot("aspirantes", "aspirantes")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "consejeros"),
      (snap) => {
      const conFecha: FilaCumple[] = [];
      const sinFecha: RegistradoSinFecha[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const unidades = Array.isArray(data.unidades)
          ? (data.unidades as string[]).filter(Boolean).join(", ")
          : "";
        const detalleUnidades = unidades ? `Unidades: ${unidades}` : "Consejero";
        const nombreTitular = String(data.nombre ?? "").trim();

        if (nombreTitular) {
          registrarPersona(
            conFecha,
            sinFecha,
            `co_${docSnap.id}`,
            nombreTitular,
            "consejero",
            detalleUnidades,
            data
          );
        }

        const nombreAsoc = String(data.consejeroAsociado ?? "").trim();
        if (nombreAsoc) {
          registrarPersona(
            conFecha,
            sinFecha,
            `as_${docSnap.id}`,
            nombreAsoc,
            "asociado",
            `Asociado de ${nombreTitular || "consejero"}`,
            {
              nacimiento: data.asociadoNacimiento ?? data.asociado_nacimiento ?? "",
            }
          );
        }
      });
      setConsejeros({ conFecha, sinFecha });
      marcarListo("consejeros");
    },
    manejarErrorSnapshot("consejeros", "consejeros")
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "directivaClub"),
      (snap) => {
      const conFecha: FilaCumple[] = [];
      const sinFecha: RegistradoSinFecha[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const nombre = String(data.nombre ?? "").trim();
        const cargo = String(data.cargo ?? "").trim();
        registrarPersona(
          conFecha,
          sinFecha,
          `d_${docSnap.id}`,
          nombre,
          "directiva",
          cargo || "Directiva",
          data
        );
      });
      setDirectiva({ conFecha, sinFecha });
      marcarListo("directiva");
    },
    manejarErrorSnapshot("directiva", "directiva")
    );
    return () => unsub();
  }, []);

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

  const sinFechaPorTipo = useMemo(() => {
    const grupos: Partial<Record<TipoPersonaClub, RegistradoSinFecha[]>> = {};
    for (const p of todasSinFecha) {
      if (!grupos[p.tipo]) grupos[p.tipo] = [];
      grupos[p.tipo]!.push(p);
    }
    return grupos;
  }, [todasSinFecha]);

  const estaCargando =
    cargando.conquis || cargando.aspirantes || cargando.consejeros || cargando.directiva;

  const totalRegistrados = todasConFecha.length + todasSinFecha.length;

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
                          <p className="text-xs text-slate-500">
                            {etiquetaTipoPersona(p.tipo)} · {p.detalle}
                          </p>
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

          {todasSinFecha.length > 0 && (
            <details className="rounded-xl border border-slate-200 bg-white/90 p-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-700">
                Sin fecha de nacimiento ({todasSinFecha.length}) — clic en el nombre para abrir su
                registro y poner la fecha
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                {(Object.keys(sinFechaPorTipo) as TipoPersonaClub[]).map((tipo) => {
                  const items = sinFechaPorTipo[tipo];
                  if (!items?.length) return null;
                  return (
                    <div key={tipo}>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                        {etiquetaTipoPersona(tipo)} ({items.length})
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {items.map((p) => (
                          <li key={p.id}>
                            <Link
                              href={urlEditarPersona(p.tipo, p.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-800 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
                              title={`Editar registro y agregar fecha de nacimiento`}
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
                  );
                })}
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
