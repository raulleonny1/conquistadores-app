"use client";
import React, { useState } from "react";
import { db } from "../../../src/firebase";
import { collection, setDoc, doc } from "firebase/firestore";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub } from "@/src/lib/clubScope";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit3,
  Clock,
  Calendar,
  BellRing
} from "lucide-react";

const dias = [
  { id: "lun", name: "Lunes", color: "from-blue-400 to-blue-600" },
  { id: "mar", name: "Martes", color: "from-indigo-400 to-indigo-600" },
  { id: "mie", name: "Miércoles", color: "from-violet-400 to-violet-600" },
  { id: "jue", name: "Jueves", color: "from-purple-400 to-purple-600" },
  { id: "vie", name: "Viernes", color: "from-pink-400 to-pink-600" },
  { id: "sab", name: "Sábado", color: "from-rose-400 to-rose-600" },
  { id: "dom", name: "Domingo", color: "from-orange-400 to-orange-600" }
];

export default function FrasesSemanaPage() {
  const { clubId } = useClubActivo();
  const [frases, setFrases] = useState(Array(7).fill({ frase: "", hora: "" }));
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleChange = (idx: number, key: "frase" | "hora", value: string) => {
    if (key === "frase" && value.length > 100) return;
    setFrases(frases.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const handleSave = async () => {
    if (!clubId) {
      alert("Sesión de club no válida.");
      return;
    }
    try {
      await setDoc(doc(collection(db, "frasesSemana"), clubId), datosConClub({
        frases: dias.map((dia, idx) => ({ dia: dia.name, frase: frases[idx].frase, hora: frases[idx].hora }))
      }, clubId));
      alert("Frases guardadas y notificadas a los conquistadores.");
    } catch (err) {
      alert("Error al guardar frases");
    }
  };

  const handleEdit = (idx: number) => setEditIndex(idx);
  const handleDelete = (idx: number) => setFrases(frases.map((f, i) => i === idx ? { frase: "", hora: "" } : f));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Navbar / Header Area */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium text-sm" onClick={() => window.location.href = "/admin"}>
            <ArrowLeft size={18} />
            Regresar al menú
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Calendar size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Panel de Administración</h1>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Hero Section */}
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Frases para la Semana</h2>
          <p className="text-slate-500">Configura los mensajes automáticos y sus horarios de notificación para cada día.</p>
        </div>

        {/* Days List */}
        <div className="space-y-4">
          {dias.map((day, idx) => (
            <div 
              key={day.id}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Day Label */}
                <div className="flex items-center gap-3 sm:w-32">
                  <div className={`h-10 w-2 rounded-full bg-linear-to-b ${day.color}`}></div>
                  <span className="font-bold text-slate-700 text-lg">{day.name}</span>
                </div>

                {/* Input Area */}
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Escribe la frase motivacional aquí..."
                    value={frases[idx].frase}
                    onChange={e => handleChange(idx, "frase", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all pr-12 text-slate-700 placeholder:text-slate-400"
                    maxLength={100}
                    disabled={editIndex !== null && editIndex !== idx}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-mono">
                    {frases[idx].frase.length}/100
                  </div>
                </div>

                {/* Time & Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative group/time flex-1 sm:flex-none">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/time:text-indigo-500" size={16} />
                    <input 
                      type="time" 
                      value={frases[idx].hora}
                      onChange={e => handleChange(idx, "hora", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-600 font-medium cursor-pointer"
                      disabled={editIndex !== null && editIndex !== idx}
                    />
                  </div>

                  <div className="flex gap-2">
                    {editIndex === idx ? (
                      <button className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-200" onClick={() => setEditIndex(null)} title="Guardar" type="button">
                        Guardar
                      </button>
                    ) : (
                      <>
                        <button className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-200" title="Editar" type="button" onClick={() => handleEdit(idx)}>
                          <Edit3 size={18} />
                        </button>
                        <button className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-200" title="Eliminar" type="button" onClick={() => handleDelete(idx)}>
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 sticky bottom-6">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700">
            <div className="flex items-center gap-3 text-slate-300 px-2">
              <BellRing size={20} className="text-indigo-400 animate-pulse" />
              <p className="text-sm font-medium">Las notificaciones se enviarán a la hora configurada.</p>
            </div>
            <button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
              <Save size={20} />
              Guardar y Notificar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
