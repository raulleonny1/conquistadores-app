"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Compass, Flame, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registrarClub } from "@/src/lib/clubs";
import { guardarSesionClub } from "@/src/lib/clubSession";
import { cerrarSesionAdmin, registrarAdminFirebase } from "@/src/lib/authClub";
import type { ProgramaClub } from "@/src/types/club";
import { PAIS_POR_DEFECTO, PAISES_MUNDO } from "@/src/constants/paises";

const PROGRAMAS_OPCIONES: {
  id: ProgramaClub;
  nombre: string;
  icono: typeof Compass;
  color: string;
}[] = [
  { id: "conquistadores", nombre: "Conquistadores", icono: Compass, color: "border-emerald-500/50 bg-emerald-500/10" },
  { id: "aventureros", nombre: "Aventureros", icono: Mountain, color: "border-amber-500/50 bg-amber-500/10" },
  { id: "ja", nombre: "Jóvenes Adventistas", icono: Flame, color: "border-violet-500/50 bg-violet-500/10" },
];

export default function RegistroClubPage() {
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [responsable, setResponsable] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [programas, setProgramas] = useState<ProgramaClub[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [exito, setExito] = useState<{
    slug: string;
    adminPin: string;
    nombre: string;
  } | null>(null);

  const togglePrograma = (p: ProgramaClub) => {
    setProgramas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!aceptaPrivacidad) {
      setError("Debes aceptar la política de privacidad para registrar tu club.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    const authResult = await registrarAdminFirebase(email, password);
    if (!authResult.ok) {
      setEnviando(false);
      setError(authResult.mensaje);
      return;
    }

    const resultado = await registrarClub({
      nombre,
      ciudad,
      pais,
      responsable,
      email,
      whatsapp,
      programas,
      password,
      adminUid: authResult.uid,
    });

    setEnviando(false);

    if (!resultado.ok) {
      await cerrarSesionAdmin();
      setError(resultado.mensaje);
      return;
    }

    guardarSesionClub(resultado.club);
    setExito({
      slug: resultado.club.slug,
      adminPin: resultado.club.adminPin,
      nombre: resultado.club.nombre,
    });
  };

  if (exito) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 text-center text-white shadow-2xl">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-400" />
          <h1 className="text-2xl font-black">¡Club registrado!</h1>
          <p className="mt-2 text-slate-400">
            <strong className="text-white">{exito.nombre}</strong> ya tiene su espacio
            independiente.
          </p>

          <div className="mt-8 space-y-4 rounded-2xl bg-white/5 p-6 text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Código del club
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-emerald-400">{exito.slug}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                PIN de administrador
              </p>
              <p className="mt-1 font-mono text-3xl font-black tracking-widest text-white">
                {exito.adminPin}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-amber-300/90">
            Guarda el código y el PIN. También puedes entrar con tu correo y contraseña en{" "}
            <strong className="text-white">/login/club</strong>.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild className="h-12 rounded-2xl font-bold">
              <Link href={`/login/club`}>Ir al panel del club</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 font-bold text-white">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <h1 className="text-4xl font-black">Registrar un club</h1>
        <p className="mt-3 text-slate-400">
          Crea tu espacio independiente en la plataforma del Ministerio Joven.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold">Nombre del club *</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Club Conquistadores Norte"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Ciudad *</label>
              <input
                required
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Quito, Madrid, São Paulo…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">País *</label>
              <select
                required
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              >
                {PAISES_MUNDO.map((nombre) => (
                  <option key={nombre} value={nombre} className="bg-slate-900 text-white">
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold">Responsable / Director *</label>
              <input
                required
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nombre del director o pastor"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Correo *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="club@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Usarás este correo para entrar al panel de administración.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Contraseña *</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Confirmar contraseña *</label>
              <input
                required
                type="password"
                minLength={6}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0999999999"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold">
              Programas del ministerio joven *
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {PROGRAMAS_OPCIONES.map((p) => {
                const Icono = p.icono;
                const activo = programas.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePrograma(p.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      activo
                        ? `${p.color} ring-2 ring-white/30`
                        : "border-white/10 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    <Icono className={`mb-2 h-6 w-6 ${activo ? "text-white" : "text-slate-500"}`} />
                    <p className="text-sm font-bold">{p.nombre}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
            <input
              type="checkbox"
              checked={aceptaPrivacidad}
              onChange={(e) => setAceptaPrivacidad(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 accent-sky-500"
            />
            <span className="text-sm leading-relaxed text-slate-300">
              Acepto la{" "}
              <Link
                href="/privacidad?volver=/registro"
                className="font-bold text-sky-400 underline underline-offset-2"
              >
                política de privacidad
              </Link>
              . Confirmo que mi club es responsable de los datos de sus miembros y del
              cumplimiento de las leyes de mi país (incluido el consentimiento para menores).
            </span>
          </label>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={enviando || !aceptaPrivacidad}
            className="h-12 w-full rounded-2xl bg-linear-to-r from-indigo-500 to-violet-600 text-base font-bold"
          >
            {enviando ? "Registrando…" : "Crear mi club"}
          </Button>

          <p className="text-center text-sm text-slate-500">
            ¿Ya tienes un club?{" "}
            <Link href="/login/club" className="font-semibold text-indigo-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
