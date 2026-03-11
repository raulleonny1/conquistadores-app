"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";

export default function CalendarioComponent() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    fecha: "",
    lugar: "",
    observacion: ""
  });

  useEffect(() => {
    const q = collection(db, "eventos");
    const unsub = onSnapshot(q, (snapshot) => {
      setEventos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowForm(true);
    setForm({ ...form, fecha: date });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { formatFechaDDMMYYYY } = await import("@/src/firebase");
      const eventoForm = { ...form, fecha: formatFechaDDMMYYYY(new Date(form.fecha)) };
      await addDoc(collection(db, "eventos"), eventoForm);
      setShowForm(false);
      setForm({ nombre: "", fecha: "", lugar: "", observacion: "" });
    } catch (err) {
      alert("Error al guardar evento");
    }
  };

  // Simple calendario visual
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-emerald-700 mb-2">Calendario</h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            return (
              <button
                key={day}
                className="bg-emerald-100 hover:bg-emerald-300 text-emerald-700 rounded-lg p-2 font-bold"
                onClick={() => handleDateSelect(dateStr)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 mb-8 border border-slate-200">
          <h4 className="text-lg font-bold mb-4 text-emerald-700">Agregar Evento</h4>
          <div className="mb-2">
            <label className="block text-sm font-semibold mb-1">Nombre del evento</label>
            <input name="nombre" value={form.nombre} onChange={handleInput} required className="border rounded-lg px-4 py-2 w-full" />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold mb-1">Fecha</label>
            <input name="fecha" value={form.fecha} onChange={handleInput} required className="border rounded-lg px-4 py-2 w-full" type="date" />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold mb-1">Lugar</label>
            <input name="lugar" value={form.lugar} onChange={handleInput} required className="border rounded-lg px-4 py-2 w-full" />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-semibold mb-1">Observación</label>
            <textarea name="observacion" value={form.observacion} onChange={handleInput} className="border rounded-lg px-4 py-2 w-full" />
          </div>
          <button type="submit" className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all">Guardar Evento</button>
        </form>
      )}
      <div className="bg-white rounded-2xl shadow p-6 border border-slate-200">
        <h4 className="text-lg font-bold mb-4 text-emerald-700">Eventos Registrados</h4>
        {eventos.length === 0 ? (
          <div className="text-center text-slate-400">No hay eventos registrados.</div>
        ) : (
          <ul>
            {eventos.map(ev => (
              <li key={ev.id} className="mb-4 border-b pb-2">
                <div className="font-bold text-emerald-700">{ev.nombre}</div>
                <div className="text-sm text-slate-600">Fecha: {ev.fecha}</div>
                <div className="text-sm text-slate-600">Lugar: {ev.lugar}</div>
                <div className="text-sm text-slate-600">Observación: {ev.observacion}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => window.location.href = "/admin"}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
        >
          Regresar al menú
        </button>
      </div>
    </div>
  );
}
