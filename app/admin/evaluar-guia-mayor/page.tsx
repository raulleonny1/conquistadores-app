"use client";
type EvaluacionActividad = {
  id: string;
  actividad: string;
  completado: boolean;
};
import React, { useState, useEffect } from "react";
import { db } from "../../../src/firebase";
import { collection, onSnapshot, query, where, addDoc, getDocs, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
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
    const actividadesPlan = tarjetaGuiaMayor.flatMap((grupo) => grupo.actividades);
    const actividadesSet = new Set(actividadesPlan);
    const CATEGORIAS_BASE = [
      "puntualidad",
      "asistencia",
      "disciplina",
      "reclutador",
      "materiales",
      "fidelidad",
      "misionero",
      "colaborador",
      "orden_cerrado",
      "tareas",
      "especialidades",
    ];

    const sumarPuntosAspirante = async (aspiranteDocId: string, delta: number) => {
      if (!aspiranteDocId || delta === 0) return;

      let pinKey = aspiranteDocId.trim();
      let nombreActual = "";
      const aspiranteSnap = await getDoc(doc(db, "aspirantesGuiaMayor", aspiranteDocId));
      if (aspiranteSnap.exists()) {
        const ad = aspiranteSnap.data();
        pinKey = String(ad.pin ?? aspiranteDocId).trim();
        nombreActual = [ad.nombre, ad.apellido].filter(Boolean).join(" ").trim() || String(ad.nombre ?? "");
      } else {
        const qAsp = query(
          collection(db, "aspirantesGuiaMayor"),
          where("pin", "==", aspiranteDocId)
        );
        const qSnap = await getDocs(qAsp);
        if (!qSnap.empty) {
          const ad = qSnap.docs[0].data();
          pinKey = String(ad.pin ?? qSnap.docs[0].id).trim();
          nombreActual = [ad.nombre, ad.apellido].filter(Boolean).join(" ").trim() || String(ad.nombre ?? "");
        }
      }

      const ref = doc(db, "calificacionesConquis", pinKey);
      const snap = await getDoc(ref);
      let puntosActuales: Record<string, number | string> = {};

      if (snap.exists()) {
        const data = snap.data();
        puntosActuales = data.puntos || {};
        if (!nombreActual) nombreActual = data.nombre || "";
      } else {
        puntosActuales = CATEGORIAS_BASE.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
      }

      const tareasActual = typeof puntosActuales.tareas === "number"
        ? puntosActuales.tareas
        : parseInt(String(puntosActuales.tareas || 0), 10) || 0;
      const tareasNuevo = Math.max(0, tareasActual + delta);

      await setDoc(ref, {
        pin: pinKey,
        nombre: nombreActual,
        puntos: {
          ...puntosActuales,
          tareas: tareasNuevo,
        },
      }, { merge: true });

      await addDoc(collection(db, "calificacionesSemanal"), {
        pin: pinKey,
        fecha: new Date().toLocaleDateString(),
        origen: "evaluacion_guia_mayor",
        evaluador,
        puntos: { tareas: delta },
        totalEvento: delta,
      });
    };

    // Guardar actividad en evaluacionesGuiaMayor
    const guardarActividad = async (actividad: string, estado: boolean) => {
      if (!aspiranteId) {
        alert("Selecciona un aspirante antes de evaluar.");
        return;
      }
      if (!evaluador.trim()) {
        alert("Ingresa el nombre del evaluador.");
        return;
      }

      const yaCompletado = !!evaluaciones.find((ev) => ev.actividad === actividad && ev.completado);
      const now = new Date();
      const fecha = now.toLocaleDateString();
      const hora = now.toLocaleTimeString();

      try {
        await addDoc(collection(db, "evaluacionesGuiaMayor"), {
          aspiranteId,
          actividad,
          completado: estado,
          evaluador: evaluador.trim(),
          fecha,
          hora,
        });

        setEvaluaciones((evals) => {
          const otros = evals.filter((ev) => ev.actividad !== actividad);
          return [
            ...otros,
            {
              aspiranteId,
              actividad,
              completado: estado,
              evaluador: evaluador.trim(),
              fecha,
              hora,
            },
          ];
        });

        const delta = estado && !yaCompletado ? 1 : (!estado && yaCompletado ? -1 : 0);
        await sumarPuntosAspirante(aspiranteId, delta);
      } catch (err) {
        console.error(err);
        alert("No se pudo guardar la evaluación. Revisa permisos y conexión.");
      }
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
      // Buscar tarjeta usando ID estable (aspiranteId) para evitar duplicados.
      let tarjetaDoc: TarjetaDoc | null = null;
      const tarjetaRef = doc(db, "tarjetaGuiaMayor", aspiranteId);
      const tarjetaByIdSnap = await getDoc(tarjetaRef);
      if (tarjetaByIdSnap.exists()) {
        tarjetaDoc = { id: tarjetaByIdSnap.id, ...(tarjetaByIdSnap.data() as Omit<TarjetaDoc, "id">) };
      } else {
        // Compatibilidad: si existen tarjetas antiguas por query, usa la primera.
        const q = query(collection(db, "tarjetaGuiaMayor"), where("aspiranteId", "==", aspiranteId));
        const snap = await getDocs(q);
        if (snap.docs.length > 0) {
          tarjetaDoc = { id: snap.docs[0].id, ...(snap.docs[0].data() as Omit<TarjetaDoc, "id">) };
        }
      }

      // Si no existe, crearla con docId = aspiranteId
      if (!tarjetaDoc) {
        const aspirante = aspirantes.find((a) => a.id === aspiranteId);
        await setDoc(tarjetaRef, {
          aspiranteId,
          nombre: aspirante?.nombre || "",
          estado: "en_proceso",
          progreso: 0,
          fechaInicio: new Date().toISOString().split("T")[0],
        });
        tarjetaDoc = {
          id: aspiranteId,
          estado: "en_proceso",
          progreso: 0,
          fechaInicio: new Date().toISOString().split("T")[0],
          nombre: aspirante?.nombre || "",
        };
        // Crear actividades base asociadas a la tarjeta
        for (const req of actividadesBase) {
          await addDoc(collection(db, "actividadesTarjetaGuiaMayor"), {
            tarjetaId: aspiranteId,
            requisito: req,
            completado: false,
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
      const evals: EvaluacionActividad[] = snapEval.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<EvaluacionActividad, "id">)
      }));
      setEvaluaciones(evals);
      // Marcar actividades completadas
      setActividades((acts) =>
        acts.map((act) => {
          const found = evals.find((ev) => ev.actividad === act.requisito && ev.completado);
          return found ? { ...act, completado: true } : { ...act, completado: false };
        })
      );
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
              const completadas = actividadesPlan.filter(
                (act) => !!evaluaciones.find((ev) => ev.actividad === act && ev.completado)
              ).length;
              const total = actividadesPlan.length;
              return (
                <div className="mb-4 font-bold text-green-700">Progreso: {completadas} / {total} requisitos</div>
              );
            })()}
            <ul className="space-y-2">
              {tarjetaGuiaMayor.map((grupo, idxGrupo) => (
                <React.Fragment key={grupo.seccion}>
                  <li className="font-bold text-indigo-600 mt-4 mb-2">{grupo.seccion}</li>
                  {grupo.actividades.map((act) => (
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
