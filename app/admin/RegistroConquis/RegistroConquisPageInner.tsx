"use client";

import React, { useEffect, useState } from "react";
import { getDocs, doc, updateDoc, deleteDoc, addDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/src/firebase";
import { especialidadesBase } from "@/src/data/especialidades";
import { logInfo } from "@/src/lib/logger";

type EspecialidadObj = {
  area: string;
  categoria: string;
  especialidad: string;
};

type RegistroConquisPageInnerProps = {
  unidades?: { nombre: string; consejero: string }[];
  consejeros?: { nombre: string; unidades: string[] }[];
};

export default function RegistroConquisPageInner({ unidades: initialUnidades, consejeros: initialConsejeros }: RegistroConquisPageInnerProps) {
  const [conquis, setConquis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    fechaNacimiento: "",
    programa: "",
    whatsapp: "",
    unidad: "",
    consejero: "",
    clase: "",
    especialidadArea: "",
    especialidadCategoria: "",
    especialidad: "",
    especialidades: [] as EspecialidadObj[],
    pin: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<any[]>(initialUnidades ?? []);
  const [consejeros, setConsejeros] = useState<any[]>(initialConsejeros ?? []);
  const [editId, setEditId] = useState<string | null>(null);
  const clasesOficiales = [
    "Amigo",
    "Compañero",
    "Explorador",
    "Pionero",
    "Excursionista",
    "Guía"
  ];

  useEffect(() => {
    const q = collection(db, "RegistroConquis");
    const unsub = onSnapshot(q, (snapshot) => {
      const sortedConquis = snapshot.docs
        .map(doc => ({
          id: doc.id,
          apellido: doc.data().apellido || "",
          clase: doc.data().clase || "",
          consejero: doc.data().consejero || "",
          edad: doc.data().edad || "",
          especialidad: doc.data().especialidad || "",
          especialidadArea: doc.data().especialidadArea || "",
          especialidadCategoria: doc.data().especialidadCategoria || "",
          especialidades: doc.data().especialidades || "",
          nombre: doc.data().nombre || "",
          pin: doc.data().pin || "",
          unidad: doc.data().unidad || "",
          whatsapp: doc.data().whatsapp || "",
          ...doc.data()
        }))
        .sort((a, b) => {
          const nombreA = (a.nombre || "").toLowerCase();
          const nombreB = (b.nombre || "").toLowerCase();
          if (nombreA < nombreB) return -1;
          if (nombreA > nombreB) return 1;
          return 0;
        });
      setConquis(sortedConquis);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    if (initialUnidades && initialConsejeros) return;

    getDocs(collection(db, "unidades")).then(snapshot => {
      setUnidades(snapshot.docs.map(doc => ({ nombre: doc.data().nombre, consejero: doc.data().consejero || "" })));
    });
    getDocs(collection(db, "consejeros")).then(snapshot => {
      setConsejeros(snapshot.docs.map(doc => ({ nombre: doc.data().nombre, unidades: doc.data().unidades || [] })));
    });
  }, [initialUnidades, initialConsejeros]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "unidad") {
      const unidadObj = unidades.find(u => u.nombre === value);
      // Buscar consejero en Firebase (colección consejeros)
      let consejero = "Sin asignar";
      const consejeroFirebase = consejeros.find(c => Array.isArray(c.unidades) && c.unidades.includes(value));
      if (consejeroFirebase) {
        consejero = consejeroFirebase.nombre;
      } else if (unidadObj && unidadObj.consejero) {
        consejero = unidadObj.consejero;
      }
      setForm({ ...form, unidad: value, consejero });
    } else {
      setForm({ ...form, [name]: value });
    }
  };
  // Especialidades anidadas
  const areas = Array.from(new Set(especialidadesBase.map(e => e.area)));
  const categorias = form.especialidadArea ? Array.from(new Set(especialidadesBase.filter(e => e.area === form.especialidadArea).map(e => e.categoria))) : [];
  const especialidades = form.especialidadArea && form.especialidadCategoria ? especialidadesBase.filter(e => e.area === form.especialidadArea && e.categoria === form.especialidadCategoria).map(e => e.especialidad) : [];

  function generarPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMode && editId) {
        // Editar
        const rest = { ...form };
        await updateDoc(doc(db, 'RegistroConquis', editId), rest);
        setEditId(null);
        setEditMode(false);
      } else {
        // Registrar
        const pin = generarPin();
        await addDoc(collection(db, "RegistroConquis"), {
          ...form,
          pin,
          especialidades: form.especialidades,
        });
      }
      setForm({
        nombre: "",
        apellido: "",
        edad: "",
        fechaNacimiento: "",
        programa: "",
        whatsapp: "",
        unidad: "",
        consejero: "",
        clase: "",
        especialidadArea: "",
        especialidadCategoria: "",
        especialidad: "",
        especialidades: [],
        pin: ""
      });
    } catch (err) {
      alert(editMode ? "Error al editar conquistador" : "Error al registrar conquistador");
    }
    setSaving(false);
  };
  // Edición
  const iniciarEdicion = (miembro: any) => {
    setEditId(miembro.id);
    let especialidadesArr = [];
    if (Array.isArray(miembro.especialidades)) {
      especialidadesArr = miembro.especialidades;
    } else if (typeof miembro.especialidades === "string" && miembro.especialidades.length > 0) {
      // Try to parse string, fallback to single object
      especialidadesArr = [{ area: "", categoria: "", especialidad: miembro.especialidades }];
    }
    setForm({
      nombre: [miembro.nombre, miembro.apellido].filter(Boolean).join(" "),
      apellido: miembro.apellido || "",
      edad: miembro.edad || "",
      fechaNacimiento: miembro.fechaNacimiento || "",
      programa: miembro.programa || "",
      whatsapp: miembro.whatsapp || "",
      unidad: miembro.unidad || "",
      consejero: miembro.consejero || "",
      clase: miembro.clase || "",
      especialidadArea: miembro.especialidadArea || "",
      especialidadCategoria: miembro.especialidadCategoria || "",
      especialidad: miembro.especialidad || "",
      especialidades: especialidadesArr,
      pin: miembro.pin || ""
    });
    setEditMode(true);
  };
  const cancelarEdicion = () => {
    setEditId(null);
    setForm({
      nombre: "",
      apellido: "",
      clase: "",
      consejero: "",
      edad: "",
      especialidad: "",
      especialidadArea: "",
      especialidadCategoria: "",
      especialidades: [],
      pin: "",
      unidad: "",
      whatsapp: "",
      fechaNacimiento: "",
      programa: ""
    });
    setEditMode(false);
  };
  // Removed unused guardarEdicion and editForm/setEditForm
  const eliminarMiembro = async (id: string) => {
    if (window.confirm('¿Eliminar este registro?')) {
      await deleteDoc(doc(db, 'RegistroConquis', id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 px-4 py-8">
      <h2 className="text-2xl font-black mb-6 text-indigo-700 text-center">RegistroConquis</h2>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col items-center">
        {/* Reordered fields */}
        <input type="text" name="nombre" value={form.nombre} onChange={handleInput} placeholder="Nombre" className="border rounded-lg px-4 py-2 mb-2" required />
        <input type="text" name="apellido" value={form.apellido} onChange={handleInput} placeholder="Apellido" className="border rounded-lg px-4 py-2 mb-2" />
        <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleInput} placeholder="Fecha de nacimiento" className="border rounded-lg px-4 py-2 mb-2" />
        <input type="text" name="edad" value={form.edad} onChange={handleInput} placeholder="Edad" className="border rounded-lg px-4 py-2 mb-2" />
        <input type="text" name="programa" value={form.programa} onChange={handleInput} placeholder="Programa" className="border rounded-lg px-4 py-2 mb-2" />
        <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleInput} placeholder="WhatsApp" className="border rounded-lg px-4 py-2 mb-2" />
        <select name="unidad" value={form.unidad} onChange={handleInput} className="border rounded-lg px-4 py-2 mb-2">
          <option value="">Selecciona unidad</option>
          {unidades.map((u, idx) => (
            <option key={idx} value={u.nombre}>{u.nombre}</option>
          ))}
        </select>
        <div className="text-xs text-blue-700 font-semibold mb-2">Consejero: {form.consejero || "Sin asignar"}</div>
        <select name="clase" value={form.clase} onChange={handleInput} required className="border rounded-lg px-4 py-2 mb-2">
          <option value="">Selecciona clase</option>
          {clasesOficiales.map((c, idx) => (
            <option key={idx} value={c}>{c}</option>
          ))}
        </select>
        {/* Especialidades anidadas y múltiples */}
        <div className="border rounded-lg px-4 py-2 bg-slate-50 mb-2">
          <div className="font-bold mb-2 text-indigo-700">Especialidades</div>
          <div className="flex flex-col md:flex-row gap-2 mb-2">
            <select name="especialidadArea" value={form.especialidadArea} onChange={handleInput} className="border rounded-lg px-2 py-1">
              <option value="">Área</option>
              {areas.map((a, idx) => (
                <option key={idx} value={a}>{a}</option>
              ))}
            </select>
            {form.especialidadArea && (
              <select name="especialidadCategoria" value={form.especialidadCategoria} onChange={handleInput} className="border rounded-lg px-2 py-1">
                <option value="">Categoría</option>
                {categorias.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            )}
            {form.especialidadArea && form.especialidadCategoria && (
              <select name="especialidad" value={form.especialidad} onChange={handleInput} className="border rounded-lg px-2 py-1">
                <option value="">Especialidad</option>
                {especialidades.map((esp, idx) => (
                  <option key={idx} value={esp}>{esp}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="bg-indigo-600 text-white px-4 py-1 rounded font-bold text-sm hover:bg-indigo-700 transition-all"
              disabled={!(form.especialidadArea && form.especialidadCategoria && form.especialidad)}
              onClick={() => {
                if (form.especialidadArea && form.especialidadCategoria && form.especialidad) {
                  setForm({
                    ...form,
                    especialidades: [
                      ...form.especialidades,
                      {
                        area: form.especialidadArea,
                        categoria: form.especialidadCategoria,
                        especialidad: form.especialidad
                      }
                    ],
                    especialidad: "",
                    especialidadCategoria: "",
                    especialidadArea: ""
                  });
                }
              }}
            >Agregar</button>
          </div>
          {/* Lista de especialidades seleccionadas */}
          {form.especialidades.length > 0 && (
            <ul className="mb-2">
              {form.especialidades.map((esp, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs bg-indigo-50 rounded px-2 py-1 mb-1">
                  <span>{esp.area} &gt; {esp.categoria} &gt; {esp.especialidad}</span>
                  <button
                    type="button"
                    className="bg-red-500 text-white rounded px-2 py-0.5 text-xs font-bold"
                    onClick={() => setForm({
                      ...form,
                      especialidades: form.especialidades.filter((_, i) => i !== idx)
                    })}
                  >Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={saving} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
          {saving ? "Guardando..." : editMode ? "Guardar cambios" : "Registrar"}
        </button>
        {editMode && (
          <button type="button" onClick={cancelarEdicion} className="mt-2 bg-gray-400 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-500 transition-all">
            Cancelar edición
          </button>
        )}
      </form>
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 max-w-3xl mx-auto">
        <h3 className="text-lg font-bold mb-4 text-blue-700">Conquistadores registrados</h3>
        {loading ? (
          <div className="text-center text-blue-700">Cargando conquistadores...</div>
        ) : conquis.length === 0 ? (
          <div className="text-center text-red-700">No hay conquistadores registrados.</div>
        ) : (
          <table className="min-w-full text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-100">
                <th className="px-2 py-1">Nombre</th>
                <th className="px-2 py-1">Apellido</th>
                <th className="px-2 py-1">Fecha Nacimiento</th>
                <th className="px-2 py-1">Edad</th>
                <th className="px-2 py-1">Programa</th>
                <th className="px-2 py-1">WhatsApp</th>
                <th className="px-2 py-1">Unidad</th>
                <th className="px-2 py-1">Consejero</th>
                <th className="px-2 py-1">Clase</th>
                <th className="px-2 py-1">Especialidades</th>
                <th className="px-2 py-1">PIN</th>
                <th className="px-2 py-1">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conquis.map((m) => {
                let especialidadesArr = [];
                if (Array.isArray(m.especialidades)) {
                  especialidadesArr = m.especialidades;
                } else if (typeof m.especialidades === "string" && m.especialidades.length > 0) {
                  especialidadesArr = [{ area: "", categoria: "", especialidad: m.especialidades }];
                }
                return (
                  <tr key={m.id} className="border-b">
                    <td className="px-2 py-1 font-semibold">{m.nombre}</td>
                    <td className="px-2 py-1">{m.apellido}</td>
                    <td className="px-2 py-1">{m.fechaNacimiento}</td>
                    <td className="px-2 py-1">{m.edad}</td>
                    <td className="px-2 py-1">{m.programa}</td>
                    <td className="px-2 py-1">{m.whatsapp}</td>
                    <td className="px-2 py-1">{m.unidad}</td>
                    <td className="px-2 py-1">{m.consejero}</td>
                    <td className="px-2 py-1">{m.clase}</td>
                    <td className="px-2 py-1">
                      {especialidadesArr.length > 0 ? especialidadesArr.map((esp: EspecialidadObj, idx: number) => (
                        <div key={idx}>{esp.area} &gt; {esp.categoria} &gt; {esp.especialidad}</div>
                      )) : ""}
                    </td>
                    <td className="px-2 py-1 font-mono font-bold text-blue-700">{m.pin}</td>
                    <td className="p-2 flex gap-1">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => iniciarEdicion(m)}>Editar</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => eliminarMiembro(m.id)}>Eliminar</button>
                      {m.whatsapp ? (
                        <a
                          href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`¡Hola! Ingresa al link y accede con tu PIN: ${m.pin}. Te damos la bienvenida al club. ¡Hazlo bien bonito!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-green-600 transition-all"
                        >
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <button className="bg-gray-300 text-white px-2 py-1 rounded flex items-center gap-1 cursor-not-allowed" disabled>
                          WhatsApp
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
