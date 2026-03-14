"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";

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

export default function RegistroSemanal() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("conquistador") || "";
  const [fecha, setFecha] = useState("");
  const [puntos, setPuntos] = useState<any>({});
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    if (!pin) return;
    const fetchHistorial = async () => {
      const q = query(collection(db, "calificacionesSemanal"), where("pin", "==", pin));
      const snap = await getDocs(q);
      setHistorial(snap.docs.map(doc => doc.data()));
    };
    fetchHistorial();
  }, [pin]);

  const handleChange = (catId: string, valor: number) => {
    setPuntos((prev: any) => ({ ...prev, [catId]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) return alert("Selecciona una fecha");
    await addDoc(collection(db, "calificacionesSemanal"), {
      pin,
      fecha,
      puntos
    });
    // Sumar puntos al documento principal
    const ref = doc(db, "calificacionesConquis", pin);
    const snap = await getDoc(ref);
    let puntosActuales: { [key: string]: number } = {};
    if (snap.exists()) {
      puntosActuales = snap.data().puntos || {};
    } else {
      puntosActuales = CATEGORIAS_PUNTOS.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {});
    }
    // Sumar cada categoría
    const nuevosPuntos: { [key: string]: number } = { ...puntosActuales };
    for (const cat of CATEGORIAS_PUNTOS) {
      nuevosPuntos[cat.id] = (puntosActuales[cat.id] || 0) + (puntos[cat.id] || 0);
    }
    await setDoc(ref, {
      puntos: nuevosPuntos
    }, { merge: true });
    setPuntos({});
    setFecha("");
    // Actualizar historial
    const q = query(collection(db, "calificacionesSemanal"), where("pin", "==", pin));
    const snapHist = await getDocs(q);
    setHistorial(snapHist.docs.map(doc => doc.data()));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Registro Semanal de Calificaciones</h2>
      <form onSubmit={handleSubmit} className="mb-8">
        <label className="block mb-2">Fecha de reunión:</label>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border p-2 rounded mb-4 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {CATEGORIAS_PUNTOS.map(cat => (
            <div key={cat.id} className="flex flex-col">
              <label className="text-xs md:text-sm mb-1">{cat.nombre}</label>
              <input
                type="number"
                value={puntos[cat.id] || ""}
                onChange={e => handleChange(cat.id, parseInt(e.target.value) || 0)}
                className="border p-2 rounded w-full text-xs md:text-base"
              />
            </div>
          ))}
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full md:w-auto">Guardar registro</button>
      </form>
      <h3 className="text-lg font-bold mb-2">Historial semanal</h3>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border text-xs md:text-sm">
          <thead>
            <tr>
              <th className="border p-2">Fecha</th>
              {CATEGORIAS_PUNTOS.map(cat => (
                <th key={cat.id} className="border p-2">{cat.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historial.map((reg, idx) => (
              <tr key={idx}>
                <td className="border p-2">{reg.fecha}</td>
                {CATEGORIAS_PUNTOS.map(cat => (
                  <td key={cat.id} className="border p-2">{reg.puntos[cat.id] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
