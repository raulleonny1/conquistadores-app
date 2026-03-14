"use client";
import React, { useState } from "react";
import { db } from "../../src/firebase";
import { doc, getDoc } from "firebase/firestore";
import CompletarRegistroAspirante from "./completar-registro";

export default function LoginAspirante() {
  const [pin, setPin] = useState("");
  const [registroIncompleto, setRegistroIncompleto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const camposObligatorios = ["nombre", "edad", "nacimiento", "sexo", "direccion", "telefono", "email", "iglesia", "club"];

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const ref = doc(db, "aspirantesGuiaMayor", pin);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError("PIN inválido o aspirante no registrado.");
        setLoading(false);
        return;
      }
      const data = snap.data();
      const incompleto = !camposObligatorios.every(c => data[c]);
      setRegistroIncompleto(incompleto);
      if (!incompleto) {
        // Aquí iría la redirección al dashboard del sistema
        window.location.href = `/aspirante/dashboard?pin=${pin}`;
      }
    } catch (err) {
      setError("Error al consultar datos.");
    }
    setLoading(false);
  };

  if (registroIncompleto) {
    return <CompletarRegistroAspirante pin={pin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700">Ingreso Aspirante a Guía Mayor</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <input
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="PIN de acceso"
          className="border p-2 rounded-xl mb-4 w-full"
          maxLength={6}
        />
        <button
          onClick={handleLogin}
          className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-900 transition-all w-full"
          disabled={loading || !pin}
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}
