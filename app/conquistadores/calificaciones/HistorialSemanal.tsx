"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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

export default function HistorialSemanal() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
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

  return (
    <div className="max-w-2xl mx-auto p-4">
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
