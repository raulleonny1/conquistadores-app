"use client";

import React, { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { Calendar, ChevronRight, LayoutDashboard, MapPin, Trash2 } from "lucide-react";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import { handleError } from "@/src/lib/errorHandler";
import { nombreEvento, type EventoFirestore } from "@/src/lib/eventos";

export type EventoDoc = EventoFirestore & { id: string };

export default function ActividadesConsejeroCard() {
  const [eventos, setEventos] = useState<EventoDoc[]>([]);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<EventoDoc | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "eventos"), (snap) => {
      setEventos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventoDoc)));
    });
    return () => unsub();
  }, []);

  const eliminar = async (id: string) => {
    if (!window.confirm("¿Eliminar esta actividad? Se quitará del calendario y de los dashboards.")) {
      return;
    }
    setEliminandoId(id);
    try {
      await deleteDoc(doc(db, "eventos", id));
      toast.success("Actividad eliminada");
      if (detalle?.id === id) setDetalle(null);
    } catch (err) {
      handleError(err, "No se pudo eliminar la actividad");
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <>
      <div className="group rounded-3xl border border-white bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-2xl bg-rose-500 p-3 text-white shadow-lg transition-all hover:bg-rose-600">
            <Calendar className="h-6 w-6" />
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </div>
        <h3 className="mb-1 text-xl font-bold text-rose-700">Actividades</h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">Próximos eventos y tareas.</p>
        <div className="space-y-3">
          {eventos.length > 0 ? (
            eventos.map((evento) => (
              <div
                key={evento.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-bold text-rose-700">{nombreEvento(evento)}</p>
                  <button
                    type="button"
                    onClick={() => eliminar(evento.id)}
                    disabled={eliminandoId === evento.id}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="Eliminar actividad"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-1 text-xs text-slate-600">
                  Fecha: {formatFechaDDMMYYYY(evento.fecha)}
                  {evento.hora ? ` · ${evento.hora}` : ""}
                </p>
                {evento.lugar ? (
                  <p className="mb-1 flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {evento.lugar}
                  </p>
                ) : null}
                {evento.observacion ? (
                  <p className="text-xs text-slate-400">{evento.observacion}</p>
                ) : null}
                <button
                  type="button"
                  className="mt-2 text-xs font-bold text-rose-600 hover:underline"
                  onClick={() => setDetalle(evento)}
                >
                  Ver detalles
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 px-4 py-8">
              <LayoutDashboard className="mb-2 h-8 w-8 text-slate-200" />
              <p className="text-center text-xs italic text-slate-400">No hay actividades registradas.</p>
            </div>
          )}
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 text-xl font-bold text-rose-500 hover:text-rose-700"
              onClick={() => setDetalle(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 className="mb-4 text-2xl font-bold text-rose-700">Detalles de actividad</h2>
            <p className="mb-2">
              <span className="font-semibold text-slate-700">Nombre: </span>
              {nombreEvento(detalle)}
            </p>
            <p className="mb-2">
              <span className="font-semibold text-slate-700">Fecha: </span>
              {formatFechaDDMMYYYY(detalle.fecha)}
            </p>
            {detalle.hora ? (
              <p className="mb-2">
                <span className="font-semibold text-slate-700">Hora: </span>
                {detalle.hora}
              </p>
            ) : null}
            <p className="mb-2">
              <span className="font-semibold text-slate-700">Lugar: </span>
              {detalle.lugar || "—"}
            </p>
            <p className="mb-4">
              <span className="font-semibold text-slate-700">Observación: </span>
              {detalle.observacion || "—"}
            </p>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
              onClick={() => eliminar(detalle.id)}
              disabled={eliminandoId === detalle.id}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar actividad
            </button>
          </div>
        </div>
      )}
    </>
  );
}
