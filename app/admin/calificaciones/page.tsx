"use client";
import React, { useState } from "react";
import { db } from "../../../src/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ArrowLeft, PlusCircle } from "lucide-react";

export default function CalificacionesPage() {
  const [nombre, setNombre] = useState("");
  const [puntos, setPuntos] = useState("");
  const [items, setItems] = useState<{ nombre: string; puntos: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    if (!nombre || !puntos) return;
    setItems([...items, { nombre, puntos }]);
    setNombre("");
    setPuntos("");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const item of items) {
        const { formatFechaDDMMYYYY } = await import("../../../src/firebase");
        await addDoc(collection(db, "calificaciones"), {
          nombre: item.nombre,
          puntos: item.puntos,
          fecha: formatFechaDDMMYYYY(new Date())
        });
      }
      alert("Calificaciones guardadas correctamente.");
      setItems([]);
    } catch (err) {
      alert("Error al guardar calificaciones.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <button
        onClick={() => window.location.href = '/admin'}
        className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl mb-6 hover:bg-indigo-800 transition-all"
      >
        <ArrowLeft className="inline mr-2" /> Retornar a Admin
      </button>
      <h1 className="text-2xl font-bold mb-6">Registrar Calificaciones</h1>
      <form
        onSubmit={e => { e.preventDefault(); handleAdd(); }}
        className="space-y-3 mb-8"
      >
        <input
          placeholder="Nombre de lo que se va a calificar"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          placeholder="Puntos"
          value={puntos}
          onChange={e => setPuntos(e.target.value)}
          className="border p-2 w-full"
          type="number"
        />
        <button type="submit" className="bg-amber-700 text-white px-4 py-2 rounded flex items-center gap-2">
          <PlusCircle size={18} /> Agregar
        </button>
      </form>
      <div className="mb-8">
        <h2 className="font-bold mb-2">Lista de calificaciones a registrar:</h2>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-4 items-center">
              <span className="font-semibold text-indigo-700">{item.nombre}</span>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-bold">{item.puntos} puntos</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleSave}
        className="bg-green-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-900 transition-all"
        disabled={loading || items.length === 0}
      >
        Guardar en el sistema
      </button>
    </div>
  );
}
