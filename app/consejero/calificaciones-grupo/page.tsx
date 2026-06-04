"use client";
import React, { useEffect, useState, Suspense } from "react";
import { toast } from "react-hot-toast";
import { handleError } from "@/src/lib/errorHandler";
import { db } from "../../../src/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useSearchParams, usePathname } from "next/navigation";
import { useConsejeroPuedeCalificar } from "@/src/hooks/useConsejeroPuedeCalificar";
import ConsejeroSinPermisoCalificar from "@/src/components/consejero/ConsejeroSinPermisoCalificar";
import { storageSeguroGet, storageSeguroSet } from "@/src/lib/storageSeguro";
import { aplicarCalificacionCategoriaUnidad } from "@/src/lib/actividadesCalificacion";

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
  { id: "especialidades", nombre: "Especialidades" },
];

function CalificacionesGrupoPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const unidad = searchParams.get("unidad") || "";
  let consejeroId = searchParams.get("consejeroId") || "";
  if (!consejeroId) {
    const match = pathname.match(/consejero\/(\w+)/);
    if (match && match[1]) {
      consejeroId = match[1];
    }
  }
  const [consejeroIdState, setConsejeroIdState] = useState(consejeroId);
  useEffect(() => {
    if (consejeroId) {
      storageSeguroSet("consejeroId", consejeroId);
      setConsejeroIdState(consejeroId);
    } else {
      const storedId = storageSeguroGet("consejeroId");
      if (storedId) setConsejeroIdState(storedId);
    }
  }, [consejeroId]);
  const [miembros, setMiembros] = useState<{ pin: string; nombre: string }[]>([]);
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [puntos, setPuntos] = useState("");
  const [seleccionados, setSeleccionados] = useState<{ [pin: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { puedeCalificar, loading: loadingPermiso } = useConsejeroPuedeCalificar(
    consejeroIdState || null
  );

  useEffect(() => {
    if (!unidad || !puedeCalificar) return;
    const fetchMiembros = async () => {
      const q = query(collection(db, "RegistroConquis"), where("unidad", "==", unidad));
      const snap = await getDocs(q);
      setMiembros(
        snap.docs.map((doc) => ({
          pin: doc.data().pin,
          nombre: doc.data().nombre,
        }))
      );
      setLoading(false);
    };
    fetchMiembros();
  }, [unidad, puedeCalificar]);

  const handleCheck = (pin: string, checked: boolean) => {
    setSeleccionados((prev) => ({ ...prev, [pin]: checked }));
  };

  const marcarTodos = (valor: boolean) => {
    const next: Record<string, boolean> = {};
    for (const m of miembros) next[m.pin] = valor;
    setSeleccionados(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeCalificar) {
      toast.error("No tienes permiso para calificar. Contacta al administrador.");
      return;
    }
    if (!categoria || !fecha || !puntos) {
      toast.error("Completa todos los campos");
      return;
    }
    const pins = Object.keys(seleccionados).filter((pin) => seleccionados[pin]);
    if (pins.length === 0) {
      toast.error("Selecciona al menos un conquistador como referencia");
      return;
    }

    const cat = CATEGORIAS_PUNTOS.find((c) => c.id === categoria);
    if (!cat) {
      toast.error("Categoría inválida");
      return;
    }

    const puntosAgregar = parseInt(puntos, 10);
    if (!Number.isFinite(puntosAgregar) || puntosAgregar <= 0) {
      toast.error("Ingresa puntos válidos mayores a 0");
      return;
    }

    const [d, m, y] = fecha.split("-");
    const fechaFmt = `${d}/${m}/${y}`;

    setGuardando(true);
    try {
      const res = await aplicarCalificacionCategoriaUnidad({
        unidad,
        categoriaId: cat.id,
        categoriaNombre: cat.nombre,
        cantidad: puntosAgregar,
        fecha: fechaFmt,
        origen: "consejero_grupal",
        miembrosEnUnidad: pins.length,
        aplicadoPor: consejeroIdState || undefined,
      });

      if (!res.ok) {
        toast.error(res.mensaje);
        return;
      }

      toast.success(
        `Unidad «${unidad}»: +${puntosAgregar} pts (${cat.nombre}). Total unidad: ${res.totalPuntos} pts.`
      );
      setCategoria("");
      setFecha("");
      setPuntos("");
      setSeleccionados({});
    } catch (error) {
      handleError(error, "Error al guardar calificaciones");
    } finally {
      setGuardando(false);
    }
  };

  if (loadingPermiso) {
    return <div className="text-center mt-10 text-lg text-blue-700">Cargando...</div>;
  }

  if (!puedeCalificar) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <ConsejeroSinPermisoCalificar consejeroId={consejeroIdState || null} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-800 transition-all"
        onClick={() => window.history.back()}
      >
        ← Regresar al dashboard
      </button>
      <h2 className="text-2xl font-bold mb-2 text-blue-700">
        Calificar unidad: {unidad}
      </h2>
      <p className="mb-4 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
        Los puntos se suman al <strong>total de la unidad</strong>, no a cada checkbox. Marca quién
        participó como referencia.
      </p>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 shadow-md mb-8 flex flex-col gap-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border p-2 rounded w-full md:w-1/3"
          >
            <option value="">Selecciona categoría</option>
            {CATEGORIAS_PUNTOS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border p-2 rounded w-full md:w-1/3"
          />
          <input
            type="number"
            value={puntos}
            onChange={(e) => setPuntos(e.target.value)}
            placeholder="Puntos"
            className="border p-2 rounded w-full md:w-1/3"
          />
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="font-bold text-blue-600">Participantes (referencia):</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => marcarTodos(true)}
                className="text-xs font-bold text-cyan-700 underline"
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={() => marcarTodos(false)}
                className="text-xs font-bold text-slate-600 underline"
              >
                Desmarcar
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-blue-500">Cargando miembros...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {miembros.map((m) => (
                <label
                  key={m.pin}
                  className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2"
                >
                  <input
                    type="checkbox"
                    checked={!!seleccionados[m.pin]}
                    onChange={(e) => handleCheck(m.pin, e.target.checked)}
                  />
                  <span className="font-medium text-blue-700">
                    {m.nombre}{" "}
                    <span className="text-xs text-slate-500">({m.pin})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold mt-4 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Sumar puntos a la unidad"}
        </button>
      </form>
    </div>
  );
}

const CalificacionesGrupoPageWrapper = () => (
  <Suspense
    fallback={<div className="text-center mt-10 text-lg text-blue-700">Cargando datos...</div>}
  >
    <CalificacionesGrupoPage />
  </Suspense>
);

export default CalificacionesGrupoPageWrapper;
