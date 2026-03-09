"use client";
import React, { useState } from "react";
import { db } from "../../src/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function ConsejeroLogin() {
  const [pin, setPin] = useState("");
  type Consejero = {
    id: string;
    nombre: string;
    pin?: string;
    consejeroAsociado?: string;
    [key: string]: any;
  };
  const [consejero, setConsejero] = useState<Consejero | null>(null);
  const [nuevoPin, setNuevoPin] = useState("");
  const [step, setStep] = useState("login");
  const [error, setError] = useState("");

  // Buscar consejero por PIN
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const querySnapshot = await getDocs(collection(db, "consejeros"));
    const found = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return (data.pin === pin || (pin === "2026" && !data.pin));
    });
    if (found) {
      const data = found.data();
      setConsejero({
        id: found.id,
        nombre: data.nombre || "",
        pin: data.pin,
        consejeroAsociado: data.consejeroAsociado,
        ...data
      });
      if (!found.data().pin && pin === "1844") {
        setStep("cambiarPin");
      } else {
        setStep("dashboard");
      }
    } else {
      setError("PIN incorrecto");
    }
  };

  // Cambiar PIN
  const handleChangePin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^[0-9]{4}$/.test(nuevoPin)) {
      setError("El PIN debe tener 4 dígitos");
      return;
    }
    if (!consejero) return;
    await updateDoc(doc(db, "consejeros", consejero.id), { pin: nuevoPin });
    setConsejero({ ...consejero, pin: nuevoPin, id: String(consejero.id) });
    setStep("dashboard");
  };

  // Cerrar sesión
  const handleLogout = () => {
    setPin("");
    setConsejero(null);
    setNuevoPin("");
    setStep("login");
    setError("");
  };

  // Dashboard real
  if (step === "dashboard" && consejero) {
    const ConsejeroDashboard = require("./dashboard").default;
    return (
      <>
        <ConsejeroDashboard consejeroId={consejero.id} />
        <div className="flex justify-center mt-4">
          <button onClick={handleLogout} className="bg-pink-600 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-pink-800 transition text-lg">
            Cerrar sesión
          </button>
        </div>
      </>
    );
  }

  // Cambiar PIN
  if (step === "cambiarPin" && consejero) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-green-200 via-blue-100 to-yellow-100">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
          <h2 className="text-3xl font-bold text-green-700 mb-4">Bienvenido, {consejero.nombre}</h2>
          <p className="mb-2 text-blue-700">Por seguridad, cambia tu PIN de acceso (4 dígitos):</p>
          <form onSubmit={handleChangePin} className="space-y-3 w-full">
            <input
              type="password"
              value={nuevoPin}
              onChange={e => setNuevoPin(e.target.value)}
              placeholder="Nuevo PIN (4 dígitos)"
              className="w-full p-2 rounded border text-center text-xl"
              maxLength={4}
              pattern="[0-9]{4}"
              required
            />
            {error && <div className="text-red-600 font-bold">{error}</div>}
            <button className="bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-green-900 transition text-lg">
              Cambiar PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Login
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-blue-100 to-yellow-100">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold text-green-700 mb-6">Login Consejero</h2>
        <form onSubmit={handleLogin} className="space-y-4 w-full">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN de acceso"
            className="w-full p-2 rounded border text-center text-xl"
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />
          {error && <div className="text-red-600 font-bold">{error}</div>}
          <button className="bg-blue-700 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-blue-900 transition text-lg">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
