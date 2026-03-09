"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../src/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function AdminActividades() {
  type Actividad = { id: string; titulo: string; descripcion: string; fecha?: string };
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    getDocs(collection(db, "actividades")).then(snapshot => {
      setActividades(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          fecha: data.fecha || undefined
        };
      }));
    });
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addDoc(collection(db, "actividades"), { titulo, descripcion, fecha: new Date().toISOString() });
    setTitulo("");
    setDescripcion("");
    // Recargar actividades
    getDocs(collection(db, "actividades")).then(snapshot => {
      setActividades(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          fecha: data.fecha || undefined
        };
      }));
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Actividades (Admin)</h1>
      <form onSubmit={handleAdd} className="space-y-3 mb-6">
        <input
          placeholder="Título de la actividad"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <button className="bg-blue-700 text-white px-4 py-2 rounded">Agregar</button>
      </form>
      <ul>
        {actividades.map(act => (
          <li key={act.id} className="mb-4 border rounded p-3 bg-blue-50">
            <div className="font-bold text-blue-700">{act.titulo}</div>
            <div className="text-gray-700">{act.descripcion}</div>
            <div className="text-xs text-gray-500 mt-1">
              {act.fecha ? new Date(act.fecha).toLocaleString() : "Sin fecha"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
