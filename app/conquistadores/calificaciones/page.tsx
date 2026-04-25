"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Trophy,
  Star,
  Award,
  LogOut
} from "lucide-react";
import HistorialSemanal from "./HistorialSemanal";

const CATEGORIAS_PUNTOS = [
  { id: "puntualidad", nombre: "Puntualidad" },
  { id: "asistencia", nombre: "Asistencia" },
  { id: "disciplina", nombre: "Disciplina" },
  { id: "reclutador", nombre: "Reclutador" },
  { id: "materiales", nombre: "Materiales" },
  { id: "fidelidad", nombre: "Fidelidad Eclesiástica" },
  { id: "misionero", nombre: "Misionero" },
  { id: "colaborador", nombre: "Colaborador" },
  { id: "orden_cerrado", nombre: "Orden Cerrado" },
  { id: "tareas", nombre: "Completar Tareas" },
  { id: "especialidades", nombre: "Especialidades" }
];

export default function CalificacionesConquistadorPage({ searchParams }: { searchParams: { pin?: string } }) {
  const pin = searchParams.pin || "";
  const [puntos, setPuntos] = useState<any>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pin) return;

    const fetchCalificaciones = async () => {
      setLoading(true);
      const ref = doc(db, "calificacionesConquis", pin);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setPuntos(data.puntos || {});
        setNombre(data.nombre || "");
      } else {
        // Inicializar si no existe
        const initialPuntos = CATEGORIAS_PUNTOS.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {});
        await setDoc(ref, {
          nombre: "",
          puntos: initialPuntos
        });
        setPuntos(initialPuntos);
        setNombre("");
      }

      setLoading(false);
    };

    fetchCalificaciones();
  }, [pin]);

  const total = Object.values(puntos).reduce((acc: number, val) => {
    if (typeof val === "number") return acc + val;
    if (typeof val === "string") return acc + (parseInt(val) || 0);
    return acc;
  }, 0);

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
        <button onClick={() => window.history.back()} className="text-slate-400">Volver</button>
      </div>

      {/* Resumen General */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-blue-100 text-sm uppercase tracking-wider font-semibold">Puntaje Total</p>
            <h3 className="text-5xl font-black">{Number(total)} <span className="text-xl opacity-70">pts</span></h3>
          </div>
          <div className="text-right">
            <Award size={40} className="ml-auto mb-2 opacity-50" />
          </div>
        </div>
      </div>

      {/* Desglose de Categorías (solo las reales, editable Disciplina) */}
      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORIAS_PUNTOS.map(cat => {
          const valor = puntos[cat.id] || 0;
          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-700">{cat.nombre}</span>
                <span className="text-sm font-bold text-blue-600">{valor} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      <HistorialSemanal />

    </div>
  );
}
