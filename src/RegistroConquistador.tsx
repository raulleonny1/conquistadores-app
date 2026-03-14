"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { logInfo, logError } from "@/src/lib/logger";
import { handleError } from "@/src/lib/errorHandler";

export default function RegistroConquistador() {
  // ...existing code...
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    clase: '',
    unidad: '',
    consejero: '',
    especialidades: '',
    pin: '', // PIN de 4 dígitos
  });

  // Estado para miembros
  const [miembros, setMiembros] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const clasesOficiales = [
    { nombre: "Amigo", edad: "10" },
    { nombre: "Compañero", edad: "11" },
    { nombre: "Explorador", edad: "12" },
    { nombre: "Pionero", edad: "13" },
    { nombre: "Excursionista", edad: "14" },
    { nombre: "Guía", edad: "15" }
  ];

  // Consejeros desde Firebase (con unidades)
  const [consejerosRegistrados, setConsejerosRegistrados] = useState<{nombre: string, unidades: string[]}[]>([]);
  // ...existing code...
  React.useEffect(() => {
    // Los imports dinámicos se mantienen si son necesarios para SSR, pero los estáticos van arriba
    import('firebase/firestore').then(({ getDocs, collection }) => {
      getDocs(collection(db, 'consejeros')).then(snapshot => {
        setConsejerosRegistrados(snapshot.docs.map(doc => ({
          nombre: doc.data().nombre,
          unidades: doc.data().unidades || []
        })));
        logInfo("Se cargaron los consejeros desde Firebase");
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Si cambia la unidad, buscar el consejero
    if (name === "unidad") {
      // Buscar consejero que asesora esa unidad
      const consejero = consejerosRegistrados.find(c => c.unidades.includes(value));
      setForm({ ...form, unidad: value, consejero: consejero ? consejero.nombre : "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Unidades registradas desde Firebase
  const [unidadesRegistradas, setUnidadesRegistradas] = useState<string[]>([]);
  React.useEffect(() => {
    import('firebase/firestore').then(({ getDocs, collection }) => {
      getDocs(collection(db, 'unidades')).then(snapshot => {
        setUnidadesRegistradas(snapshot.docs.map(doc => doc.data().nombre));
      });
    });
  }, []);

  // ...existing code...
  // Ejemplo de uso al registrar un conquistador
  const registrarConquistador = async () => {
    // ...lógica de registro...
    logInfo("Se registró un conquistador");
  };


  // Leer miembros en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'RegistroConquis'), (snapshot) => {
      setMiembros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Generar PIN de 4 dígitos
  function generarPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ...existing code...
    try {
      const pin = generarPin();
      await addDoc(collection(db, 'RegistroConquis'), { ...form, pin });
      alert('Registro guardado en Firebase. PIN: ' + pin);
      logInfo('Registro guardado en Firebase. PIN: ' + pin);
      setForm({
        nombre: '',
        apellido: '',
        edad: '',
        clase: '',
        unidad: '',
        consejero: '',
        especialidades: '',
        pin: '',
      });
    } catch (error) {
      alert('Error al guardar en Firebase');
      logError('Error al guardar en Firebase: ' + error);
      handleError(error);
    }
  };

  // Eliminar miembro
  const eliminarMiembro = async (id: string) => {
    if (window.confirm('¿Eliminar este miembro?')) {
      await deleteDoc(doc(db, 'RegistroConquis', id));
      logInfo('Miembro eliminado: ' + id);
    }
  };

  // Editar miembro
  const iniciarEdicion = (miembro: any) => {
    setEditandoId(miembro.id);
    setEditForm({ ...miembro });
  };
  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditForm({});
  };
  const guardarEdicion = async () => {
    const { id, ...rest } = editForm;
    await updateDoc(doc(db, 'RegistroConquis', id), rest);
      await updateDoc(doc(db, 'RegistroConquis', id), rest);
      logInfo('Miembro actualizado: ' + id);
    setEditandoId(null);
    setEditForm({});
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-8">
      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-xl sm:text-3xl font-bold text-blue-700 mb-6 text-center">Inscripción de Conquistador</h2>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="w-full p-2 rounded border text-sm sm:text-base" />
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="w-full p-2 rounded border text-sm sm:text-base" />
          <input name="edad" value={form.edad} onChange={handleChange} placeholder="Edad" type="number" className="w-full p-2 rounded border text-sm sm:text-base" />
          <select name="clase" value={form.clase} onChange={handleChange} className="w-full p-2 rounded border text-sm sm:text-base">
            <option value="">Clases de Conquistadores</option>
            {clasesOficiales.map((clase) => (
              <option key={clase.nombre} value={clase.nombre}>
                {clase.nombre} ({clase.edad} años)
              </option>
            ))}
          </select>
          <select name="unidad" value={form.unidad} onChange={handleChange} className="w-full p-2 rounded border text-sm sm:text-base">
            <option value="">Selecciona unidad</option>
            {unidadesRegistradas.map((unidad) => (
              <option key={unidad} value={unidad}>{unidad}</option>
            ))}
          </select>
          <select name="consejero" value={form.consejero} onChange={handleChange} className="w-full p-2 rounded border text-sm sm:text-base">
            <option value="">Selecciona consejero</option>
            {consejerosRegistrados.map((consejero) => (
              <option key={consejero.nombre} value={consejero.nombre}>{consejero.nombre}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-900 transition text-sm sm:text-base">Guardar</button>
        </form>
      </div>
      {/* Lista de miembros */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-xl overflow-x-auto">
        <h3 className="text-lg sm:text-2xl font-bold text-emerald-700 mb-4 text-center">Miembros registrados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2">Nombre</th>
                <th className="p-2">Apellido</th>
                <th className="p-2">Edad</th>
                <th className="p-2">Clase</th>
                <th className="p-2">Unidad</th>
                <th className="p-2">Consejero</th>
                <th className="p-2">PIN</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((miembro) => (
                editandoId === miembro.id ? (
                  <tr key={miembro.id} className="bg-yellow-50">
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.nombre || ''} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.apellido || ''} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.edad || ''} onChange={e => setEditForm({ ...editForm, edad: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.clase || ''} onChange={e => setEditForm({ ...editForm, clase: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.unidad || ''} onChange={e => setEditForm({ ...editForm, unidad: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.consejero || ''} onChange={e => setEditForm({ ...editForm, consejero: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded p-1 text-xs sm:text-sm" value={editForm.pin || ''} onChange={e => setEditForm({ ...editForm, pin: e.target.value })} /></td>
                    <td className="p-2 flex gap-1">
                      <button className="bg-green-600 text-white px-2 py-1 rounded text-xs sm:text-sm" onClick={guardarEdicion}>Guardar</button>
                      <button className="bg-gray-400 text-white px-2 py-1 rounded text-xs sm:text-sm" onClick={cancelarEdicion}>Cancelar</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={miembro.id} className="hover:bg-slate-50">
                    <td className="p-2">{miembro.nombre}</td>
                    <td className="p-2">{miembro.apellido}</td>
                    <td className="p-2">{miembro.edad}</td>
                    <td className="p-2">{miembro.clase}</td>
                    <td className="p-2">{miembro.unidad}</td>
                    <td className="p-2">{miembro.consejero}</td>
                    <td className="p-2 font-mono font-bold text-blue-700">{miembro.pin}</td>
                    <td className="p-2 flex gap-1">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded text-xs sm:text-sm" onClick={() => iniciarEdicion(miembro)}>Editar</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded text-xs sm:text-sm" onClick={() => eliminarMiembro(miembro.id)}>Eliminar</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          {miembros.length === 0 && <div className="text-center text-slate-400 py-8">No hay miembros registrados.</div>}
        </div>
      </div>
    </div>
  );
}
