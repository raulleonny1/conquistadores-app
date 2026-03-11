"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../src/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

// Eliminado menú, ahora es un solo formulario

const AspirantePage = () => {
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    nacimiento: "",
    sexo: "",
    direccion: "",
    telefono: "",
    email: "",
    iglesia: "",
    distrito: "",
    asociacion: "",
    pastor: "",
    director: "",
    club: "",
    anioIngreso: "",
    cargoActual: "",
    unidad: "",
    aniosClub: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspirantes, setAspirantes] = useState<any[]>([]);
  // Generar PIN aleatorio
  const generarPin = () => Math.floor(1000 + Math.random() * 9000).toString();

  // Cargar aspirantes en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "aspirantesGuiaMayor"), snap => {
      setAspirantes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "aspirantesGuiaMayor", editId), {
          ...form
        });
        alert("Aspirante actualizado correctamente.");
        setEditId(null);
      } else {
        const pin = generarPin();
        const { formatFechaDDMMYYYY } = await import("../../../src/firebase");
        await addDoc(collection(db, "aspirantesGuiaMayor"), {
          ...form,
          pin,
          fechaRegistro: formatFechaDDMMYYYY(new Date())
        });
        alert("Aspirante registrado correctamente. PIN: " + pin);
      }
      setForm({
        nombre: "",
        edad: "",
        nacimiento: "",
        sexo: "",
        direccion: "",
        telefono: "",
        email: "",
        iglesia: "",
        distrito: "",
        asociacion: "",
        pastor: "",
        director: "",
        club: "",
        anioIngreso: "",
        cargoActual: "",
        unidad: "",
        aniosClub: ""
      });
    } catch (err) {
      alert("Error al guardar datos.");
    }
    setLoading(false);
  };

  const handleEdit = (a: any) => {
    setForm({
      nombre: a.nombre,
      edad: a.edad,
      nacimiento: a.nacimiento,
      sexo: a.sexo,
      direccion: a.direccion,
      telefono: a.telefono,
      email: a.email,
      iglesia: a.iglesia,
      distrito: a.distrito,
      asociacion: a.asociacion,
      pastor: a.pastor,
      director: a.director,
      club: a.club,
      anioIngreso: a.anioIngreso,
      cargoActual: a.cargoActual,
      unidad: a.unidad,
      aniosClub: a.aniosClub
    });
    setEditId(a.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este aspirante?")) return;
    await deleteDoc(doc(db, "aspirantesGuiaMayor", id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto mt-10">
        <button
          onClick={() => window.location.href = '/admin/registros'}
          className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl mb-6 hover:bg-indigo-800 transition-all"
        >
          <ArrowLeft className="inline mr-2" /> Retornar a Admin
        </button>
        <section className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700">Registrar Aspirante a Guía Mayor</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" className="border p-2 rounded-xl" />
            <input name="edad" value={form.edad} onChange={handleChange} placeholder="Edad" className="border p-2 rounded-xl" type="number" />
            <input name="nacimiento" value={form.nacimiento} onChange={handleChange} placeholder="Fecha de nacimiento" className="border p-2 rounded-xl" type="date" />
            <input name="sexo" value={form.sexo} onChange={handleChange} placeholder="Sexo" className="border p-2 rounded-xl" />
            <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className="border p-2 rounded-xl" />
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="border p-2 rounded-xl" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded-xl" type="email" />
            <input name="iglesia" value={form.iglesia} onChange={handleChange} placeholder="Iglesia local" className="border p-2 rounded-xl" />
            <input name="distrito" value={form.distrito} onChange={handleChange} placeholder="Distrito" className="border p-2 rounded-xl" />
            <input name="asociacion" value={form.asociacion} onChange={handleChange} placeholder="Asociación / Misión" className="border p-2 rounded-xl" />
            <input name="pastor" value={form.pastor} onChange={handleChange} placeholder="Pastor" className="border p-2 rounded-xl" />
            <input name="director" value={form.director} onChange={handleChange} placeholder="Director de conquistadores" className="border p-2 rounded-xl" />
            <input name="club" value={form.club} onChange={handleChange} placeholder="Club" className="border p-2 rounded-xl" />
            <input name="anioIngreso" value={form.anioIngreso} onChange={handleChange} placeholder="Año de ingreso" className="border p-2 rounded-xl" type="number" />
            <select name="cargoActual" value={form.cargoActual} onChange={handleChange} className="border p-2 rounded-xl">
              <option value="">Cargo actual</option>
              <option value="Conquistador">Conquistador</option>
              <option value="Consejero">Consejero</option>
              <option value="Instructor">Instructor</option>
            </select>
            <input name="unidad" value={form.unidad} onChange={handleChange} placeholder="Unidad" className="border p-2 rounded-xl" />
            <input name="aniosClub" value={form.aniosClub} onChange={handleChange} placeholder="Años en el club" className="border p-2 rounded-xl" type="number" />
          </form>
          <button
            onClick={handleSave}
            className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-900 transition-all"
            disabled={loading}
          >
            {editId ? "Actualizar Aspirante" : "Guardar Aspirante"}
          </button>
          {/* Lista de aspirantes registrados */}
          <div className="mt-10">
            <h2 className="font-bold mb-4 text-indigo-700">Aspirantes Registrados</h2>
            <ul className="space-y-3">
              {aspirantes.map(a => (
                <li key={a.id} className="bg-indigo-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 border border-indigo-200">
                  <div className="flex-1">
                    <span className="font-bold text-indigo-800">{a.nombre}</span><br />
                    <span className="text-xs text-slate-400">Edad: {a.edad}</span><br />
                    <span className="text-xs text-slate-400">Club: {a.club}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-mono">PIN: {a.pin}</span>
                    <a
                      href={`https://wa.me/${a.telefono}?text=Hola%20${encodeURIComponent(a.nombre)}%2C%20tu%20PIN%20de%20acceso%20es%20${a.pin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-800 transition-all"
                    >
                      Enviar PIN por WhatsApp
                    </a>
                    <button
                      onClick={() => handleEdit(a)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-yellow-700 transition-all"
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-800 transition-all"
                    >Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AspirantePage;
