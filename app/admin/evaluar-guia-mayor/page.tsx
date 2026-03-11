"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../src/firebase";
import { collection, onSnapshot, query, where, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { actividadesBase } from "./actividadesBase";
import { tarjetaGuiaMayor } from "../../../src/data/tarjetaGuiaMayor";

type TarjetaDoc = {
  id: string;
  estado: string;
  progreso: number;
  fechaInicio: string;
  nombre?: string;
};

const EvaluarGuiaMayorPage = () => {
    // Guardar actividad en evaluacionesGuiaMayor
    const guardarActividad = async (actividad: string, estado: boolean) => {
      await addDoc(collection(db, "evaluacionesGuiaMayor"), {
        aspiranteId,
        actividad,
        completado: estado,
        evaluador,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString()
      });
      setEvaluaciones(evals => {
        const otros = evals.filter(ev => ev.actividad !== actividad);
        return [...otros, {
          aspiranteId,
          actividad,
          completado: estado,
          evaluador,
          fecha: new Date().toLocaleDateString(),
          hora: new Date().toLocaleTimeString()
        }];
      });
    };
  const [aspirantes, setAspirantes] = useState<any[]>([]);
  const [aspiranteId, setAspiranteId] = useState("");
  const [evaluador, setEvaluador] = useState("");
  const [tarjeta, setTarjeta] = useState<TarjetaDoc | null>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "aspirantesGuiaMayor"), snap => {
      setAspirantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Detectar cambio de aspirante y cargar/crear tarjeta y actividades
  useEffect(() => {
    if (!aspiranteId) {
      setTarjeta(null);
      setActividades([]);
      return;
    }
    const fetchTarjetaYActividades = async () => {
      // Buscar tarjeta
      const q = query(collection(db, "tarjetaGuiaMayor"), where("aspiranteId", "==", aspiranteId));
      const snap = await getDocs(q);
      let tarjetaDoc: TarjetaDoc | null = snap.docs.length > 0 ? { id: snap.docs[0].id, ...(snap.docs[0].data() as Omit<TarjetaDoc, "id">) } : null;
      // Si no existe, crearla
      if (!tarjetaDoc) {
        const aspirante = aspirantes.find(a => a.id === aspiranteId);
        const nuevaTarjeta = await addDoc(collection(db, "tarjetaGuiaMayor"), {
          aspiranteId,
          nombre: aspirante?.nombre || "",
          estado: "en_proceso",
          progreso: 0,
          fechaInicio: new Date().toISOString().split("T")[0]
        });
        tarjetaDoc = { id: nuevaTarjeta.id, estado: "en_proceso", progreso: 0, fechaInicio: new Date().toISOString().split("T")[0] };
        // Crear actividades base
        for (const req of actividadesBase) {
          await addDoc(collection(db, "actividadesTarjetaGuiaMayor"), {
            tarjetaId: nuevaTarjeta.id,
            requisito: req,
            completado: false
          });
        }
      }
      setTarjeta(tarjetaDoc);
      // Cargar actividades
      const qAct = query(collection(db, "actividadesTarjetaGuiaMayor"), where("tarjetaId", "==", tarjetaDoc.id));
      const snapAct = await getDocs(qAct);
      setActividades(snapAct.docs.map(d => ({ id: d.id, ...d.data() })));
      // Cargar evaluaciones previas y marcar progreso
      const qEval = query(collection(db, "evaluacionesGuiaMayor"), where("aspiranteId", "==", aspiranteId));
      const snapEval = await getDocs(qEval);
      const evals = snapEval.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvaluaciones(evals);
      // Marcar actividades completadas
      setActividades(acts => acts.map(act => {
        const found = evals.find(ev => ev.actividad === act.requisito && ev.completado);
        return found ? { ...act, completado: true } : { ...act, completado: false };
      }));
    };
    fetchTarjetaYActividades();
  }, [aspiranteId]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-white border-l-4 border-indigo-500 rounded-xl shadow p-8 flex flex-col items-center mb-4">
        <div className="w-full flex justify-end mb-2">
          <button
            onClick={() => { window.location.href = "/"; }}
            className="bg-red-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-800 transition-all"
          >
            Cerrar sesión
          </button>
        </div>
        <h2 className="text-2xl font-bold text-indigo-700 mb-6">Evaluación Guía Mayor</h2>
        <div className="mb-6 w-full">
          <label className="block text-sm font-bold mb-2 text-indigo-700">Seleccionar Aspirante</label>
          <select
            className="border rounded-xl p-2 w-full"
            value={aspiranteId}
            onChange={e => setAspiranteId(e.target.value)}
          >
            <option value="">Seleccionar aspirante</option>
            {aspirantes.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
        <div className="mb-6 w-full">
          <label className="block text-sm font-bold mb-2 text-pink-700">Nombre del evaluador</label>
          <input
            placeholder="Nombre del evaluador"
            value={evaluador}
            onChange={e => setEvaluador(e.target.value)}
            className="border rounded-xl p-2 w-full"
          />
        </div>
        {tarjeta && (
          <div className="mb-6 w-full">
            <div className="font-bold text-indigo-700 mb-2">Aspirante: {tarjeta.nombre}</div>
            <div className="font-bold text-pink-700 mb-2">Evaluador: {evaluador}</div>
            {/* Progreso automático */}
            {(() => {
              const completadas = tarjetaGuiaMayor.filter(act => !!evaluaciones.find(ev => ev.actividad === act && ev.completado));
              const total = tarjetaGuiaMayor.length;
              return (
                <div className="mb-4 font-bold text-green-700">Progreso: {completadas.length} / {total} requisitos</div>
              );
            })()}
            <ul className="space-y-2">
              {tarjetaGuiaMayor.map((grupo, idxGrupo) => (
                <React.Fragment key={grupo.seccion}>
                  <li className="font-bold text-indigo-600 mt-4 mb-2">{grupo.seccion}</li>
                  {grupo.actividades.map((act, idxAct) => (
                    <li key={`${grupo.seccion}-${act}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!evaluaciones.find(ev => ev.actividad === act && ev.completado)}
                        onChange={e => guardarActividad(act, e.target.checked)}
                      />
                      <span className={!!evaluaciones.find(ev => ev.actividad === act && ev.completado) ? "line-through text-slate-400" : "text-slate-700"}>{act}</span>
                    </li>
                  ))}
                </React.Fragment>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluarGuiaMayorPage;
