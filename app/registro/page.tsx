"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registrarClub } from "@/src/lib/clubs";
import { guardarSesionClub } from "@/src/lib/clubSession";
import { cerrarSesionAdmin, registrarAdminFirebase } from "@/src/lib/authClub";
import type { CargoDirectiva, ProgramaClub } from "@/src/types/club";
import { PAIS_POR_DEFECTO, PAISES_MUNDO } from "@/src/constants/paises";
import { CARGOS_DIRECTIVA } from "@/src/constants/cargosDirectiva";
import { PROGRAMAS_HOME } from "@/src/constants/programLogos";

const SUBTITULO_CLUB: Record<ProgramaClub, string> = {
  conquistadores: "Club de Conquistadores",
  aventureros: "Club de Aventureros",
  ja: "Club JA",
};

function nombrePrograma(id: ProgramaClub): string {
  return PROGRAMAS_HOME.find((p) => p.id === id)?.nombre ?? id;
}

export default function RegistroClubPage() {
  const [paso, setPaso] = useState<"programa" | "formulario">("programa");
  const [programa, setPrograma] = useState<ProgramaClub | null>(null);
  const [cargo, setCargo] = useState<CargoDirectiva>("Director/a");
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState(PAIS_POR_DEFECTO);
  const [responsable, setResponsable] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [exito, setExito] = useState<{
    slug: string;
    adminPin: string;
    nombre: string;
    programa: ProgramaClub;
    cargo: CargoDirectiva;
  } | null>(null);

  const seleccionarPrograma = (p: ProgramaClub) => {
    setPrograma(p);
    setPaso("formulario");
    setError("");
  };

  const volverAProgramas = () => {
    setPaso("programa");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!programa) {
      setError("Selecciona el programa del club.");
      return;
    }
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
      toast.error(authResult.mensaje);
      return;
    }

    const resultado = await registrarClub({
      nombre,
      ciudad,
      pais,
      responsable,
      cargo,
      email,
      whatsapp,
      programa,
      password,
      adminUid: authResult.uid,
    });

    setEnviando(false);

    if (!resultado.ok) {
      await cerrarSesionAdmin();
      setError(resultado.mensaje);
      toast.error(resultado.mensaje);
      return;
    }

    guardarSesionClub(resultado.club);
    setExito({
      slug: resultado.club.slug,
      adminPin: resultado.club.adminPin,
      nombre: resultado.club.nombre,
      programa,
      cargo,
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
          <p className="mt-2 text-sm text-slate-500">
            {nombrePrograma(exito.programa)} · {exito.cargo}
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

  if (paso === "programa") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <h1 className="text-4xl font-black">Registrar un club</h1>
          <p className="mt-3 max-w-xl text-slate-400">
            Elige qué programa del ministerio joven vas a registrar. Después indicarás tu cargo
            en la directiva y los datos del club.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PROGRAMAS_HOME.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => seleccionarPrograma(p.id)}
                className={`group relative overflow-hidden rounded-[2rem] border ${p.borde} ${p.fondo} p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${p.glow}`}
              >
                <div
                  className={`pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-linear-to-br ${p.gradiente} opacity-25 blur-2xl transition-opacity group-hover:opacity-45`}
                />
                <div className="relative mb-6 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <Image
                    src={p.logo}
                    alt={p.nombre}
                    width={96}
                    height={96}
                    className="mx-auto h-20 w-20 object-contain drop-shadow-lg sm:h-24 sm:w-24"
                    unoptimized
                  />
                </div>
                <p className="relative text-xl font-black">{p.nombre}</p>
                <p className="relative mt-2 text-sm text-slate-400">
                  {SUBTITULO_CLUB[p.id]}
                </p>
                <p className="relative mt-6 text-sm font-bold text-white/80 group-hover:text-white">
                  Registrar este club →
                </p>
              </button>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-slate-500">
            ¿Ya tienes un club?{" "}
            <Link href="/login/club" className="font-semibold text-indigo-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const programaActivo = PROGRAMAS_HOME.find((p) => p.id === programa);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button
          type="button"
          onClick={volverAProgramas}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Cambiar programa
        </button>

        {programaActivo && (
          <div
            className={`mb-6 inline-flex items-center gap-3 rounded-full border ${programaActivo.borde} ${programaActivo.fondo} px-4 py-2 text-sm font-bold`}
          >
            <Image
              src={programaActivo.logo}
              alt={programaActivo.nombre}
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              unoptimized
            />
            {SUBTITULO_CLUB[programaActivo.id]}
          </div>
        )}

        <h1 className="text-4xl font-black">Datos del club</h1>
        <p className="mt-3 text-slate-400">
          Completa la información para crear tu espacio en la plataforma.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              ¿Quién se registra? *
            </label>
            <select
              required
              value={cargo}
              onChange={(e) => setCargo(e.target.value as CargoDirectiva)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-indigo-500"
            >
              {CARGOS_DIRECTIVA.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Indica tu cargo en la directiva del club de {programa ? nombrePrograma(programa) : "…"}.
            </p>
          </div>

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
                {PAISES_MUNDO.map((nombrePais) => (
                  <option key={nombrePais} value={nombrePais} className="bg-slate-900 text-white">
                    {nombrePais}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold">
                Tu nombre completo ({cargo}) *
              </label>
              <input
                required
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder={`Nombre del ${cargo.toLowerCase()}`}
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
