"use client";

import React, { useEffect, useRef, useState } from "react";
import PinKeypad from "@/src/components/auth/PinKeypad";
import { slugificarNombre } from "@/src/lib/clubs";
import { obtenerClubSlugSesion } from "@/src/lib/clubSession";
import { resolverLoginPorPin } from "@/src/lib/loginPin";
import type { ProgramaClub } from "@/src/types/club";

type LoginConPinProps = {
  programa: ProgramaClub | "club";
  tituloPin?: string;
};

export default function LoginConPin({ programa, tituloPin }: LoginConPinProps) {
  const [paso, setPaso] = useState<"codigo" | "pin">("codigo");
  const [codigoClub, setCodigoClub] = useState(() => obtenerClubSlugSesion() ?? "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verificando, setVerificando] = useState(false);
  const verificandoRef = useRef(false);

  useEffect(() => {
    if (paso !== "pin" || pin.length !== 4 || verificandoRef.current) return;

    verificandoRef.current = true;
    setVerificando(true);
    setError("");

    (async () => {
      const resultado = await resolverLoginPorPin(pin, {
        clubSlug: codigoClub,
        programa,
      });
      if (!resultado.ok) {
        setError(resultado.mensaje);
        setTimeout(() => setPin(""), 600);
      }
      verificandoRef.current = false;
      setVerificando(false);
    })();
  }, [pin, paso, codigoClub, programa]);

  if (paso === "codigo") {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-white/90">
          Código de tu club
        </label>
        <p className="mb-4 text-xs text-white/50">
          Es el identificador que recibiste al registrar el club (ej: club-norte-quito).
        </p>
        <input
          type="text"
          value={codigoClub}
          onChange={(e) => setCodigoClub(slugificarNombre(e.target.value) || e.target.value)}
          placeholder="codigo-del-club"
          className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/40"
        />
        {error && (
          <p className="mb-4 text-center text-sm font-bold text-red-400">{error}</p>
        )}
        <button
          type="button"
          disabled={!codigoClub.trim()}
          onClick={() => {
            setError("");
            setPaso("pin");
          }}
          className="w-full rounded-xl bg-white py-3 font-bold text-slate-900 transition-all hover:bg-white/90 disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setPaso("codigo");
          setPin("");
          setError("");
        }}
        className="mb-4 text-xs font-semibold text-white/50 hover:text-white"
      >
        ← Cambiar club ({codigoClub})
      </button>

      <PinKeypad
        pin={pin}
        onPinChange={setPin}
        disabled={verificando}
        titulo={tituloPin ?? "Ingresa tu PIN"}
      />

      {verificando && (
        <p className="mt-4 text-center text-sm font-semibold text-white/70">
          Verificando…
        </p>
      )}
      {error && (
        <p className="mt-4 animate-pulse text-center text-sm font-bold text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
