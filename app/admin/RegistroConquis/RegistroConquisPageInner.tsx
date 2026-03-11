"use client";

import React, { useEffect, useState } from "react";
import { getDocs, doc, updateDoc, deleteDoc, addDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/src/firebase";
import { especialidadesBase } from "@/src/data/especialidades";

export default function RegistroConquisPageInner() {
  const [conquis, setConquis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  type EspecialidadObj = {
    area: string;
    categoria: string;
    especialidad: string;
  };
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    whatsapp: "",
    unidad: "",
    consejero: "",
    clase: "",
    especialidadArea: "",
    especialidadCategoria: "",
    especialidad: "",
    especialidades: [] as EspecialidadObj[], // array de especialidades
    pin: ""
  });
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [consejeros, setConsejeros] = useState<any[]>([]);
  const clasesOficiales = [
    "Amigo",
    "Compañero",
    "Explorador",
    "Pionero",
    "Excursionista",
    "Guía"
  ];
  // Edición
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const q = collection(db, "RegistroConquis");
    const unsub = onSnapshot(q, (snapshot) => {
      setConquis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    getDocs(collection(db, "unidades")).then(snapshot => {
      setUnidades(snapshot.docs.map(doc => ({ nombre: doc.data().nombre, consejero: doc.data().consejero || "" }))); 
    });
    getDocs(collection(db, "consejeros")).then(snapshot => {
      setConsejeros(snapshot.docs.map(doc => ({ nombre: doc.data().nombre, unidades: doc.data().unidades || [] }))); 
    });
  }, []);

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
      const pin = generarPin();
      await addDoc(collection(db, "RegistroConquis"), {
        ...form,
        especialidades: `${form.especialidadArea} > ${form.especialidadCategoria} > ${form.especialidad}`,
        pin
      });
      setForm({ nombre: "", apellido: "", edad: "", whatsapp: "", unidad: "", consejero: "", clase: "", especialidadArea: "", especialidadCategoria: "", especialidad: "", especialidades: [], pin: "" });
    } catch (err) {
      alert("Error al registrar conquistador");
    }
    setSaving(false);
  };
  // Edición
  const iniciarEdicion = (miembro: any) => {
    setEditId(miembro.id);
    setEditForm({ ...miembro });
  };
  const cancelarEdicion = () => {
    setEditId(null);
    setEditForm({});
  };
  const guardarEdicion = async () => {
    const { id, ...rest } = editForm;
    await updateDoc(doc(db, 'RegistroConquis', id), rest);
    setEditId(null);
    setEditForm({});
  };
  const eliminarMiembro = async (id: string) => {
    if (window.confirm('¿Eliminar este registro?')) {
      await deleteDoc(doc(db, 'RegistroConquis', id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 px-4 py-8">
      <h2 className="text-2xl font-black mb-6 text-indigo-700 text-center">RegistroConquis</h2>
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => window.location.href = "/admin/registros"}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
        >
          Regresar al menú
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-md border border-slate-200 mb-8 max-w-xl mx-auto">
        <h3 className="text-xl font-bold mb-4 text-indigo-700">Registrar nuevo conquistador</h3>
        <div className="grid grid-cols-1 gap-4">
          <input name="nombre" value={form.nombre} onChange={handleInput} required placeholder="Nombre y Apellido" className="border rounded-lg px-4 py-2" />
          <input name="edad" value={form.edad} onChange={handleInput} required placeholder="Edad" type="number" className="border rounded-lg px-4 py-2" />
          <input name="whatsapp" value={form.whatsapp} onChange={handleInput} required placeholder="WhatsApp" type="tel" className="border rounded-lg px-4 py-2" />
          <select name="unidad" value={form.unidad} onChange={handleInput} required className="border rounded-lg px-4 py-2">
            <option value="">Selecciona unidad</option>
            {unidades.map((u, idx) => (
              <option key={idx} value={u.nombre}>{u.nombre}</option>
            ))}
          </select>
          {form.unidad && (
            <div className="text-xs text-blue-700 font-semibold">Consejero: {form.consejero || "Sin asignar"}</div>
          )}
          <select name="clase" value={form.clase} onChange={handleInput} required className="border rounded-lg px-4 py-2">
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
        </div>
        <button type="submit" disabled={saving} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
          {saving ? "Guardando..." : "Registrar"}
        </button>
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
                <th className="px-2 py-1">Edad</th>
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
              {conquis.map((m) => (
                editId === m.id ? (
                  <tr key={m.id} className="bg-yellow-50">
                    <td className="p-2"><input className="border rounded p-1" value={editForm.nombre || ''} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1" value={editForm.apellido || ''} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1" value={editForm.edad || ''} onChange={e => setEditForm({ ...editForm, edad: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1" value={editForm.unidad || ''} onChange={e => setEditForm({ ...editForm, unidad: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1" value={editForm.consejero || ''} onChange={e => setEditForm({ ...editForm, consejero: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1" value={editForm.clase || ''} onChange={e => setEditForm({ ...editForm, clase: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1" value={editForm.especialidades || ''} onChange={e => setEditForm({ ...editForm, especialidades: e.target.value })} /></td>
                    <td className="p-2 font-mono font-bold text-blue-700">{editForm.pin}</td>
                    <td className="p-2 flex gap-1">
                      <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={guardarEdicion}>Guardar</button>
                      <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={cancelarEdicion}>Cancelar</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className="border-b">
                    <td className="px-2 py-1 font-semibold">{m.nombre}</td>
                    <td className="px-2 py-1">{m.apellido}</td>
                    <td className="px-2 py-1">{m.edad}</td>
                    <td className="px-2 py-1">{m.whatsapp}</td>
                    <td className="px-2 py-1">{m.unidad}</td>
                    <td className="px-2 py-1">{m.consejero}</td>
                    <td className="px-2 py-1">{m.clase}</td>
                    <td className="px-2 py-1">{m.especialidades}</td>
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
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
