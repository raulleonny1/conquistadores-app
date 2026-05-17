"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../../src/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Star, Award } from "lucide-react";
import HistorialSemanal from "./HistorialSemanal";
import { CATEGORIAS_PUNTOS, getCategoriasConPuntos, sumarPuntos } from "@/src/lib/categoriasPuntos";

export default function CalificacionesConquistadorClient() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  const [puntos, setPuntos] = useState<Record<string, number | string>>({});
  const [etiquetasActividades, setEtiquetasActividades] = useState<Record<string, string>>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pin) return;

    setLoading(true);
    const ref = doc(db, "calificacionesConquis", pin);
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPuntos(data.puntos || {});
        setEtiquetasActividades((data.etiquetasActividades as Record<string, string>) || {});
        setNombre(data.nombre || "");
      } else {
        const initialPuntos = CATEGORIAS_PUNTOS.reduce(
          (acc, cat) => ({ ...acc, [cat.id]: 0 }),
          {} as Record<string, number>
        );
        await setDoc(ref, {
          nombre: "",
          puntos: initialPuntos,
        });
        setPuntos(initialPuntos);
        setEtiquetasActividades({});
        setNombre("");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [pin]);

  const categoriasConPuntos = getCategoriasConPuntos(puntos, etiquetasActividades);
  const total = sumarPuntos(puntos, etiquetasActividades);

  if (!pin) {
    return (
      <div className="text-center mt-10 text-lg text-red-700">
        Falta el PIN en la URL. Vuelve al dashboard e intenta de nuevo.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Star fill="white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{nombre || "Conquistador"}</h2>
            <p className="text-slate-500 text-sm">Mi Progreso de Calificaciones</p>
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

      {categoriasConPuntos.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {categoriasConPuntos.map((cat) => (
            <div key={cat.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-700">{cat.nombre}</span>
                <span className="text-sm font-bold text-blue-600">{cat.valor} pts</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm text-center py-6 mb-4">
          Aún no tienes puntos registrados en ninguna categoría.
        </p>
      )}

      <HistorialSemanal pin={pin} />
    </div>
  );
}
