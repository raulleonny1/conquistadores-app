"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  LOGO_AVENTUREROS,
  LOGO_CONQUISTADORES,
  LOGO_JA,
  LOGO_MINISTERIO_JOVEN,
} from "@/src/constants/programLogos";
import type { ProgramaClub } from "@/src/types/club";

const PROGRAMA_ESTILO: Record<
  ProgramaClub | "club",
  { titulo: string; subtitulo: string; gradiente: string; acento: string; logo: string }
> = {
  club: {
    titulo: "Panel del Club",
    subtitulo: "Administración y configuración",
    gradiente: "from-[#07060f] via-indigo-950 to-[#07060f]",
    acento: "text-indigo-400",
    logo: LOGO_MINISTERIO_JOVEN,
  },
  conquistadores: {
    titulo: "Conquistadores",
    subtitulo: "Acceso para miembros y directiva",
    gradiente: "from-[#07060f] via-red-950 to-[#07060f]",
    acento: "text-red-400",
    logo: LOGO_CONQUISTADORES,
  },
  aventureros: {
    titulo: "Aventureros",
    subtitulo: "Acceso para miembros y líderes",
    gradiente: "from-[#07060f] via-rose-950 to-[#07060f]",
    acento: "text-rose-400",
    logo: LOGO_AVENTUREROS,
  },
  ja: {
    titulo: "Jóvenes Adventistas",
    subtitulo: "Acceso para miembros y líderes JA",
    gradiente: "from-[#07060f] via-violet-950 to-[#07060f]",
    acento: "text-violet-400",
    logo: LOGO_JA,
  },
};

type LoginShellProps = {
  programa: ProgramaClub | "club";
  children: React.ReactNode;
  volverHref?: string;
};

export default function LoginShell({
  programa,
  children,
  volverHref = "/login",
}: LoginShellProps) {
  const estilo = PROGRAMA_ESTILO[programa];

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-b ${estilo.gradiente} font-sans`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.25), transparent 35%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <Link
          href={volverHref}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 p-3 ring-1 ring-white/20">
            <Image
              src={estilo.logo}
              alt={estilo.titulo}
              width={64}
              height={64}
              className="h-14 w-14 object-contain drop-shadow-lg"
              unoptimized
            />
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Ministerio Joven
          </p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            <span className={estilo.acento}>{estilo.titulo}</span>
          </h1>
          <p className="mt-2 text-sm text-white/70">{estilo.subtitulo}</p>
        </div>

        <p className="mb-4 text-center text-[10px] leading-relaxed text-white/40">
          No oficial IASD · Datos en la nube ·{" "}
          <Link href="/privacidad?volver=/login" className="text-sky-400/80 underline underline-offset-2 hover:text-sky-300">
            Privacidad
          </Link>
        </p>

        <div className="rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
