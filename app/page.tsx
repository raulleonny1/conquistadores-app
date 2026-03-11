
"use client";
import React, { useState } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
    // Función para agregar dígitos al PIN
    const handleKeypad = (num: string) => {
      if (pin.length < 4) {
        setPin(pin + num);
      }
    };
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Función para borrar el último dígito del PIN
  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  // Eliminar login alternativo, dejar solo el principal
  // Puedes mostrar un botón o redirigir manualmente a /login

  React.useEffect(() => {
    if (pin.length === 4) {
      if (pin === '1844') {
        setError('');
        router.push('/admin');
        return;
      }
      if (pin === '*611') {
        setError('');
        router.push('/admin/evaluar-guia-mayor');
        return;
      }
      (async () => {
        // Buscar consejero con ese PIN
        const qConsejero = query(collection(db, 'consejeros'), where('pin', '==', pin));
        const snapshotConsejero = await getDocs(qConsejero);
        if (!snapshotConsejero.empty) {
          const consejeroDoc = snapshotConsejero.docs[0];
          setError('');
          router.push(`/consejero/${consejeroDoc.id}`);
          return;
        }
        // Buscar miembro conquistador con ese PIN en la colección correcta
        const qMiembro = query(collection(db, 'RegistroConquis'), where('pin', '==', pin));
        const snapshotMiembro = await getDocs(qMiembro);
        if (!snapshotMiembro.empty) {
          setError('');
          router.push(`/miembros/dashboard?pin=${pin}`);
          return;
        }
        setError('PIN incorrecto.');
        setTimeout(() => setPin(''), 600);
      })();
    }
  }, [pin]);

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-slate-900">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
      >
        <source src="/fondo-login.mp4" type="video/mp4" />
        Tu navegador no soporta el video de fondo.
      </video>
      {/* Overlay para glassmorphism */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-900/40 via-indigo-900/60 to-slate-900/90 z-0" />
      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md px-6 py-8 flex flex-col items-center">
        {/* Logo y encabezado */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white/20 backdrop-blur-xl p-4 rounded-4xl border border-white/30 inline-flex mb-4 shadow-2xl shadow-indigo-500/20">
            <Image src="/logoconquis.png" alt="Logo Conquistadores" width={80} height={80} className="w-20 h-20" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-1">
            CLUB <span className="text-indigo-400">CALEB</span>
          </h1>
          <p className="text-indigo-100/80 font-medium text-sm tracking-wide">
            CENTRO DE COMANDO
          </p>
        </div>
        {/* Contenedor del teclado / input */}
        <div className="w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl relative">
          <div className="text-center mb-8">
            <h2 className="text-white text-lg font-bold mb-4">Ingresa tu PIN</h2>
            {/* Visualizador de PIN (dots) */}
            <div className="flex justify-center gap-4 mb-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    pin.length > i
                      ? 'bg-white border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                      : 'bg-transparent border-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Teclado numérico estilo pro */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeypad(num.toString())}
                className="w-full aspect-square flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-bold border border-white/10 transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleKeypad('*')}
              className="w-full aspect-square flex items-center justify-center rounded-2xl bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20 transition-all active:scale-95 text-2xl font-bold"
            >
              *
            </button>
            <button
              onClick={() => handleKeypad('0')}
              className="w-full aspect-square flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-bold border border-white/10 transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-full aspect-square flex items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 border border-red-500/20 transition-all active:scale-95"
            >
              {/* Icono de borrar, puedes usar lucide-react si lo tienes */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Enlace de ayuda */}
          <button className="w-full mt-8 text-indigo-200/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            ¿Olvidaste tu PIN?
          </button>
          {error && <div className="text-red-400 mt-4 text-center font-bold text-sm animate-pulse">{error}</div>}
        </div>
        {/* Footer */}
        <p className="mt-12 text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">
          Preparados para servir • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
