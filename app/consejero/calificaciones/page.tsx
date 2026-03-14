"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import {
  Trophy,
  Star,
  Award,
  LogOut
} from "lucide-react";
// Eliminado RegistroSemanal

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

export default function CalificacionesConsejeroPage() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("conquistador") || "";
  const [puntos, setPuntos] = useState<any>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  // Estados para inputs por categoría
  const [inputValores, setInputValores] = React.useState<{ [key: string]: string }>({});
  const [inputFechas, setInputFechas] = React.useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!pin) return;
    const ref = doc(db, "calificacionesConquis", pin);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPuntos(data.puntos || {});
        setNombre(data.nombre || "");
      } else {
        setDoc(ref, {
          nombre: "",
          puntos: CATEGORIAS_PUNTOS.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {})
        });
        setPuntos(CATEGORIAS_PUNTOS.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {}));
        setNombre("");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [pin]);

  const handleChange = async (catId: string, valor: number) => {
    setPuntos((prev: any) => ({ ...prev, [catId]: (prev[catId] || 0) + valor }));
    const ref = doc(db, "calificacionesConquis", pin);
    await setDoc(ref, {
      nombre,
      puntos: { ...puntos, [catId]: (puntos[catId] || 0) + valor }
    }, { merge: true });
  };

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
            <p className="text-slate-500 text-sm">Evaluación de Calificaciones</p>
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

      {/* Tabla de Calificaciones con fecha */}
      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORIAS_PUNTOS.map(cat => {
          const valor = puntos[cat.id] || 0;
          const handleInputValor = (catId: string, value: string) => {
            setInputValores(prev => ({ ...prev, [catId]: value }));
          };
          const handleInputFecha = (catId: string, value: string) => {
            setInputFechas(prev => ({ ...prev, [catId]: value }));
          };
          const handleAgregar = async (catId: string) => {
            const inputFecha = inputFechas[catId] || "";
            const inputValor = inputValores[catId] || "";
            if (!inputFecha) return alert("Selecciona una fecha");
            const ref = doc(db, "calificacionesConquis", pin);
            await setDoc(ref, {
              puntos: { ...puntos, [catId]: valor + (parseInt(inputValor) || 0) },
              fechaUltima: inputFecha
            }, { merge: true });
            setInputValores(prev => ({ ...prev, [catId]: "" }));
          };
          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-700">{cat.nombre}</span>
                <span className="text-sm font-bold text-blue-600">{valor} pts</span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={inputFechas[cat.id] || ""}
                  onChange={e => handleInputFecha(cat.id, e.target.value)}
                  className="border p-2 rounded w-full mb-1"
                />
                <input
                  type="number"
                  value={inputValores[cat.id] || ""}
                  onChange={e => handleInputValor(cat.id, e.target.value)}
                  placeholder="Agregar puntos"
                  className="border p-2 rounded w-full mb-1"
                />
                <button
                  onClick={() => handleAgregar(cat.id)}
                  className="bg-blue-600 text-white px-4 py-1 rounded w-full"
                >Agregar</button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Eliminado RegistroSemanal, solo lógica de calificaciones */}
    </div>
  );
}
