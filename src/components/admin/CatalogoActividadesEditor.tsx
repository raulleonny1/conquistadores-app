"use client";

import React, { useEffect, useState } from "react";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import {
  esCatalogoPrograma,
  type ProgramaCatalogo,
} from "@/src/lib/actividadesCalificacion";
import { toNumberPuntos } from "@/src/lib/categoriasPuntos";

type ItemCatalogo = {
  id: string;
  nombre?: string;
  puntos?: string | number;
};

type CatalogoActividadesEditorProps = {
  clubId: string;
  programa: Extract<ProgramaCatalogo, "aventureros" | "ja">;
  color: "amber" | "violet";
};

export default function CatalogoActividadesEditor({
  clubId,
  programa,
  color,
}: CatalogoActividadesEditorProps) {
  const [nombre, setNombre] = useState("");
  const [puntos, setPuntos] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPuntos, setEditPuntos] = useState("");

  const btnAdd = color === "amber" ? "bg-amber-600 hover:bg-amber-700" : "bg-violet-600 hover:bg-violet-700";
  const accent = color === "amber" ? "text-amber-800" : "text-violet-800";

  useEffect(() => {
    const q = queryColeccionClub("calificaciones", clubId);
    if (!q) return;
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ItemCatalogo))
        .filter((c) => esCatalogoPrograma(c as Record<string, unknown>, programa));
      lista.sort((a, b) => (b.nombre || "").localeCompare(a.nombre || "", "es"));
      setItems(lista);
    });
    return () => unsub();
  }, [clubId, programa]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !puntos.trim()) {
      toast.error("Escribe nombre y puntos.");
      return;
    }
    if (!clubId) {
      toast.error("Sesión de club no válida.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(
        collection(db, "calificaciones"),
        datosConClub(
          {
            nombre: nombre.trim(),
            puntos: puntos.trim(),
            fecha: formatFechaDDMMYYYY(new Date()),
            programa,
          },
          clubId
        )
      );
      setNombre("");
      setPuntos("");
      toast.success("Actividad agregada al catálogo.");
    } catch {
      toast.error("No se pudo guardar.");
    }
    setLoading(false);
  };

  const handleEditSave = async (id: string) => {
    if (!editNombre.trim() || !editPuntos.trim()) {
      toast.error("Nombre y puntos son obligatorios.");
      return;
    }
    try {
      await updateDoc(doc(db, "calificaciones", id), {
        nombre: editNombre.trim(),
        puntos: editPuntos.trim(),
      });
      setEditId(null);
      toast.success("Actividad actualizada.");
    } catch {
      toast.error("Error al actualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta actividad del catálogo?")) return;
    try {
      await deleteDoc(doc(db, "calificaciones", id));
      toast.success("Eliminada.");
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className={`mb-1 font-bold ${accent}`}>Catálogo de actividades</h2>
      <p className="mb-4 text-xs text-slate-500">
        Agrega actividades propias de este programa. Solo aparecen aquí, no en Conquistadores.
      </p>

      <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la actividad"
          className="min-w-[140px] flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <input
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
          placeholder="Puntos"
          type="number"
          min={1}
          className="w-24 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50 ${btnAdd}`}
        >
          <PlusCircle className="h-4 w-4" />
          Agregar
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Aún no hay actividades. Crea la primera arriba.</p>
      ) : (
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              {editId === item.id ? (
                <>
                  <input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                  />
                  <input
                    value={editPuntos}
                    onChange={(e) => setEditPuntos(e.target.value)}
                    type="number"
                    className="w-16 rounded border px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleEditSave(item.id)}
                    className="text-xs font-bold text-emerald-700"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="text-xs text-slate-500"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-800">
                    {item.nombre}{" "}
                    <span className="font-bold text-slate-600">
                      (+{toNumberPuntos(item.puntos)} pts)
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(item.id);
                        setEditNombre(item.nombre || "");
                        setEditPuntos(String(item.puntos ?? ""));
                      }}
                      className="text-xs font-semibold text-slate-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
