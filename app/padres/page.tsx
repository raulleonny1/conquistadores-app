"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Heart, Users } from "lucide-react";
import { slugificarNombre } from "@/src/lib/clubs";
import { irARuta } from "@/src/lib/navegacion";

export default function PadresLoginPage() {
  const [codigoClub, setCodigoClub] = useState("");
  const [pinHijo, setPinHijo] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const slug = slugificarNombre(codigoClub);
    const pin = pinHijo.trim();
    if (!slug || pin.length < 4) {
      setError("Ingresa el código del club y el PIN de tu hijo/a.");
      return;
    }
    irARuta(`/padres/dashboard?club=${encodeURIComponent(slug)}&pin=${encodeURIComponent(pin)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-sky-950 via-slate-950 to-slate-950 text-white">
      <div className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-300/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Inicio
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20">
            <Users className="h-8 w-8 text-sky-400" />
          </div>
          <h1 className="text-3xl font-black">Portal de padres</h1>
          <p className="mt-2 text-sm text-slate-400">
            Consulta el avance de tu hijo/a: puntos, insignias y actividades.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-sky-500/20 bg-white/5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-sky-100">Código del club</label>
            <input
              value={codigoClub}
              onChange={(e) => setCodigoClub(slugificarNombre(e.target.value) || e.target.value)}
              placeholder="codigo-del-club"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 outline-none focus:border-sky-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-sky-100">PIN de tu hijo/a</label>
            <input
              value={pinHijo}
              onChange={(e) => setPinHijo(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="4 dígitos"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 font-mono tracking-widest outline-none focus:border-sky-400"
            />
          </div>

          {error && <p className="text-center text-sm font-semibold text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-sky-500 py-3 font-bold text-slate-950 hover:bg-sky-400"
          >
            Ver avance
          </button>
        </form>

        <p className="mt-6 flex items-start gap-2 text-center text-xs leading-relaxed text-slate-500">
          <Heart className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          Solo lectura. El PIN lo proporciona el director o líder del club. No compartas el PIN públicamente.
        </p>
      </div>
    </div>
  );
}
