"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { BookOpen, Star, Award } from "lucide-react";
import { getCategoriasConPuntos, sumarPuntos } from "@/src/lib/categoriasPuntos";

export default function CalificacionesClient() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  const [puntosCategorias, setPuntosCategorias] = useState<Record<string, unknown>>({});
  const [calificacionesRecientes, setCalificacionesRecientes] = useState<
    { id: string; materia?: string; nota?: string }[]
  >([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pin) return;

    const califQuery = query(collection(db, "calificaciones"), where("pin", "==", pin));
    getDocs(califQuery).then((snap) => {
      setCalificacionesRecientes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const refConquis = doc(db, "calificacionesConquis", pin);
    getDoc(refConquis).then((snap) => {
      if (snap.exists()) {
        setPuntosCategorias(snap.data().puntos || {});
        setNombre(snap.data().nombre || "");
      }
      setLoading(false);
    });
  }, [pin]);

  const categoriasConPuntos = getCategoriasConPuntos(puntosCategorias);
  const total = sumarPuntos(puntosCategorias);

  if (loading) return <div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Star fill="white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{nombre || "Conquistador"}</h2>
            <p className="text-slate-500 text-sm">Evaluación de Calificaciones</p>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="text-slate-400">
          Volver
        </button>
      </div>

      <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-blue-100 text-sm uppercase tracking-wider font-semibold">Puntaje Total</p>
            <h3 className="text-5xl font-black">
              {Number(total)} <span className="text-xl opacity-70">pts</span>
            </h3>
          </div>
          <div className="text-right">
            <Award size={40} className="ml-auto mb-2 opacity-50" />
          </div>
        </div>
      </div>

      {categoriasConPuntos.length > 0 && (
        <div className="mb-8">
          <div className="font-bold text-xs text-indigo-600 mb-2">Puntaje por categoría</div>
          <div className="grid md:grid-cols-2 gap-4">
            {categoriasConPuntos.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <span className="font-bold text-slate-700">{cat.nombre}</span>
                <span className="text-sm font-bold text-blue-600">{cat.valor} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {calificacionesRecientes.length > 0 && (
        <div className="mb-8">
          <div className="font-bold text-xs text-indigo-600 mb-2">Notas registradas</div>
          <div className="space-y-4">
            {calificacionesRecientes.map((cal) => (
              <div
                key={cal.id}
                className="flex items-center justify-between p-4 bg-slate-50/80 rounded-3xl border border-transparent hover:border-slate-200 hover:bg-white transition-all"
              >
                <div className="flex items-center gap-4">
                  <BookOpen size={20} />
                  <div>
                    <p className="font-black text-slate-800 text-sm">{cal.materia}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nota</p>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-black uppercase shadow-sm">
                  {cal.nota}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {categoriasConPuntos.length === 0 && calificacionesRecientes.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-8">
          No hay puntos ni notas registrados para este PIN.
        </p>
      )}
    </div>
  );
}
