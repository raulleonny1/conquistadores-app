"use client";

import { useEffect, useRef, useState } from "react";
import { iniciarSesionAdminEmail, iniciarSesionAdminPin } from "@/src/lib/authClub";
import { slugificarNombre } from "@/src/lib/clubs";
import { obtenerClubSlugSesion } from "@/src/lib/clubSession";
import PinKeypad from "@/src/components/auth/PinKeypad";

type Modo = "email" | "pin";

export default function LoginClubAdmin() {
  const [modo, setModo] = useState<Modo>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigoClub, setCodigoClub] = useState(() => obtenerClubSlugSesion() ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verificando, setVerificando] = useState(false);
  const verificandoRef = useRef(false);

  useEffect(() => {
    if (modo !== "pin" || pin.length !== 4 || verificandoRef.current) return;
    verificandoRef.current = true;
    setVerificando(true);
    setError("");
    (async () => {
      const res = await iniciarSesionAdminPin(codigoClub, pin);
      if (!res.ok) {
        setError(res.mensaje);
        setTimeout(() => setPin(""), 600);
      }
      verificandoRef.current = false;
      setVerificando(false);
    })();
  }, [pin, modo, codigoClub]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerificando(true);
    const res = await iniciarSesionAdminEmail(email, password);
    if (!res.ok) setError(res.mensaje);
    setVerificando(false);
  };


  return (
    <div>
      <div className="mb-6 flex rounded-xl bg-white/10 p-1">
        <button
          type="button"
          onClick={() => { setModo("email"); setError(""); }}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
            modo === "email" ? "bg-white text-slate-900" : "text-white/70"
          }`}
        >
          Correo
        </button>
        <button
          type="button"
          onClick={() => { setModo("pin"); setError(""); }}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
            modo === "pin" ? "bg-white text-slate-900" : "text-white/70"
          }`}
        >
          PIN
        </button>
      </div>

      {modo === "email" ? (
        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/90">
              Correo del club
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/40"
              placeholder="admin@tuclub.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/90">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/40"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={verificando}
            className="w-full rounded-xl bg-white py-3 font-bold text-slate-900 hover:bg-white/90 disabled:opacity-50"
          >
            {verificando ? "Entrando…" : "Entrar al panel"}
          </button>
        </form>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-semibold text-white/90">
            Código del club
          </label>
          <input
            type="text"
            value={codigoClub}
            onChange={(e) => setCodigoClub(slugificarNombre(e.target.value) || e.target.value)}
            className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none"
            placeholder="codigo-del-club"
          />
          <PinKeypad
            pin={pin}
            onPinChange={setPin}
            disabled={verificando}
            titulo="PIN de administrador"
          />
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-sm font-bold text-red-400">{error}</p>
      )}
    </div>
  );
}
