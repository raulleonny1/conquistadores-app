"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { guardarFichaMedica } from "@/src/lib/guardarFichaMedica";
import {
  ASOCIACIONES_MISION,
  CARGO_ASPIRANTE,
  registroAspiranteCompleto,
} from "@/src/constants/aspirante";
import FichaMedicaUpload from "@/src/components/forms/FichaMedicaUpload";

interface CompletarRegistroAspiranteProps {
  pin: string;
}

const formInicial = {
  nombre: "",
  apellido: "",
  edad: "",
  nacimiento: "",
  genero: "",
  asociacion: ASOCIACIONES_MISION[0] as string,
  cargo: CARGO_ASPIRANTE,
};

export default function CompletarRegistroAspirante({ pin }: CompletarRegistroAspiranteProps) {
  const [form, setForm] = useState(formInicial);
  const [fichaArchivo, setFichaArchivo] = useState<File | null>(null);
  const [fichaMedicaUrl, setFichaMedicaUrl] = useState("");
  const [fichaMedicaNombre, setFichaMedicaNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      const ref = doc(db, "aspirantesGuiaMayor", pin);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError("No existe aspirante con ese PIN.");
        return;
      }
      const data = snap.data();
      setForm({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        edad: data.edad || "",
        nacimiento: data.nacimiento || "",
        genero: data.genero || data.sexo || "",
        asociacion: data.asociacion || ASOCIACIONES_MISION[0],
        cargo: CARGO_ASPIRANTE,
      });
      setFichaMedicaUrl(data.fichaMedicaUrl || "");
      setFichaMedicaNombre(data.fichaMedicaNombre || "");
    }
    if (pin) fetchData();
  }, [pin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === "nacimiento") {
      const nacimiento = e.target.value;
      let edad = "";
      if (nacimiento) {
        const birthDate = new Date(nacimiento);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          years--;
        }
        edad = years.toString();
      }
      setForm({ ...form, nacimiento, edad });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!fichaArchivo && !fichaMedicaUrl) {
      setError("Debes subir tu ficha médica.");
      setLoading(false);
      return;
    }

    try {
      let ficha = {
        fichaMedicaUrl,
        fichaMedicaNombre,
        fichaMedicaTipo: "",
      };
      if (fichaArchivo) {
        ficha = await guardarFichaMedica(fichaArchivo, pin);
      }

      const ref = doc(db, "aspirantesGuiaMayor", pin);
      await updateDoc(ref, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        edad: form.edad,
        nacimiento: form.nacimiento,
        genero: form.genero,
        asociacion: form.asociacion,
        cargo: CARGO_ASPIRANTE,
        ...ficha,
      });
      setSuccess("Registro actualizado correctamente.");
      setTimeout(() => {
        window.location.href = `/aspirante/dashboard?pin=${pin}`;
      }, 1200);
    } catch {
      setError("Error al guardar datos.");
    }
    setLoading(false);
  };

  const datosActuales = {
    ...form,
    fichaMedicaUrl,
    cargo: CARGO_ASPIRANTE,
  };
  const completo = registroAspiranteCompleto(datosActuales);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-indigo-800 transition-all mb-6"
        >
          Regresar
        </button>
        <h2 className="text-2xl font-bold mb-6 text-indigo-700">Completa tu registro</h2>
        {!completo && (
          <div className="mb-4 text-red-600 font-bold text-sm">
            Completa todos los campos y sube tu ficha médica para acceder al sistema.
          </div>
        )}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}

        <form
          className="grid grid-cols-1 gap-4 mb-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre*"
            className="border p-2 rounded-xl"
            required
          />
          <input
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            placeholder="Apellido*"
            className="border p-2 rounded-xl"
            required
          />
          <input
            name="nacimiento"
            value={form.nacimiento}
            onChange={handleChange}
            type="date"
            className="border p-2 rounded-xl"
            required
          />
          <input
            name="edad"
            value={form.edad}
            readOnly
            placeholder="Edad*"
            className="border p-2 rounded-xl bg-gray-100"
          />
          <select
            name="genero"
            value={form.genero}
            onChange={handleChange}
            className="border p-2 rounded-xl"
            required
          >
            <option value="">Género*</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
          </select>
          <select
            name="cargo"
            value={form.cargo}
            disabled
            className="border p-2 rounded-xl bg-gray-100"
          >
            <option value={CARGO_ASPIRANTE}>{CARGO_ASPIRANTE}</option>
          </select>
          <select
            name="asociacion"
            value={form.asociacion}
            onChange={handleChange}
            className="border p-2 rounded-xl"
            required
          >
            <option value="">Asociación / Misión*</option>
            {ASOCIACIONES_MISION.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <FichaMedicaUpload
            archivoSeleccionado={fichaArchivo}
            onArchivoChange={setFichaArchivo}
            urlActual={fichaMedicaUrl}
            nombreActual={fichaMedicaNombre}
          />

          <button
            type="submit"
            className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-900 transition-all w-full disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar registro"}
          </button>
        </form>
      </div>
    </div>
  );
}
