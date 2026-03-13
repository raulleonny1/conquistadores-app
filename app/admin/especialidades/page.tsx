"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { especialidadesBase } from "@/src/data/especialidades";

type Especialidad = {
  id?: string;
  area: string;
  categoria: string;
  especialidad: string;
  consejero?: string;
};

export default function Page() {

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const [area, setArea] = useState("");
  const [categoria, setCategoria] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [consejero, setConsejero] = useState("");

  const [openArea, setOpenArea] = useState<string | null>(null);
  const [openCategoria, setOpenCategoria] = useState<string | null>(null);

  // Cargar datos
  useEffect(() => {
    cargarEspecialidades();
  }, []);

  const cargarEspecialidades = async () => {
    const querySnapshot = await getDocs(collection(db, "especialidades"));

    const datos: Especialidad[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        area: data.area ?? "",
        categoria: data.categoria ?? "",
        especialidad: data.especialidad ?? ""
      };
    });

    setEspecialidades(datos);
  };

  // Cargar especialidades base
  const cargarEspecialidadesBase = async () => {

    const querySnapshot = await getDocs(collection(db, "especialidades"));

    const existentes = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        area: data.area,
        categoria: data.categoria,
        especialidad: data.especialidad
      };
    });

    let agregados = 0;

    for (const esp of especialidadesBase) {

      const yaExiste = existentes.some(e =>
        e.area === esp.area &&
        e.categoria === esp.categoria &&
        e.especialidad === esp.especialidad
      );

      if (!yaExiste) {
        const docRef = await addDoc(collection(db, "especialidades"), esp);
        logInfo('Especialidad agregada: ' + docRef.id);
        agregados++;
      }

    }

    alert(`Especialidades agregadas: ${agregados}`);

    cargarEspecialidades();
  };

  // Agrupar
  const agrupadas = especialidades.reduce((acc, esp) => {

    if (!acc[esp.area]) acc[esp.area] = {};

    if (!acc[esp.area][esp.categoria]) {
      acc[esp.area][esp.categoria] = [];
    }

    acc[esp.area][esp.categoria].push(esp);

    return acc;

  }, {} as Record<string, Record<string, Especialidad[]>>);

  // Listas para el formulario
  const areas = [...new Set(especialidades.map(e => e.area))];

  const categorias = [
    ...new Set(
      especialidades
        .filter(e => e.area === area)
        .map(e => e.categoria)
    )
  ];

  const especialidadesLista = especialidades.filter(
    e => e.area === area && e.categoria === categoria
  );

  // Agregar
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !categoria || !especialidad) return;
    const docRef = await addDoc(collection(db, "especialidades"), {
      area,
      categoria,
      especialidad,
      consejero
    });
    setEspecialidades([
      ...especialidades,
      { id: docRef.id, area, categoria, especialidad, consejero }
    ]);
    setEspecialidad("");
    setConsejero("");
  };

  // Eliminar
  const handleDelete = async (id: string) => {

    await deleteDoc(doc(db, "especialidades", id));

    setEspecialidades(
      especialidades.filter((e) => e.id !== id)
    );
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <button
        onClick={() => window.location.href = '/admin/registros'}
        className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl mb-6 hover:bg-indigo-800 transition-all"
      >
        Retornar a Admin
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Especialidades
      </h1>

      <button
        onClick={cargarEspecialidadesBase}
        className="bg-green-700 text-white px-4 py-2 rounded mb-6"
      >
        Cargar Especialidades Base
      </button>

      {/* FORMULARIO */}

      <form onSubmit={handleAdd} className="space-y-3">

        <input
          placeholder="Área"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="border p-2 w-full"
        />

        <input
          placeholder="Categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border p-2 w-full"
        />

        <input
          placeholder="Especialidad"
          value={especialidad}
          onChange={(e) => setEspecialidad(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          placeholder="Consejero asociado"
          value={consejero}
          onChange={(e) => setConsejero(e.target.value)}
          className="border p-2 w-full"
        />

        <button className="bg-amber-700 text-white px-4 py-2 rounded">
          Agregar
        </button>

      </form>

      {/* LISTA */}

      <div className="mt-8">

        {Object.keys(agrupadas).map((area) => (

          <div key={area} className="mb-4">

            <button
              onClick={() =>
                setOpenArea(openArea === area ? null : area)
              }
              className="font-bold text-lg"
            >
              {area}
            </button>

            {openArea === area && (

              <div className="ml-4">

                {Object.keys(agrupadas[area]).map((cat) => (

                  <div key={cat}>

                    <button
                      onClick={() =>
                        setOpenCategoria(
                          openCategoria === cat ? null : cat
                        )
                      }
                      className="font-semibold"
                    >
                      {cat}
                    </button>

                    {openCategoria === cat && (

                      <ul className="ml-4">

                        {agrupadas[area][cat].map((esp) => (

                          <li key={esp.id} className="flex gap-3">

                            {esp.especialidad}

                            <button
                              onClick={() =>
                                handleDelete(esp.id!)
                              }
                              className="text-red-600"
                            >
                              eliminar
                            </button>

                          </li>

                        ))}

                      </ul>

                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

        ))}

      </div>

    </div>
  );
}