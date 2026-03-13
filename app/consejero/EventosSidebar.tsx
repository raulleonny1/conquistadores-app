"use client";
import React, { useEffect, useState } from "react";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Calendar, Clock, ChevronRight } from "lucide-react";

export default function EventosSidebar() {
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    const q = collection(db, "eventos");
    const unsub = onSnapshot(q, (snapshot) => {
      setEventos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
      <h3 className="font-black text-xl mb-8 flex items-center gap-3 tracking-tight">
        <Calendar className="text-orange-500" size={24} />
        Próximos Eventos
      </h3>
      <div className="space-y-4">
        {eventos.length === 0 ? (
          <div className="text-center text-slate-400">No hay eventos registrados.</div>
        ) : (
          eventos.map(evento => (
            <div key={evento.id} className="p-5 rounded-4xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer group active:scale-95">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm bg-emerald-100 text-emerald-700">
                  Evento
                </span>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="font-black text-slate-800 leading-tight mb-3 text-base">{evento.nombre}</h4>
              <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <div className="p-1.5 bg-indigo-50 rounded-lg"><Clock size={14} className="text-indigo-500" /></div>
                 {formatFechaDDMMYYYY(evento.fecha)}
              </div>
              <div className="mt-2 text-xs text-slate-500 font-semibold">Lugar: {evento.lugar}</div>
              <div className="mt-1 text-xs text-slate-400">{evento.observacion}</div>
            </div>
          ))
        )}
      </div>
      <button className="w-full mt-8 py-4 rounded-3xl bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md active:scale-95">
        Calendario Completo
      </button>
    </div>
  );
}
