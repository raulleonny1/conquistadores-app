"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "../../src/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useSearchParams } from "next/navigation";

export default function FichaMedicaPage() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  const [form, setForm] = useState({
    nombre: "",
    nacimiento: "",
    direccion: "",
    telefono: "",
    padres: "",
    contactoEmergencia: "",
    relacionEmergencia: "",
    telefonoEmergencia: "",
    sangre: "",
    alergias: "",
    enfermedades: "",
    medicamentos: "",
    vacunas: "",
    seguro: "",
    seguroNumero: "",
    autorizacion: false,
    foto: ""
  });
  const [loading, setLoading] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleStartCamera = async () => {
      setShowCamera(true);
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 128, height: 128 } });
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        } catch (err) {
          alert("No se pudo acceder a la cámara");
          setShowCamera(false);
        }
      }
    };
    const handleCapture = () => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.drawImage(videoRef.current, 0, 0, 128, 128);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setForm(prev => ({ ...prev, foto: dataUrl }));
        // Detener cámara
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      }
    };
    const handleCancelCamera = () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    };
    useEffect(() => {
      if (!pin) return;
      const fetchFicha = async () => {
        const snap = await getDoc(doc(db, "fichasMedicas", pin));
        if (snap.exists()) {
          setForm(prev => ({ ...prev, ...snap.data() }));
        }
        setLoading(false);
      };
      fetchFicha();
    }, [pin]);
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === "checkbox") {
      checked = (e.target as HTMLInputElement).checked;
    }
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.foto) {
      alert("La foto tipo carnet es obligatoria.");
      return;
    }
    setGuardando(true);
    await setDoc(doc(db, "fichasMedicas", pin), form, { merge: true });
    setGuardando(false);
    alert("Ficha médica guardada correctamente.");
  };

  if (loading) {
    return <div className="text-center mt-10 text-lg text-green-700">Cargando ficha médica...</div>;
  }
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-lg mt-8">
      <button
        className="mb-4 bg-green-700 text-white px-4 py-2 rounded font-bold hover:bg-green-900 transition-all"
        onClick={() => window.location.href = `/miembros/dashboard?pin=${pin}`}
      >
        ← Regresar al dashboard
      </button>
      <h2 className="text-3xl font-black text-green-700 mb-6">Ficha Médica del Conquistador</h2>
        <div className="flex flex-col items-center mb-6">
          {form.foto ? (
            <img src={form.foto} alt="Foto tipo carnet" className="w-32 h-32 object-cover rounded-full border-4 border-green-300 shadow-md mb-2" />
          ) : (
            <div className="w-32 h-32 flex flex-col items-center justify-center bg-green-50 rounded-full border-4 border-green-200 text-green-600 shadow-md mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 17.707A8.966 8.966 0 0112 18c-4.418 0-8-3.582-8-8 0-4.418 3.582-8 8-8s8 3.582 8 8c0 1.657-.504 3.197-1.368 4.493M12 14v.01M12 10v.01M12 6v.01" />
              </svg>
              <span className="text-xs text-green-600">Sin foto</span>
            </div>
          )}
          <button type="button" className="bg-green-700 text-white px-4 py-1 rounded font-bold mt-2 mb-2" onClick={handleStartCamera}>Tomar foto</button>
          {showCamera && (
            <div className="flex flex-col items-center mt-2">
              <video ref={videoRef} width={128} height={128} className="rounded-full border-4 border-green-300 mb-2" />
              <canvas ref={canvasRef} width={128} height={128} className="hidden" />
              <div className="flex gap-2">
                <button type="button" className="bg-green-600 text-white px-3 py-1 rounded font-bold" onClick={handleCapture}>Capturar</button>
                <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded font-bold" onClick={handleCancelCamera}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" className="border p-2 rounded" />
          <input name="nacimiento" value={form.nacimiento} onChange={handleChange} placeholder="Edad / Fecha de nacimiento" className="border p-2 rounded" />
          <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className="border p-2 rounded" />
          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="border p-2 rounded" />
          <input name="padres" value={form.padres} onChange={handleChange} placeholder="Nombre de padres o representantes" className="border p-2 rounded" />
        </div>
        <div className="font-bold text-green-600 mt-4">Contacto de emergencia</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="contactoEmergencia" value={form.contactoEmergencia} onChange={handleChange} placeholder="Nombre" className="border p-2 rounded" />
          <input name="relacionEmergencia" value={form.relacionEmergencia} onChange={handleChange} placeholder="Relación" className="border p-2 rounded" />
          <input name="telefonoEmergencia" value={form.telefonoEmergencia} onChange={handleChange} placeholder="Teléfono" className="border p-2 rounded" />
        </div>
        <div className="font-bold text-green-600 mt-4">Información médica</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="sangre" value={form.sangre} onChange={handleChange} placeholder="Tipo de sangre" className="border p-2 rounded" />
          <input name="alergias" value={form.alergias} onChange={handleChange} placeholder="Alergias" className="border p-2 rounded" />
          <input name="enfermedades" value={form.enfermedades} onChange={handleChange} placeholder="Enfermedades o condiciones" className="border p-2 rounded" />
          <input name="medicamentos" value={form.medicamentos} onChange={handleChange} placeholder="Medicamentos actuales" className="border p-2 rounded" />
          <input name="vacunas" value={form.vacunas} onChange={handleChange} placeholder="Vacunas importantes" className="border p-2 rounded" />
        </div>
        <div className="font-bold text-green-600 mt-4">Seguro médico</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="seguro" value={form.seguro} onChange={handleChange} placeholder="Nombre del seguro" className="border p-2 rounded" />
          <input name="seguroNumero" value={form.seguroNumero} onChange={handleChange} placeholder="Número de afiliación" className="border p-2 rounded" />
        </div>
        <div className="font-bold text-green-600 mt-4">Autorización de padres</div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="autorizacion" checked={form.autorizacion} onChange={handleChange} />
          <span>Permiso para recibir atención médica en caso de emergencia</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="foto" value={form.foto} onChange={handleChange} placeholder="URL de foto tipo carnet" className="border p-2 rounded" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold mt-6" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar ficha médica"}
        </button>
      </form>
    </div>
  );
}
