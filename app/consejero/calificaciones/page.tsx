"use client";
import React, { useEffect, useState, Suspense } from "react";
import { db } from "../../../src/firebase";
import { collection, doc, getDoc, query, setDoc, where, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Star, Award } from "lucide-react";
import { toast } from "react-hot-toast";
import { useConsejeroPuedeCalificar } from "@/src/hooks/useConsejeroPuedeCalificar";
import ConsejeroSinPermisoCalificar from "@/src/components/consejero/ConsejeroSinPermisoCalificar";
import { storageSeguroGet } from "@/src/lib/storageSeguro";
import {
  CATEGORIAS_PUNTOS,
  sumarPuntos,
  toNumberPuntos,
} from "@/src/lib/categoriasPuntos";
import { registrarMovimientoPuntos } from "@/src/lib/actividadesCalificacion";
import QuitarPuntosPanel from "@/src/components/calificaciones/QuitarPuntosPanel";
import HistorialSemanal from "@/app/conquistadores/calificaciones/HistorialSemanal";

const CATEGORIAS = CATEGORIAS_PUNTOS;

export default function CalificacionesConsejeroPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>}>
      <CalificacionesConsejeroPageInner />
    </Suspense>
  );
}

function CalificacionesConsejeroPageInner() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("conquistador") || "";
  const [consejeroId, setConsejeroId] = useState<string | null>(null);
  const { puedeCalificar, loading: loadingPermiso } = useConsejeroPuedeCalificar(consejeroId);
  const [puntos, setPuntos] = useState<any>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  // Estados para inputs por categoría
  const [inputValores, setInputValores] = React.useState<{ [key: string]: string }>({});
  const [inputFechas, setInputFechas] = React.useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fromUrl = searchParams.get("consejeroId");
    const stored = storageSeguroGet("consejeroId");
    setConsejeroId(fromUrl || stored);
  }, [searchParams]);

  useEffect(() => {
    if (!pin || !puedeCalificar) return;

    const fetchCalificaciones = async () => {
      setLoading(true);
      const ref = doc(db, "calificacionesConquis", pin);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setPuntos(data.puntos || {});
        setNombre(data.nombre || "");
      } else {
        const initialPuntos = CATEGORIAS.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {});
        let nombreDetectado = "";
        const [miembroSnap, aspiranteSnap] = await Promise.all([
          getDocs(query(collection(db, "RegistroConquis"), where("pin", "==", pin))),
          getDocs(query(collection(db, "aspirantesGuiaMayor"), where("pin", "==", pin))),
        ]);
        if (!miembroSnap.empty) {
          nombreDetectado = miembroSnap.docs[0].data().nombre || "";
        } else if (!aspiranteSnap.empty) {
          nombreDetectado = aspiranteSnap.docs[0].data().nombre || "";
        }
        await setDoc(ref, {
          pin,
          nombre: nombreDetectado,
          puntos: initialPuntos,
        });
        setPuntos(initialPuntos);
        setNombre(nombreDetectado);
      }

      setLoading(false);
    };

    fetchCalificaciones();
  }, [pin, puedeCalificar]);

  const total = sumarPuntos(puntos);

  if (loadingPermiso || (puedeCalificar && loading)) {
    return <div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>;
  }

  if (!puedeCalificar) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ConsejeroSinPermisoCalificar consejeroId={consejeroId} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Star fill="white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{nombre || "Conquistador"}</h2>
            <p className="text-slate-500 text-sm">Evaluación de Calificaciones</p>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="text-slate-400">Volver</button>
      </div>

      {/* Resumen General */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-blue-100 text-sm uppercase tracking-wider font-semibold">Puntaje Total</p>
            <h3 className="text-5xl font-black">{Number(total)} <span className="text-xl opacity-70">pts</span></h3>
          </div>
          <div className="text-right">
            <Award size={40} className="ml-auto mb-2 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabla de Calificaciones con fecha */}
      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORIAS.map(cat => {
          const valor = toNumberPuntos(puntos[cat.id]);
          const handleInputValor = (catId: string, value: string) => {
            setInputValores(prev => ({ ...prev, [catId]: value }));
          };
          const handleInputFecha = (catId: string, value: string) => {
            setInputFechas(prev => ({ ...prev, [catId]: value }));
          };
          const handleAgregar = async (catId: string) => {
            if (!puedeCalificar) {
              toast.error("No tienes permiso para calificar.");
              return;
            }
            const inputFecha = inputFechas[catId] || "";
            const inputValor = inputValores[catId] || "";
            if (!inputFecha) {
              toast.error("Selecciona una fecha");
              return;
            }
            const valorNumerico = parseInt(inputValor, 10) || 0;
            if (valorNumerico <= 0) {
              toast.error("Ingresa puntos mayores a 0");
              return;
            }
            const res = await registrarMovimientoPuntos({
              pin,
              nombre,
              categoriaId: catId,
              cantidad: valorNumerico,
              fecha: inputFecha,
              tipo: "suma",
              origen: "consejero_individual",
              aplicadoPor: consejeroId || undefined,
            });
            if (!res.ok) {
              toast.error(res.mensaje);
              return;
            }
            setPuntos((prev: Record<string, unknown>) => ({
              ...prev,
              [catId]: res.nuevoValorCategoria,
            }));
            setInputValores(prev => ({ ...prev, [catId]: "" }));
            toast.success("Puntos agregados");
          };
          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-700">{cat.nombre}</span>
                <span className="text-sm font-bold text-blue-600">{valor} pts</span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={inputFechas[cat.id] || ""}
                  onChange={e => handleInputFecha(cat.id, e.target.value)}
                  className="border p-2 rounded w-full mb-1"
                />
                <input
                  type="number"
                  value={inputValores[cat.id] || ""}
                  onChange={e => handleInputValor(cat.id, e.target.value)}
                  placeholder="Agregar puntos"
                  className="border p-2 rounded w-full mb-1"
                />
                <button
                  onClick={() => handleAgregar(cat.id)}
                  className="bg-blue-600 text-white px-4 py-1 rounded w-full"
                >Agregar</button>
              </div>
            </div>
          );
        })}
      </div>

      <QuitarPuntosPanel
        className="mt-8"
        pin={pin}
        nombre={nombre}
        origen="consejero_resta_individual"
        aplicadoPor={consejeroId || undefined}
        onRestado={() => {
          getDoc(doc(db, "calificacionesConquis", pin)).then((snap) => {
            if (snap.exists()) setPuntos(snap.data().puntos || {});
          });
        }}
      />

      <HistorialSemanal pin={pin} />
    </div>
  );
}
