"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../src/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

type FormAspirante = {
  nombre: string;
  edad: string;
  nacimiento: string;
  sexo: string;
  direccion: string;
  telefono: string;
  email: string;
  iglesia: string;
  distrito: string;
  asociacion: string;
  pastor: string;
  director: string;
  club: string;
  anioIngreso: string;
  cargoActual: string;
  unidad: string;
  aniosClub: string;
  [key: string]: string;
};

export default function CompletarRegistroAspirante({ pin }: { pin: string }) {
  const [form, setForm] = useState<FormAspirante>({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      const ref = doc(db, "aspirantesGuiaMayor", pin);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setForm({ ...form, ...data });
      } else {
        setError("No existe aspirante con ese PIN.");
      }
    }
    if (pin) fetchData();
  }, [pin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const ref = doc(db, "aspirantesGuiaMayor", pin);
      await updateDoc(ref, { ...form });
      setSuccess("Registro actualizado correctamente.");
    } catch (err) {
      setError("Error al guardar datos.");
    }
    setLoading(false);
  };

  // Validación de campos obligatorios
  const camposObligatorios = ["nombre", "edad", "nacimiento", "sexo", "direccion", "telefono", "email", "iglesia", "club"];
  const registroCompleto = camposObligatorios.every(c => form[c]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700">Completa tu Registro</h2>
        {!registroCompleto && <div className="mb-4 text-red-600 font-bold">Debes completar todos los campos obligatorios para acceder al sistema.</div>}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <form className="grid grid-cols-1 gap-4 mb-8">
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo*" className="border p-2 rounded-xl" />
          <input name="edad" value={form.edad} onChange={handleChange} placeholder="Edad*" className="border p-2 rounded-xl" type="number" />
          <input name="nacimiento" value={form.nacimiento} onChange={handleChange} placeholder="Fecha de nacimiento*" className="border p-2 rounded-xl" type="date" />
          <input name="sexo" value={form.sexo} onChange={handleChange} placeholder="Sexo*" className="border p-2 rounded-xl" />
          <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección*" className="border p-2 rounded-xl" />
          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono*" className="border p-2 rounded-xl" />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email*" className="border p-2 rounded-xl" type="email" />
          <input name="iglesia" value={form.iglesia} onChange={handleChange} placeholder="Iglesia local*" className="border p-2 rounded-xl" />
          <input name="distrito" value={form.distrito} onChange={handleChange} placeholder="Distrito" className="border p-2 rounded-xl" />
          <input name="asociacion" value={form.asociacion} onChange={handleChange} placeholder="Asociación / Misión" className="border p-2 rounded-xl" />
          <input name="pastor" value={form.pastor} onChange={handleChange} placeholder="Pastor" className="border p-2 rounded-xl" />
          <input name="director" value={form.director} onChange={handleChange} placeholder="Director de conquistadores" className="border p-2 rounded-xl" />
          <input name="club" value={form.club} onChange={handleChange} placeholder="Club*" className="border p-2 rounded-xl" />
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
          className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-900 transition-all w-full"
          disabled={loading || registroCompleto}
        >
          Guardar Registro
        </button>
      </div>
    </div>
  );
}
