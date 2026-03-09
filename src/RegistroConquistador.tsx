"use client";
import React, { useState } from 'react';
import { db } from '../src/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function RegistroConquistador() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    clase: '',
    unidad: '',
    consejero: '',
    especialidades: '',
    // asistencia: '',
  });

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
  React.useEffect(() => {
    import('firebase/firestore').then(({ getDocs, collection }) => {
      getDocs(collection(db, 'consejeros')).then(snapshot => {
        setConsejerosRegistrados(snapshot.docs.map(doc => ({
          nombre: doc.data().nombre,
          unidades: doc.data().unidades || []
        })));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'conquistadores'), form);
      alert('Registro guardado en Firebase');
      setForm({
        nombre: '',
        apellido: '',
        edad: '',
        clase: '',
        unidad: '',
        consejero: '',
        especialidades: '',
      });
    } catch (error) {
      alert('Error al guardar en Firebase');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">Inscripción de Conquistador</h2>
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="w-full p-2 rounded border" />
        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="w-full p-2 rounded border" />
        <input name="edad" value={form.edad} onChange={handleChange} placeholder="Edad" type="number" className="w-full p-2 rounded border" />
        <select name="clase" value={form.clase} onChange={handleChange} className="w-full p-2 rounded border" required>
          <option value="">Clases de Conquistadores</option>
          {clasesOficiales.map((clase) => (
            <option key={clase.nombre} value={clase.nombre}>
              {clase.nombre} ({clase.edad} años)
            </option>
          ))}
        </select>
        <select name="unidad" value={form.unidad} onChange={handleChange} className="w-full p-2 rounded border" required>
          <option value="">Selecciona unidad</option>
          {unidadesRegistradas.map((unidad) => (
            <option key={unidad} value={unidad}>{unidad}</option>
          ))}
        </select>
        <select name="consejero" value={form.consejero} onChange={handleChange} className="w-full p-2 rounded border" required>
          <option value="">Selecciona consejero</option>
          {consejerosRegistrados.map((consejero) => (
            <option key={consejero.nombre} value={consejero.nombre}>{consejero.nombre}</option>
          ))}
        </select>
        {/* ...existing code... */}
        {/* <input name="asistencia" value={form.asistencia} onChange={handleChange} placeholder="Asistencia" className="w-full p-2 rounded border" /> */}
        <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-blue-900 transition">Guardar</button>
      </form>
      {/* ...existing code... */}
    </div>
  );
}
