"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import RetoMiembroEditor from "./RetoMiembroEditor";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";

export default function CalendarioComponent() {
  const { clubId } = useClubActivo();
    const [editId, setEditId] = useState<string | null>(null);
    // Manejar edición
    const handleEdit = (ev: any) => {
      setShowForm(true);
      setEditId(ev.id);
      setForm({
        nombre: ev.nombre || "",
        fecha: ev.fecha ? ev.fecha.split("/").reverse().join("-") : "",
        hora: ev.hora || "",
        lugar: ev.lugar || "",
        observacion: ev.observacion || ""
      });
    };
    // Manejar eliminación
    const handleDelete = async (id: string) => {
      if (window.confirm("¿Eliminar este evento?")) {
        await deleteDoc(doc(db, "eventos", id));
      }
    };
  const [eventos, setEventos] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    fecha: "",
    hora: "",
    lugar: "",
    observacion: ""
  });
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  useEffect(() => {
    const q = queryColeccionClub("eventos", clubId);
    if (!q) return;
    const unsub = onSnapshot(q, (snapshot) => {
      setEventos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [clubId]);

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
      // Formato día/mes/año
      const fechaObj = new Date(form.fecha);
      const dia = fechaObj.getDate().toString().padStart(2, "0");
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, "0");
      const año = fechaObj.getFullYear();
      const fechaFormateada = `${dia}/${mes}/${año}`;
      const eventoForm = { ...form, fecha: fechaFormateada };
      if (editId) {
        await updateDoc(doc(db, "eventos", editId), eventoForm);
        setEditId(null);
      } else {
        if (!clubId) {
          alert("Sesión de club no válida.");
          return;
        }
        await addDoc(collection(db, "eventos"), datosConClub(eventoForm, clubId));
      }
      setShowForm(false);
      setForm({ nombre: "", fecha: "", hora: "", lugar: "", observacion: "" });
    } catch (err) {
      alert("Error al guardar evento");
    }
  };

  // Lógica de calendario real
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  // Calcular cantidad de días del mes seleccionado
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  // Calcular el primer día de la semana del mes
  const firstDayWeek = new Date(selectedYear, selectedMonth, 1).getDay();
  // Crear array de celdas para la cuadrícula
  const calendarCells = [];
  for (let i = 0; i < firstDayWeek; i++) {
    calendarCells.push(null); // Espacios vacíos antes del primer día
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <RetoMiembroEditor />

      <div className="mb-8">
        <h3 className="text-xl font-bold text-emerald-700 mb-2">Calendario</h3>
        <div className="flex items-center gap-4 mb-4">
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border rounded-lg px-2 py-1">
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
          </select>
          <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} min={2000} max={2100} className="border rounded-lg px-2 py-1 w-20" />
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {/* Días de la semana */}
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(dia => (
            <div key={dia} className="text-xs font-bold text-emerald-700 text-center">{dia}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell, idx) => {
            if (cell === null) {
              return <div key={idx} />;
            }
            const dateStr = `${selectedYear}-${(selectedMonth+1).toString().padStart(2, "0")}-${cell.toString().padStart(2, "0")}`;
            // Resaltar el día actual
            const isToday =
              cell === today.getDate() &&
              selectedMonth === today.getMonth() &&
              selectedYear === today.getFullYear();
            return (
              <button
                key={dateStr}
                className={`font-bold p-2 rounded-lg ${isToday ? "bg-orange-400 text-white border-2 border-orange-700" : "bg-emerald-100 hover:bg-emerald-300 text-emerald-700"}`}
                onClick={() => handleDateSelect(dateStr)}
              >
                {cell}
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
            <label className="block text-sm font-semibold mb-1">Hora</label>
            <input name="hora" value={form.hora} onChange={handleInput} required className="border rounded-lg px-4 py-2 w-full" type="time" />
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
                <div className="text-sm text-slate-600">Hora: {ev.hora}</div>
                <div className="text-sm text-slate-600">Lugar: {ev.lugar}</div>
                <div className="text-sm text-slate-600">Observación: {ev.observacion}</div>
                <div className="flex gap-2 mt-2">
                  <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700" onClick={() => handleEdit(ev)}>Editar</button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700" onClick={() => handleDelete(ev.id)}>Eliminar</button>
                </div>
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
