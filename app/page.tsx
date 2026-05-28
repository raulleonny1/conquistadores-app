"use client";
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { resolverLoginPorPin } from "@/src/lib/loginPin";
import {
  LOGO_APLICACION_HEIGHT,
  LOGO_APLICACION_SRC,
  LOGO_APLICACION_VERSION,
  LOGO_APLICACION_WIDTH,
} from "@/src/constants/branding";
export default function Home() {
    // Función para agregar dígitos al PIN
    const handleKeypad = (num: string) => {
      if (verificandoRef.current || pin.length >= 4) return;
      setPin(pin + num);
    };
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);
  const verificandoRef = useRef(false);

  // Función para borrar el último dígito del PIN
  const handleDelete = () => {
    if (verificandoRef.current) return;
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  // Eliminar login alternativo, dejar solo el principal
  // Puedes mostrar un botón o redirigir manualmente a /login

  React.useEffect(() => {
    if (pin.length !== 4 || verificandoRef.current) return;

    verificandoRef.current = true;
    setVerificando(true);
    setError('');

    (async () => {
      const resultado = await resolverLoginPorPin(pin);
      if (!resultado.ok) {
        setError(resultado.mensaje);
        setTimeout(() => setPin(''), 600);
      }
      verificandoRef.current = false;
      setVerificando(false);
    })();
  }, [pin]);

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-slate-900">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-70"
        aria-hidden
      >
        <source src="/fondo-login.mp4" type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-slate-900/40 via-indigo-900/60 to-slate-900/90"
        aria-hidden
      />
      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md px-6 py-8 flex flex-col items-center">
        {/* Logo y encabezado */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative mx-auto mb-5 flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
            <div
              className="absolute inset-0 rounded-[2rem] bg-white/15 blur-xl"
              aria-hidden
            />
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/35 bg-white/20 p-3 shadow-2xl shadow-indigo-900/40 backdrop-blur-xl ring-1 ring-white/25">
              <Image
                key={LOGO_APLICACION_VERSION}
                src={LOGO_APLICACION_SRC}
                alt="Logo Club Caleb - Conquistadores"
                width={LOGO_APLICACION_WIDTH}
                height={LOGO_APLICACION_HEIGHT}
                priority
                unoptimized
                className="h-full w-full object-contain"
                sizes="(max-width: 640px) 128px, 144px"
              />
            </div>
          </div>
          <h1 className="mb-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
            CLUB <span className="text-indigo-400">CALEB</span>
          </h1>
          <p className="text-sm font-medium tracking-wide text-indigo-100/80 sm:text-base">
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
                type="button"
                disabled={verificando}
                onClick={() => handleKeypad(num.toString())}
                className="w-full aspect-square flex touch-manipulation select-none items-center justify-center rounded-2xl bg-white/5 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={verificando}
              onClick={() => handleKeypad('*')}
              className="w-full aspect-square flex touch-manipulation select-none items-center justify-center rounded-2xl bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20 transition-all active:scale-95 text-2xl font-bold disabled:opacity-50"
            >
              *
            </button>
            <button
              type="button"
              disabled={verificando}
              onClick={() => handleKeypad('0')}
              className="w-full aspect-square flex touch-manipulation select-none items-center justify-center rounded-2xl bg-white/5 hover:bg-white/20 active:bg-white/30 text-white text-2xl font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              disabled={verificando}
              onClick={handleDelete}
              className="w-full aspect-square flex touch-manipulation select-none items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 border border-red-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {/* Icono de borrar, puedes usar lucide-react si lo tienes */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Enlace de ayuda */}
          <button className="w-full mt-8 text-indigo-200/50 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            ¿Olvidaste tu PIN?
          </button>
          {verificando && (
            <p className="mt-4 text-center text-sm font-semibold text-indigo-200">Verificando PIN…</p>
          )}
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
