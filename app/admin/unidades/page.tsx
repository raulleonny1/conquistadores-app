"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { logInfo } from "@/src/lib/logger";
import { consolidarUnidadesClub } from "@/src/lib/consolidarUnidades";
import { toast } from "react-hot-toast";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";

export default function UnidadesPage() {
  const router = useRouter();
  const { clubId } = useClubActivo();

  const [form, setForm] = useState({ nombre: "", banderin: "" });
  const [unidades, setUnidades] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [consolidando, setConsolidando] = useState(false);

  const cargarUnidades = async () => {
    const q = queryColeccionClub("unidades", clubId);
    if (!q) return;
    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setUnidades(lista);
  };

  useEffect(() => {
    if (clubId) cargarUnidades();
  }, [clubId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nombre = form.nombre.trim();
    if (!nombre) return;

    if (editId) {
      await updateDoc(doc(db, "unidades", editId), { ...form, nombre });
      logInfo("Unidad actualizada: " + editId);
      setEditId(null);
    } else if (!clubId) {
      toast.error("Sesión de club no válida.");
      return;
    } else {
      const docRef = await addDoc(collection(db, "unidades"), datosConClub({ ...form, nombre }, clubId));
      logInfo("Unidad registrada: " + docRef.id);
    }

    setForm({ nombre: "", banderin: "" });

    cargarUnidades();
  };

  const handleEdit = (unidad: any) => {
    setForm({
      nombre: unidad.nombre,
      banderin: unidad.banderin,
    });

    setEditId(unidad.id);
  };

  const handleDelete = async (id: string) => {
    const confirmar = confirm("¿Eliminar esta unidad?");
    if (!confirmar) return;

    await deleteDoc(doc(db, "unidades", id));
    logInfo("Unidad eliminada: " + id);

    setUnidades(unidades.filter((u) => u.id !== id));
  };

  const handleConsolidar = async () => {
    const ok = confirm(
      "¿Unificar duplicados como «Unidad de Gacelas» → «Gacelas» y «Unidad de Tigres» → «Tigres»?\n\n" +
        "Moverá integrantes, fusionará puntos de unidad y limpiará el catálogo. No borra puntos personales."
    );
    if (!ok) return;

    setConsolidando(true);
    try {
      const res = await consolidarUnidadesClub();
      toast.success(
        `Listo: ${res.conquistadoresActualizados} conquistador(es), ` +
          `${res.catalogoEliminados} duplicado(s) en catálogo, ` +
          `${res.docsPuntosUnidadFusionados} doc(s) de puntos unificados.`
      );
      if (res.detalle.length) {
        console.info("[consolidarUnidades]", res.detalle.join("\n"));
      }
      await cargarUnidades();
    } catch (err) {
      console.error(err);
      toast.error("Error al consolidar unidades. Revisa la consola.");
    } finally {
      setConsolidando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 py-12">
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <button
          onClick={() => router.push("/admin/registros")}
          className="bg-slate-200 hover:bg-purple-100 text-purple-700 font-semibold px-6 py-2 rounded-full shadow transition"
        >
          Regresar al menú
        </button>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl shadow-sm p-6 w-full max-w-2xl mb-6">
        <h3 className="text-lg font-bold text-cyan-900 mb-2">Nombres duplicados</h3>
        <p className="text-sm text-cyan-800 mb-4">
          Si en el ranking aparecen «Unidad de Gacelas» y «Gacelas» por separado, usa este botón
          una vez. Mueve integrantes al nombre corto, fusiona puntos de unidad y elimina entradas
          duplicadas del catálogo. Usa nombres simples al registrar (ej. «Gacelas», «Tigres»).
        </p>
        <button
          type="button"
          disabled={consolidando}
          onClick={handleConsolidar}
          className="bg-cyan-700 text-white px-5 py-2 rounded-lg font-bold hover:bg-cyan-800 disabled:opacity-50"
        >
          {consolidando ? "Consolidando…" : "Unificar «Unidad de X» → «X»"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mb-8">
        <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">
          {editId ? "Editar Unidad" : "Registrar Unidad"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre (ej. Gacelas, Tigres)"
            className="w-full p-2 rounded border"
            required
          />

          <input
            name="banderin"
            value={form.banderin}
            onChange={handleChange}
            placeholder="Banderín (URL o descripción)"
            className="w-full p-2 rounded border"
          />

          <button
            type="submit"
            className="w-full bg-purple-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-purple-900 transition"
          >
            {editId ? "Actualizar" : "Guardar"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h3 className="text-2xl font-bold text-purple-700 mb-4 text-center">
          Unidades Registradas
        </h3>

        {unidades.length === 0 ? (
          <p className="text-center text-gray-500">No hay unidades registradas</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {unidades.map((unidad) => (
              <li
                key={unidad.id}
                className="py-4 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-purple-800">{unidad.nombre}</p>
                  <p className="text-gray-600 text-sm">
                    Banderín: {unidad.banderin || "No definido"}
                  </p>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => handleEdit(unidad)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded-full font-semibold shadow hover:bg-yellow-600 transition"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(unidad.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-full font-semibold shadow hover:bg-red-700 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
