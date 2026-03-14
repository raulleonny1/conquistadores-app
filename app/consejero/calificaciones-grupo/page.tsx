"use client";
import React, { useEffect, useState, Suspense } from "react";
import { db } from "../../../src/firebase";
import { collection, doc, getDocs, setDoc, query, where } from "firebase/firestore";
import { useSearchParams, usePathname } from "next/navigation";

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

function CalificacionesGrupoPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const unidad = searchParams.get("unidad") || "";
  let consejeroId = searchParams.get("consejeroId") || "";
  // Si no hay consejeroId en searchParams, extraerlo del pathname
  if (!consejeroId) {
    const match = pathname.match(/consejero\/(\w+)/);
    if (match && match[1]) {
      consejeroId = match[1];
    }
  }
  useEffect(() => {
    if (consejeroId) {
      localStorage.setItem("consejeroId", consejeroId);
    } else {
      const storedId = localStorage.getItem("consejeroId");
      if (storedId) consejeroId = storedId;
    }
  }, [consejeroId]);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [puntos, setPuntos] = useState("");
  const [seleccionados, setSeleccionados] = useState<{ [pin: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unidad) return;
    const fetchMiembros = async () => {
      const q = query(collection(db, "RegistroConquis"), where("unidad", "==", unidad));
      const snap = await getDocs(q);
      setMiembros(snap.docs.map(doc => ({ pin: doc.data().pin, nombre: doc.data().nombre })));
      setLoading(false);
    };
    fetchMiembros();
  }, [unidad]);

  const handleCheck = (pin: string, checked: boolean) => {
    setSeleccionados(prev => ({ ...prev, [pin]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !fecha || !puntos) return alert("Completa todos los campos");
    const pins = Object.keys(seleccionados).filter(pin => seleccionados[pin]);
    if (pins.length === 0) return alert("Selecciona al menos un conquistador");
    for (const pin of pins) {
      const ref = doc(db, "calificacionesConquis", pin);
      // Obtener puntos actuales
      const snap = await getDocs(query(collection(db, "calificacionesConquis"), where("pin", "==", pin)));
      let puntosActuales: { [key: string]: number } = {};
      if (snap.docs.length > 0) {
        puntosActuales = snap.docs[0].data().puntos || {};
      } else {
        puntosActuales = CATEGORIAS_PUNTOS.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {});
      }
      // Sumar puntos
      const nuevosPuntos: { [key: string]: number } = { ...puntosActuales, [categoria]: (puntosActuales[categoria] || 0) + parseInt(puntos) };
      await setDoc(ref, {
        puntos: nuevosPuntos,
        fechaUltima: fecha
      }, { merge: true });
    }
    alert("Puntos agregados a los seleccionados");
    setCategoria("");
    setFecha("");
    setPuntos("");
    setSeleccionados({});
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-800 transition-all"
        onClick={() => window.history.back()}
      >
        ← Regresar al dashboard
      </button>
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Calificar en grupo - Unidad: {unidad}</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border p-2 rounded w-full md:w-1/3">
            <option value="">Selecciona categoría</option>
            {CATEGORIAS_PUNTOS.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border p-2 rounded w-full md:w-1/3" />
          <input type="number" value={puntos} onChange={e => setPuntos(e.target.value)} placeholder="Puntos" className="border p-2 rounded w-full md:w-1/3" />
        </div>
        <div className="mt-4">
          <div className="font-bold mb-2 text-blue-600">Selecciona conquistadores:</div>
          {loading ? <div className="text-blue-500">Cargando miembros...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {miembros.map(m => (
                <label key={m.pin} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <input
                    type="checkbox"
                    checked={!!seleccionados[m.pin]}
                    onChange={e => handleCheck(m.pin, e.target.checked)}
                  />
                  <span className="font-medium text-blue-700">{m.nombre} <span className="text-xs text-slate-500">({m.pin})</span></span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold mt-4">Calificar grupo</button>
      </form>
    </div>
  );
}

const CalificacionesGrupoPageWrapper = () => (
  <Suspense fallback={<div className="text-center mt-10 text-lg text-blue-700">Cargando datos...</div>}>
    <CalificacionesGrupoPage />
  </Suspense>
);

export default CalificacionesGrupoPageWrapper;
