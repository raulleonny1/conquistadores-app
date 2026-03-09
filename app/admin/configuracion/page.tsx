// Si tienes enlaces a consejero, usa:
"use client";
import React, { useState } from "react";
import { db } from "../../../src/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function ConfiguracionAdmin() {
  const [resetPins, setResetPins] = useState<{nombre: string, nuevoPin: string}[]>([]);
  const [loadingPins, setLoadingPins] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [consejeros, setConsejeros] = useState<{id: string, nombre: string, pin?: string}[]>([]);
  const [loadingConsejeros, setLoadingConsejeros] = useState(false);

  // Cargar consejeros y sus pines actuales
  React.useEffect(() => {
    async function fetchConsejeros() {
      setLoadingConsejeros(true);
      const snapshot = await getDocs(collection(db, "consejeros"));
      setConsejeros(snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
      setLoadingConsejeros(false);
    }
    fetchConsejeros();
  }, []);

  // Resetear todos los pines
  const handleResetPins = async () => {
    setLoadingPins(true);
    setError("");
    setSuccess("");
    try {
      const snapshot = await getDocs(collection(db, "consejeros"));
      const updates: {nombre: string, nuevoPin: string}[] = [];
      for (const docSnap of snapshot.docs) {
        const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
        await updateDoc(doc(db, "consejeros", docSnap.id), { pin: nuevoPin });
        updates.push({ nombre: docSnap.data().nombre || docSnap.id, nuevoPin });
      }
      setResetPins(updates);
      setSuccess("¡PINs reseteados correctamente!");
      // Refrescar lista de consejeros
      const refreshed = await getDocs(collection(db, "consejeros"));
      setConsejeros(refreshed.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
    } catch (err) {
      setError("Error al resetear los PINs. Intenta de nuevo.");
    }
    setLoadingPins(false);
  };

  // Resetear pin individual
  const handleResetPinIndividual = async (id: string, nombre: string) => {
    setLoadingPins(true);
    setError("");
    setSuccess("");
    try {
      const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(db, "consejeros", id), { pin: nuevoPin });
      setSuccess(`PIN de ${nombre} reseteado correctamente`);
      setResetPins([{ nombre, nuevoPin }]);
      // Refrescar lista de consejeros
      const refreshed = await getDocs(collection(db, "consejeros"));
      setConsejeros(refreshed.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
    } catch (err) {
      setError("Error al resetear el PIN. Intenta de nuevo.");
    }
    setLoadingPins(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-blue-50 to-green-100 py-10">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center border-l-4 border-yellow-500">
        <button
          onClick={() => window.location.href = '/admin'}
          className="self-start mb-4 bg-yellow-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-yellow-800 transition"
        >
          ← Volver al menú principal
        </button>
        <h1 className="text-3xl font-bold text-yellow-700 mb-2">Configuración</h1>
        <p className="text-yellow-800 mb-6">Ajustes y opciones generales del sistema.</p>
        <div className="bg-white border-l-4 border-pink-500 rounded-xl shadow p-6 flex flex-col items-start mb-4 w-full">
          <h3 className="text-lg font-bold text-pink-700 mb-2">Resetear PIN de Consejeros</h3>
          <p className="mb-2 text-pink-800">Genera nuevos PINs aleatorios para todos los consejeros o resetea individualmente.</p>
          <div className="flex flex-row gap-4 mb-4">
            <button onClick={handleResetPins} className="bg-pink-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-pink-800 transition" disabled={loadingPins}>
              {loadingPins ? 'Reseteando...' : 'Resetear TODOS los PINs'}
            </button>
          </div>
          {error && <div className="text-red-600 font-bold mb-2">{error}</div>}
          {success && <div className="text-green-600 font-bold mb-2">{success}</div>}
          {resetPins.length > 0 && (
            <div className="w-full mt-2">
              <h4 className="font-semibold text-pink-700 mb-1">Nuevos PINs:</h4>
              <ul className="text-sm">
                {resetPins.map((c, i) => (
                  <li key={i} className="mb-1"><span className="font-bold">{c.nombre}:</span> <span className="font-mono">{c.nuevoPin}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="bg-white border-l-4 border-blue-500 rounded-xl shadow p-6 flex flex-col items-start mb-4 w-full">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Resetear PIN individual</h3>
          <p className="mb-2 text-blue-800">Puedes ver el PIN actual de cada consejero y resetearlo individualmente.</p>
          {loadingConsejeros ? (
            <div className="text-blue-600">Cargando consejeros...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-1">Nombre</th>
                  <th className="text-left p-1">PIN actual</th>
                  <th className="text-left p-1">Acción</th>
                </tr>
              </thead>
              <tbody>
                {consejeros.map(c => (
                  <tr key={c.id}>
                    <td className="p-1 font-semibold">{c.nombre}</td>
                    <td className="p-1 font-mono">{c.pin || '-'}</td>
                    <td className="p-1">
                      <button onClick={() => handleResetPinIndividual(c.id, c.nombre)} className="bg-blue-600 text-white px-2 py-1 rounded font-bold shadow hover:bg-blue-800 transition" disabled={loadingPins}>
                        Resetear PIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
