"use client";
import React, { useState, useEffect } from "react";
import { db, formatFechaDDMMYYYY } from "../../../src/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

type CalificacionCatalogo = {
  id: string;
  nombre?: string;
  puntos?: string | number;
  fecha?: string;
  pin?: string;
};

function esCatalogoAdmin(data: Record<string, unknown>): boolean {
  const pin = data.pin;
  return pin === undefined || pin === null || String(pin).trim() === "";
}

export default function CalificacionesPage() {
  const [nombre, setNombre] = useState("");
  const [puntos, setPuntos] = useState("");
  const [loading, setLoading] = useState(false);
  const [calificaciones, setCalificaciones] = useState<CalificacionCatalogo[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPuntos, setEditPuntos] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "calificaciones"),
      (snapshot) => {
        const lista = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as CalificacionCatalogo))
          .filter((c) => esCatalogoAdmin(c as Record<string, unknown>));
        lista.sort((a, b) => {
          const fa = a.fecha || "";
          const fb = b.fecha || "";
          return fb.localeCompare(fa);
        });
        setCalificaciones(lista);
      },
      (err) => {
        console.error(err);
        toast.error("No se pudo cargar la lista de calificaciones.");
      }
    );
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!nombre.trim() || !puntos.trim()) {
      toast.error("Escribe nombre y puntos antes de agregar.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "calificaciones"), {
        nombre: nombre.trim(),
        puntos: puntos.trim(),
        fecha: formatFechaDDMMYYYY(new Date()),
      });
      setNombre("");
      setPuntos("");
      toast.success("Calificación agregada. Aparece abajo al instante.");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar en Firebase.");
    }
    setLoading(false);
  };

  const handleEdit = (calificacion: CalificacionCatalogo) => {
    setEditId(calificacion.id);
    setEditNombre(calificacion.nombre || "");
    setEditPuntos(String(calificacion.puntos ?? ""));
  };

  const handleEditSave = async () => {
    if (!editId) return;
    if (!editNombre.trim() || !editPuntos.trim()) {
      toast.error("Nombre y puntos son obligatorios.");
      return;
    }
    try {
      await updateDoc(doc(db, "calificaciones", editId), {
        nombre: editNombre.trim(),
        puntos: editPuntos.trim(),
      });
      setEditId(null);
      setEditNombre("");
      setEditPuntos("");
      toast.success("Calificación actualizada.");
    } catch {
      toast.error("Error al actualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta calificación del catálogo?")) return;
    try {
      await deleteDoc(doc(db, "calificaciones", id));
      toast.success("Eliminada.");
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-xl px-4 pb-12">
      <button
        type="button"
        onClick={() => {
          window.location.href = "/admin";
        }}
        className="mb-6 rounded-xl bg-indigo-600 px-6 py-2 font-bold text-white transition-all hover:bg-indigo-800"
      >
        <ArrowLeft className="mr-2 inline" /> Retornar a Admin
      </button>
      <h1 className="mb-2 text-2xl font-bold">Registrar calificaciones</h1>
      <p className="mb-6 text-sm text-slate-600">
        Escribe nombre y puntos, pulsa agregar y se guarda en Firebase. El listado de abajo se
        actualiza al instante.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
        className="mb-8 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          placeholder="Nombre de lo que se va a calificar"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-lg border p-2"
          disabled={loading}
        />
        <input
          placeholder="Puntos"
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
          className="w-full rounded-lg border p-2"
          type="number"
          min={0}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2 font-bold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          <PlusCircle size={18} />
          {loading ? "Guardando…" : "Agregar a la lista"}
        </button>
      </form>

      <div className="mb-8">
        <h2 className="mb-2 font-bold">
          Calificaciones en el sistema ({calificaciones.length})
        </h2>
        {calificaciones.length === 0 ? (
          <p className="text-sm italic text-slate-400">
            Aún no hay ítems. Agrega uno con el botón de arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {calificaciones.map((calificacion) => (
              <li
                key={calificacion.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                {editId === calificacion.id ? (
                  <>
                    <input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="rounded border p-1"
                    />
                    <input
                      value={editPuntos}
                      onChange={(e) => setEditPuntos(e.target.value)}
                      className="w-20 rounded border p-1"
                      type="number"
                    />
                    <button
                      type="button"
                      onClick={handleEditSave}
                      className="rounded bg-green-600 px-2 py-1 text-white"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded bg-gray-400 px-2 py-1 text-white"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-indigo-700">
                      {calificacion.nombre}
                    </span>
                    <span className="rounded-lg bg-indigo-100 px-3 py-1 font-bold text-indigo-800">
                      {calificacion.puntos} pts
                    </span>
                    {calificacion.fecha && (
                      <span className="text-xs text-slate-500">{calificacion.fecha}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(calificacion)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(calificacion.id)}
                      className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-800"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
