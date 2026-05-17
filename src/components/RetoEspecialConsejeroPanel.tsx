"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { db } from "@/src/firebase";
import { addDoc, collection } from "firebase/firestore";
import { Award, Send, Sparkles, Target, FileText, Zap, Calendar } from "lucide-react";
import { handleError } from "@/src/lib/errorHandler";
import type { RetoEspecialDoc } from "@/src/lib/retosEspeciales";
import { ordenarRetosPorFecha } from "@/src/lib/retosEspeciales";

type Props = {
  consejeroId: string;
  unidades: string[];
  retosEspeciales: RetoEspecialDoc[];
};

function slugUnidad(unidad: string) {
  return unidad.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export default function RetoEspecialConsejeroPanel({ consejeroId, unidades, retosEspeciales }: Props) {
  const [enviando, setEnviando] = useState<string | null>(null);

  const enviarReto = async (
    unidad: string,
    titulo: string,
    descripcion: string,
    puntos: number
  ) => {
    const fecha = new Date().toISOString().split("T")[0];
    setEnviando(unidad);
    try {
      await addDoc(collection(db, "retosEspeciales"), {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        puntos,
        unidad,
        consejeroId,
        fecha,
        activo: true,
      });
      toast.success(`Reto enviado a la unidad «${unidad}»`);
    } catch (err) {
      handleError(err, "No se pudo crear el reto. Revisa la conexión.");
    } finally {
      setEnviando(null);
    }
  };

  if (unidades.length === 0) {
    return (
      <section className="rounded-[2rem] border border-violet-200/80 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <p className="text-center text-sm text-slate-500">
          No tienes unidades asignadas. Pide al administrador que te asigne una unidad para enviar retos.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-violet-200/60 bg-linear-to-br from-violet-50 via-white to-fuchsia-50 shadow-xl shadow-violet-200/40">
      <div className="border-b border-violet-100/80 bg-white/60 px-6 py-5 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300/50">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-violet-950 sm:text-2xl">Reto Especial</h2>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Los conquistadores de cada unidad verán el reto en su dashboard al instante.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        {unidades.map((unidad) => {
          const slug = slugUnidad(unidad);
          const retosUnidad = ordenarRetosPorFecha(
            retosEspeciales.filter((r) => r.unidad === unidad)
          );

          return (
            <article
              key={unidad}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-violet-800">
                  Unidad: {unidad}
                </span>
                {retosUnidad[0] && (
                  <span className="text-xs font-semibold text-emerald-600">
                    Activo en dashboard de miembros
                  </span>
                )}
              </div>

              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const titulo = (
                    form.elements.namedItem(`titulo-${slug}`) as HTMLInputElement
                  ).value;
                  const descripcion = (
                    form.elements.namedItem(`descripcion-${slug}`) as HTMLInputElement
                  ).value;
                  const puntos = parseInt(
                    (form.elements.namedItem(`puntos-${slug}`) as HTMLInputElement).value,
                    10
                  );
                  if (!titulo.trim() || !descripcion.trim() || Number.isNaN(puntos)) {
                    toast.error("Completa título, descripción y puntos.");
                    return;
                  }
                  await enviarReto(unidad, titulo, descripcion, puntos);
                  form.reset();
                }}
              >
                <label className="sm:col-span-2">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Target className="h-3.5 w-3.5" /> Título del reto
                  </span>
                  <input
                    name={`titulo-${slug}`}
                    placeholder="Ej. Leer cuadernillo"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200"
                    required
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <FileText className="h-3.5 w-3.5" /> Descripción
                  </span>
                  <input
                    name={`descripcion-${slug}`}
                    placeholder="Instrucciones para el conquistador"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200"
                    required
                  />
                </label>
                <label>
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Zap className="h-3.5 w-3.5" /> Puntos XP
                  </span>
                  <input
                    name={`puntos-${slug}`}
                    type="number"
                    min={1}
                    placeholder="200"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200"
                    required
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={enviando === unidad}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-violet-300/40 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {enviando === unidad ? "Enviando…" : "Enviar reto"}
                  </button>
                </div>
              </form>

              {retosUnidad.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-violet-600">
                    Retos enviados
                  </p>
                  <ul className="space-y-2">
                    {retosUnidad.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3"
                      >
                        <p className="font-bold text-violet-900">{r.titulo}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{r.descripcion}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-violet-600/90">
                          <span className="inline-flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {r.puntos} pts
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {r.fecha}
                          </span>
                          {r.id === retosUnidad[0].id && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                              Visible ahora
                            </span>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
