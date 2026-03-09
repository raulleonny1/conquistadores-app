"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../src/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function ConsejeroDashboard({ consejeroId }: { consejeroId: string }) {
  type Unidad = { id: string; nombre: string };
  type Calificacion = { id: string; unidad: string; nota: string };
  type Actividad = { id: string; titulo: string; descripcion: string; fecha?: string };
  type Consejero = { nombre: string; consejeroAsociado?: string };
  const [consejero, setConsejero] = useState<Consejero | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Consejero
      const consejeroDoc = await getDocs(query(collection(db, "consejeros"), where("id", "==", consejeroId)));
      const cData = consejeroDoc.docs[0]?.data();
      setConsejero({
        nombre: cData?.nombre || "",
        consejeroAsociado: cData?.consejeroAsociado || undefined
      });
      // Unidades
      // (Eliminada declaración duplicada)
      const unidadesQuery = await getDocs(query(collection(db, "unidades"), where("consejero", "==", cData?.nombre)));
      setUnidades(unidadesQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || ""
        };
      }));
      // Calificaciones
      const califQuery = await getDocs(query(collection(db, "calificaciones"), where("consejeroId", "==", consejeroId)));
      setCalificaciones(califQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          unidad: data.unidad || "",
          nota: data.nota || ""
        };
      }));
      // Actividades
      const actsQuery = await getDocs(collection(db, "actividades"));
      setActividades(actsQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          fecha: data.fecha || undefined
        };
      }));
      setLoading(false);
    }
    if (consejeroId) fetchData();
  }, [consejeroId]);

  if (loading) return <div className="text-center mt-10 text-lg text-blue-700">Cargando datos reales...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-blue-100 to-yellow-100">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-green-700 mb-4">¡Hola, {consejero?.nombre}!</h2>
        <p className="text-lg text-blue-700 mb-2">Consejero asociado: <span className="font-bold text-pink-600">{consejero?.consejeroAsociado || "-"}</span></p>
        <div className="w-full bg-gradient-to-r from-yellow-300 via-green-200 to-blue-200 rounded-xl p-4 mb-6 flex flex-col items-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">Tus Unidades</h3>
          <ul className="mb-4">
            {unidades.length === 0 ? <li className="text-gray-500">Sin unidades asignadas</li> : unidades.map(u => (
              <li key={u.id} className="font-semibold text-green-700">{u.nombre}</li>
            ))}
          </ul>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Calificaciones</h3>
          <ul>
            {calificaciones.length === 0 ? <li className="text-gray-500">Sin calificaciones</li> : calificaciones.map(c => (
              <li key={c.id} className="font-semibold text-blue-700">{c.unidad}: {c.nota}</li>
            ))}
          </ul>
          <h3 className="text-2xl font-bold text-pink-700 mb-2 mt-6">Actividades</h3>
          <ul>
            {actividades.length === 0 ? <li className="text-gray-500">Sin actividades</li> : actividades.map(act => (
              <li key={act.id} className="font-semibold text-pink-700 mb-2">
                <div className="text-lg">{act.titulo}</div>
                <div className="text-sm text-gray-700">{act.descripcion}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {act.fecha ? new Date(act.fecha).toLocaleString() : "Sin fecha"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
