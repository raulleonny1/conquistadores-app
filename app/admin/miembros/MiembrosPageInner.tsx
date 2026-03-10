"use client";


import React, { useEffect, useState } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function MiembrosPageInner() {
  const [miembros, setMiembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    unidad: "",
    pin: "",
    clase: "",
    especialidades: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = collection(db, "conquistadores");
    const unsub = onSnapshot(q, (snapshot) => {
      setMiembros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "conquistadores"), form);
      setForm({ nombre: "", unidad: "", pin: "", clase: "", especialidades: "" });
    } catch (err) {
      alert("Error al registrar miembro");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 px-4 py-8">
      <h2 className="text-2xl font-black mb-6 text-indigo-700 text-center">Gestión de Miembros</h2>
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => window.location.href = "/admin"}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
        >
          Regresar al menú
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-md border border-slate-200 mb-8 max-w-xl mx-auto">
        <h3 className="text-xl font-bold mb-4 text-indigo-700">Registrar nuevo miembro</h3>
        <div className="grid grid-cols-1 gap-4">
          <input name="nombre" value={form.nombre} onChange={handleInput} required placeholder="Nombre" className="border rounded-lg px-4 py-2" />
          <input name="unidad" value={form.unidad} onChange={handleInput} required placeholder="Unidad" className="border rounded-lg px-4 py-2" />
          <input name="pin" value={form.pin} onChange={handleInput} required placeholder="PIN" className="border rounded-lg px-4 py-2" />
          <input name="clase" value={form.clase} onChange={handleInput} required placeholder="Clase" className="border rounded-lg px-4 py-2" />
          <input name="especialidades" value={form.especialidades} onChange={handleInput} placeholder="Especialidades (separadas por coma)" className="border rounded-lg px-4 py-2" />
        </div>
        <button type="submit" disabled={saving} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
          {saving ? "Guardando..." : "Registrar"}
        </button>
      </form>
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold mb-4 text-blue-700">Miembros registrados</h3>
        {loading ? (
          <div className="text-center text-blue-700">Cargando miembros...</div>
        ) : miembros.length === 0 ? (
          <div className="text-center text-red-700">No hay miembros registrados.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-2 py-1">Nombre</th>
                <th className="px-2 py-1">Unidad</th>
                <th className="px-2 py-1">PIN</th>
                <th className="px-2 py-1">Clase</th>
                <th className="px-2 py-1">Especialidades</th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="px-2 py-1 font-semibold">{m.nombre}</td>
                  <td className="px-2 py-1">{m.unidad}</td>
                  <td className="px-2 py-1">{m.pin}</td>
                  <td className="px-2 py-1">{m.clase}</td>
                  <td className="px-2 py-1">
                    {m.especialidades ? m.especialidades.split(',').map((e: string, i: number) => <span key={i} className="inline-block bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 text-xs mr-1">{e.trim()}</span>) : <span className="text-slate-400 text-xs">Sin especialidades</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
