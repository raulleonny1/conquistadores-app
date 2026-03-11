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

const unidadesRef = collection(db, "unidades");

export default function UnidadesPage() {
  const router = useRouter();

  const [form, setForm] = useState({ nombre: "", banderin: "" });
  const [unidades, setUnidades] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  // Cargar unidades
  const cargarUnidades = async () => {
    const snapshot = await getDocs(unidadesRef);

    const lista = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setUnidades(lista);
  };

  useEffect(() => {
    cargarUnidades();
  }, []);

  // Cambiar inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Guardar o actualizar
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editId) {
      await updateDoc(doc(db, "unidades", editId), form);
      setEditId(null);
    } else {
      await addDoc(unidadesRef, form);
    }

    setForm({ nombre: "", banderin: "" });

    cargarUnidades();
  };

  // Editar unidad
  const handleEdit = (unidad: any) => {
    setForm({
      nombre: unidad.nombre,
      banderin: unidad.banderin,
    });

    setEditId(unidad.id);
  };

  // Eliminar unidad
  const handleDelete = async (id: string) => {
    const confirmar = confirm("¿Eliminar esta unidad?");
    if (!confirmar) return;

    await deleteDoc(doc(db, "unidades", id));

    setUnidades(unidades.filter((u) => u.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 py-12">
      
      {/* Botón regresar */}
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <button
          onClick={() => router.push("/admin/registros")}
          className="bg-slate-200 hover:bg-purple-100 text-purple-700 font-semibold px-6 py-2 rounded-full shadow transition"
        >
          Regresar al menú
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mb-8">
        <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">
          {editId ? "Editar Unidad" : "Registrar Unidad"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre de la unidad"
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

      {/* Lista de unidades */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <h3 className="text-2xl font-bold text-purple-700 mb-4 text-center">
          Unidades Registradas
        </h3>

        {unidades.length === 0 ? (
          <p className="text-center text-gray-500">
            No hay unidades registradas
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">

            {unidades.map((unidad) => (
              <li
                key={unidad.id}
                className="py-4 flex flex-col md:flex-row md:items-center md:justify-between"
              >

                <div>
                  <p className="font-semibold text-purple-800">
                    {unidad.nombre}
                  </p>
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