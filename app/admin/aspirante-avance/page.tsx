"use client";
import React, { useState, useEffect } from "react";
import { especialidadesBase } from "@/src/data/especialidades";
import { db } from "@/src/firebase";
import { collection, query, where, getDocs, addDoc, onSnapshot } from "firebase/firestore";

export default function AvanceAspirantePage() {
  const [aspirantes, setAspirantes] = useState<any[]>([]);
  const [aspiranteId, setAspiranteId] = useState("");
  const [aspiranteInfo, setAspiranteInfo] = useState<any | null>(null);
  const [evaluador, setEvaluador] = useState("");
  const [loading, setLoading] = useState(false);
  const [seleccionado, setSeleccionado] = useState<{aspirante: any, evaluador: string} | null>(null);
  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  useEffect(() => {
    async function fetchAspirantes() {
      const snap = await getDocs(collection(db, "aspirantesGuiaMayor"));
      setAspirantes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchAspirantes();
  }, []);

  useEffect(() => {
    if (!aspiranteId) {
      setAspiranteInfo(null);
      return;
    }
    async function fetchInfo() {
      setLoading(true);
      const q = query(collection(db, "aspirantesGuiaMayor"), where("id", "==", aspiranteId));
      const snap = await getDocs(q);
      setAspiranteInfo(snap.docs.length > 0 ? snap.docs[0].data() : null);
      setLoading(false);
    }
    fetchInfo();
  }, [aspiranteId]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="w-full flex justify-end items-center mb-2 pr-8">
        <button
          className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-red-800 transition-all"
          onClick={handleLogout}
        >Cerrar sesión</button>
      </div>
      <div className="max-w-2xl w-full bg-white border-l-4 border-indigo-500 rounded-xl shadow p-8 flex flex-col items-center mb-4">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6">Registro de Avances - Guía Mayor</h2>
        {!seleccionado && (
          <>
            <div className="mb-6 w-full">
              <label className="block text-sm font-bold mb-2 text-indigo-700">Buscar Aspirante</label>
              <select
                className="border rounded-xl p-2 w-full"
                value={aspiranteId}
                onChange={e => setAspiranteId(e.target.value)}
              >
                <option value="">Selecciona un aspirante...</option>
                {aspirantes.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre} - {a.pin}</option>
                ))}
              </select>
            </div>
            {aspiranteInfo && (
              <div className="w-full mb-6 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <h3 className="font-bold text-indigo-800 mb-2">Información del Aspirante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><span className="font-semibold">Nombre:</span> {aspiranteInfo.nombre}</div>
                  <div><span className="font-semibold">Edad:</span> {aspiranteInfo.edad}</div>
                  <div><span className="font-semibold">Club:</span> {aspiranteInfo.club}</div>
                  <div><span className="font-semibold">Unidad:</span> {aspiranteInfo.unidad}</div>
                  <div><span className="font-semibold">Cargo:</span> {aspiranteInfo.cargoActual}</div>
                  <div><span className="font-semibold">PIN:</span> {aspiranteInfo.pin}</div>
                </div>
              </div>
            )}
            <div className="mb-6 w-full">
              <label className="block text-sm font-bold mb-2 text-pink-700">Nombre del Evaluador</label>
              <input
                type="text"
                className="border rounded-xl p-2 w-full"
                value={evaluador}
                onChange={e => setEvaluador(e.target.value)}
                placeholder="Ingrese el nombre de quien evalúa"
              />
            </div>
            <button
              className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl mb-6 hover:bg-indigo-800 transition-all"
              disabled={!aspiranteInfo || !evaluador}
              onClick={() => setSeleccionado({aspirante: aspiranteInfo, evaluador})}
            >Seleccionar</button>
          </>
        )}
        {seleccionado && (
          <AvanceForm aspirante={seleccionado.aspirante} evaluador={seleccionado.evaluador} />
        )}
      </div>
    </div>
  );
}

// Formulario de avance y lista en tiempo real
function AvanceForm({ aspirante, evaluador }: { aspirante: any, evaluador: string }) {
  const [avance, setAvance] = useState("");
  const [avances, setAvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clases, setClases] = useState([
    "Amigo", "Compañero", "Explorador", "Orientador", "Viajero", "Guía"
  ]);
  const [clasesCompletadas, setClasesCompletadas] = useState<string[]>([]);
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<string[]>([]);
  useEffect(() => {
    const q = query(collection(db, "avancesAspirante"), where("aspiranteId", "==", aspirante.id));
    const unsub = onSnapshot(q, snap => {
      setAvances(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [aspirante.id]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avance.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "avancesAspirante"), {
      aspiranteId: aspirante.id,
      evaluador,
      avance,
      fecha: new Date().toISOString(),
      clasesCompletadas,
      especialidadesSeleccionadas
    });
    setAvance("");
    setLoading(false);
  };
  return (
    <>
      <div className="w-full mb-6 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
        <h3 className="font-bold text-indigo-800 mb-2">Aspirante Seleccionado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div><span className="font-semibold">Nombre:</span> {aspirante.nombre}</div>
          <div><span className="font-semibold">Edad:</span> {aspirante.edad}</div>
          <div><span className="font-semibold">Club:</span> {aspirante.club}</div>
          <div><span className="font-semibold">Unidad:</span> {aspirante.unidad}</div>
          <div><span className="font-semibold">Cargo:</span> {aspirante.cargoActual}</div>
          <div><span className="font-semibold">PIN:</span> {aspirante.pin}</div>
        </div>
      </div>
      <div className="mb-6 w-full">
        <label className="block text-sm font-bold mb-2 text-pink-700">Evaluador</label>
        <div className="border rounded-xl p-2 w-full bg-pink-50 text-pink-700 font-bold">{evaluador}</div>
      </div>
      <div className="mb-6 w-full">
        <label className="block text-sm font-bold mb-2 text-indigo-700">Clases de conquistadores completadas</label>
        <div className="flex flex-wrap gap-2">
          {clases.map(clase => (
            <label key={clase} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={clasesCompletadas.includes(clase)}
                onChange={e => {
                  if (e.target.checked) {
                    setClasesCompletadas([...clasesCompletadas, clase]);
                  } else {
                    setClasesCompletadas(clasesCompletadas.filter(c => c !== clase));
                  }
                }}
              />
              <span className="text-sm">{clase}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mb-6 w-full">
        <label className="block text-sm font-bold mb-2 text-indigo-700">Especialidades completadas</label>
        <div className="max-h-48 overflow-y-auto border rounded-xl p-2 bg-slate-50">
          {especialidadesBase.map(e => (
            <label key={e.especialidad} className="flex items-center gap-1 mb-1">
              <input
                type="checkbox"
                checked={especialidadesSeleccionadas.includes(e.especialidad)}
                onChange={ev => {
                  if (ev.target.checked) {
                    setEspecialidadesSeleccionadas([...especialidadesSeleccionadas, e.especialidad]);
                  } else {
                    setEspecialidadesSeleccionadas(especialidadesSeleccionadas.filter(es => es !== e.especialidad));
                  }
                }}
              />
              <span className="text-xs">{e.especialidad} <span className="text-slate-400">({e.area}/{e.categoria})</span></span>
            </label>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mb-6 w-full flex gap-2">
        <input
          type="text"
          className="border rounded-xl p-2 flex-1"
          value={avance}
          onChange={e => setAvance(e.target.value)}
          placeholder="Describe el avance realizado"
        />
        <button
          type="submit"
          className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-green-800 transition-all"
          disabled={loading || !avance.trim()}
        >Registrar</button>
      </form>
      <div className="w-full">
        <h4 className="font-bold text-indigo-700 mb-2">Avances Registrados</h4>
        <ul className="space-y-2">
          {avances.map(a => (
            <li key={a.id} className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="font-semibold text-green-700">{a.avance}</div>
              <div className="text-xs text-slate-400">{a.fecha}</div>
              <div className="text-xs text-pink-700">Evaluador: {a.evaluador}</div>
              {a.clasesCompletadas && (
                <div className="text-xs text-indigo-700 mt-1">Clases completadas: {Array.isArray(a.clasesCompletadas) ? a.clasesCompletadas.join(", ") : a.clasesCompletadas}</div>
              )}
              {a.especialidadesSeleccionadas && (
                <div className="text-xs text-indigo-700 mt-1">Especialidades: {Array.isArray(a.especialidadesSeleccionadas) ? a.especialidadesSeleccionadas.join(", ") : a.especialidadesSeleccionadas}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
