"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";
import {
  LOGO_MINISTERIO_JOVEN,
  PROGRAMAS_HOME,
} from "@/src/constants/programLogos";

const ADMIN_OPCION = {
  href: "/login/club",
  titulo: "Administración del club",
  descripcion: "Directores, secretaría y configuración general",
  logo: LOGO_MINISTERIO_JOVEN,
  gradiente: "from-indigo-500 to-violet-600",
};

export default function LoginHubPage() {
  return (
    <div className="min-h-screen bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-2xl px-5 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mb-10 flex items-center gap-4">
          <Image
            src={LOGO_MINISTERIO_JOVEN}
            alt="Ministerio Joven"
            width={56}
            height={56}
            className="rounded-2xl ring-2 ring-white/10"
            unoptimized
          />
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Iniciar sesión</h1>
            <p className="mt-1 text-white/50">Elige cómo quieres entrar</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={ADMIN_OPCION.href}
            className="group flex items-center gap-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/15"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 p-2">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black">{ADMIN_OPCION.titulo}</p>
              <p className="text-sm text-white/50">{ADMIN_OPCION.descripcion}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>

          {PROGRAMAS_HOME.map((p) => (
            <Link
              key={p.id}
              href={p.login}
              className={`group flex items-center gap-5 rounded-2xl border ${p.borde} ${p.fondo} p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${p.glow}`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <Image
                  src={p.logo}
                  alt={p.nombre}
                  width={48}
                  height={48}
                  className="h-10 w-10 object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black">{p.nombre}</p>
                <p className="text-sm text-white/50">{p.descripcion}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-white/40">
          ¿Tu club aún no está registrado?{" "}
          <Link href="/registro" className="font-bold text-fuchsia-400 hover:underline">
            Regístralo aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
