"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Layers,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROGRAMAS_HOME } from "@/src/constants/programLogos";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import {
  type AlcanceTarjetaRegistro,
  nombreProgramaClub,
  tarjetaVisibleParaClub,
} from "@/src/lib/registrosPorPrograma";
import { rutaConClub } from "@/src/lib/rutasClub";
import type { ProgramaClub } from "@/src/types/club";

type TarjetaRegistro = {
  id: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  alcance: AlcanceTarjetaRegistro[];
  icono?: React.ReactNode;
  logo?: string;
  gradiente?: string;
  borde?: string;
  fondo?: string;
  glow?: string;
  tagline?: string;
  destacado?: boolean;
};

const SECCIONES: {
  id: string;
  etiqueta: string;
  subtitulo: string;
  icono: React.ReactNode;
  tarjetas: TarjetaRegistro[];
}[] = [
  {
    id: "miembros",
    etiqueta: "Registro de miembros",
    subtitulo: "Altas, edición y listas del club",
    icono: <UserPlus className="h-5 w-5 text-cyan-400" />,
    tarjetas: [
      {
        id: "conquis",
        titulo: "Conquistadores",
        descripcion: "Registro completo, PIN, unidad y datos del club.",
        ruta: "/admin/RegistroConquis",
        alcance: ["conquistadores"],
        logo: PROGRAMAS_HOME[0].logo,
        gradiente: PROGRAMAS_HOME[0].gradiente,
        borde: PROGRAMAS_HOME[0].borde,
        fondo: PROGRAMAS_HOME[0].fondo,
        glow: PROGRAMAS_HOME[0].glow,
        tagline: PROGRAMAS_HOME[0].tagline,
      },
      {
        id: "aventureros",
        titulo: "Aventureros",
        descripcion: "Clases, insignias y seguimiento aventurero.",
        ruta: "/admin/aventureros",
        alcance: ["aventureros"],
        logo: PROGRAMAS_HOME[1].logo,
        gradiente: PROGRAMAS_HOME[1].gradiente,
        borde: PROGRAMAS_HOME[1].borde,
        fondo: PROGRAMAS_HOME[1].fondo,
        glow: PROGRAMAS_HOME[1].glow,
        tagline: PROGRAMAS_HOME[1].tagline,
      },
      {
        id: "ja",
        titulo: "Jóvenes Adventistas",
        descripcion: "Registro de jóvenes, grupos y progreso JA.",
        ruta: "/admin/ja",
        alcance: ["ja"],
        logo: PROGRAMAS_HOME[2].logo,
        gradiente: PROGRAMAS_HOME[2].gradiente,
        borde: PROGRAMAS_HOME[2].borde,
        fondo: PROGRAMAS_HOME[2].fondo,
        glow: PROGRAMAS_HOME[2].glow,
        tagline: PROGRAMAS_HOME[2].tagline,
      },
      {
        id: "aspirante",
        titulo: "Aspirante a Guía Mayor",
        descripcion: "Camino hacia Guía Mayor, datos y evaluación.",
        ruta: "/admin/aspirante",
        alcance: ["conquistadores"],
        icono: <Star className="h-8 w-8 text-amber-400" />,
        gradiente: "from-amber-500 via-orange-500 to-yellow-500",
        borde: "border-amber-400/40",
        fondo: "bg-amber-500/10",
        glow: "shadow-amber-500/30",
        tagline: "Guía Mayor",
      },
    ],
  },
  {
    id: "estructura",
    etiqueta: "Estructura del club",
    subtitulo: "Unidades, liderazgo y especialidades",
    icono: <Layers className="h-5 w-5 text-fuchsia-400" />,
    tarjetas: [
      {
        id: "unidades",
        titulo: "Unidades",
        descripcion: "Organiza unidades, nombres y consolidación.",
        ruta: "/admin/unidades",
        alcance: ["conquistadores"],
        icono: <Layers className="h-8 w-8 text-purple-400" />,
        gradiente: "from-purple-600 via-violet-500 to-fuchsia-500",
        borde: "border-purple-400/40",
        fondo: "bg-purple-500/10",
        glow: "shadow-purple-500/30",
        tagline: "Organización",
      },
      {
        id: "consejeros",
        titulo: "Consejeros",
        descripcion: "Directores de unidad, PIN y asignaciones.",
        ruta: "/admin/consejero",
        alcance: ["conquistadores"],
        icono: <Users className="h-8 w-8 text-emerald-400" />,
        gradiente: "from-emerald-600 via-teal-500 to-cyan-500",
        borde: "border-emerald-400/40",
        fondo: "bg-emerald-500/10",
        glow: "shadow-emerald-500/30",
        tagline: "Liderazgo",
      },
      {
        id: "especialidades",
        titulo: "Especialidades",
        descripcion: "Catálogo de especialidades y áreas del club.",
        ruta: "/admin/especialidades",
        alcance: ["conquistadores"],
        icono: <Award className="h-8 w-8 text-yellow-400" />,
        gradiente: "from-yellow-500 via-amber-500 to-orange-500",
        borde: "border-yellow-400/40",
        fondo: "bg-yellow-500/10",
        glow: "shadow-yellow-500/30",
        tagline: "Catálogo",
      },
    ],
  },
  {
    id: "puntos",
    etiqueta: "Puntos y actividades",
    subtitulo: "Calificaciones por persona, unidad o grupo",
    icono: <ClipboardList className="h-5 w-5 text-rose-400" />,
    tarjetas: [
      {
        id: "act-conquis",
        titulo: "Puntos — Conquistadores",
        descripcion: "Por persona o por unidad (toda la unidad de una vez).",
        ruta: "/admin/registros/actividades-conquistadores",
        alcance: ["conquistadores"],
        logo: PROGRAMAS_HOME[0].logo,
        gradiente: PROGRAMAS_HOME[0].gradiente,
        borde: PROGRAMAS_HOME[0].borde,
        fondo: PROGRAMAS_HOME[0].fondo,
        glow: PROGRAMAS_HOME[0].glow,
        tagline: "Por unidad",
      },
      {
        id: "act-aventureros",
        titulo: "Puntos — Aventureros",
        descripcion: "Actividades del catálogo y modo por club/grupo.",
        ruta: "/admin/registros/actividades-aventureros",
        alcance: ["aventureros"],
        logo: PROGRAMAS_HOME[1].logo,
        gradiente: PROGRAMAS_HOME[1].gradiente,
        borde: PROGRAMAS_HOME[1].borde,
        fondo: PROGRAMAS_HOME[1].fondo,
        glow: PROGRAMAS_HOME[1].glow,
        tagline: "Por grupo",
      },
      {
        id: "act-ja",
        titulo: "Puntos — JA",
        descripcion: "Calificaciones y puntos del ministerio juvenil.",
        ruta: "/admin/registros/actividades-ja",
        alcance: ["ja"],
        logo: PROGRAMAS_HOME[2].logo,
        gradiente: PROGRAMAS_HOME[2].gradiente,
        borde: PROGRAMAS_HOME[2].borde,
        fondo: PROGRAMAS_HOME[2].fondo,
        glow: PROGRAMAS_HOME[2].glow,
        tagline: "Por grupo",
      },
      {
        id: "act-aspirantes",
        titulo: "Puntos — Aspirantes",
        descripcion: "Por persona o por asociación / misión (grupo completo).",
        ruta: "/admin/registros/actividades-aspirantes",
        alcance: ["conquistadores"],
        icono: <Star className="h-8 w-8 text-orange-400" />,
        gradiente: "from-orange-500 via-rose-500 to-pink-500",
        borde: "border-orange-400/40",
        fondo: "bg-orange-500/10",
        glow: "shadow-orange-500/30",
        tagline: "Aspirantes",
      },
      {
        id: "act-consejeros",
        titulo: "Puntos — Consejeros",
        descripcion: "Registro de puntos para consejeros y asociados.",
        ruta: "/admin/registros/actividades-consejeros",
        alcance: ["conquistadores"],
        icono: <Users className="h-8 w-8 text-teal-400" />,
        gradiente: "from-teal-600 via-emerald-500 to-green-500",
        borde: "border-teal-400/40",
        fondo: "bg-teal-500/10",
        glow: "shadow-teal-500/30",
        tagline: "Consejería",
        destacado: true,
      },
    ],
  },
  {
    id: "rankings",
    etiqueta: "Rankings",
    subtitulo: "Competencias y tablas en vivo",
    icono: <Trophy className="h-5 w-5 text-yellow-400" />,
    tarjetas: [
      {
        id: "rank-conquis",
        titulo: "Ranking Conquistadores",
        descripcion: "Puntos por unidad y por miembro del club.",
        ruta: "/admin/rankin",
        alcance: ["conquistadores"],
        logo: PROGRAMAS_HOME[0].logo,
        gradiente: PROGRAMAS_HOME[0].gradiente,
        borde: PROGRAMAS_HOME[0].borde,
        fondo: PROGRAMAS_HOME[0].fondo,
        glow: PROGRAMAS_HOME[0].glow,
        tagline: "En vivo",
      },
      {
        id: "rank-aventureros",
        titulo: "Ranking Aventureros",
        descripcion: "Por miembro y por club/grupo del ministerio.",
        ruta: "/admin/rankin-aventureros",
        alcance: ["aventureros"],
        logo: PROGRAMAS_HOME[1].logo,
        gradiente: PROGRAMAS_HOME[1].gradiente,
        borde: PROGRAMAS_HOME[1].borde,
        fondo: PROGRAMAS_HOME[1].fondo,
        glow: PROGRAMAS_HOME[1].glow,
        tagline: "En vivo",
      },
      {
        id: "rank-ja",
        titulo: "Ranking JA",
        descripcion: "Posiciones y puntos del club de jóvenes.",
        ruta: "/admin/rankin-ja",
        alcance: ["ja"],
        logo: PROGRAMAS_HOME[2].logo,
        gradiente: PROGRAMAS_HOME[2].gradiente,
        borde: PROGRAMAS_HOME[2].borde,
        fondo: PROGRAMAS_HOME[2].fondo,
        glow: PROGRAMAS_HOME[2].glow,
        tagline: "En vivo",
      },
    ],
  },
  {
    id: "comunicacion",
    etiqueta: "Comunicación",
    subtitulo: "Padres y notificaciones",
    icono: <MessageCircle className="h-5 w-5 text-sky-400" />,
    tarjetas: [
      {
        id: "whatsapp",
        titulo: "WhatsApp a padres",
        descripcion: "Plantillas y envío de avisos a familias del club.",
        ruta: "/admin/notificaciones-padres",
        alcance: ["comun"],
        icono: <MessageCircle className="h-8 w-8 text-sky-400" />,
        gradiente: "from-sky-500 via-cyan-500 to-blue-500",
        borde: "border-sky-400/40",
        fondo: "bg-sky-500/10",
        glow: "shadow-sky-500/30",
        tagline: "Padres",
        destacado: true,
      },
    ],
  },
];

function programaHome(id: ProgramaClub) {
  return PROGRAMAS_HOME.find((p) => p.id === id);
}

function Tarjeta({ tarjeta, href }: { tarjeta: TarjetaRegistro; href: string }) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-[2rem] border ${tarjeta.borde} ${tarjeta.fondo} bg-white/4 p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-white/6 hover:shadow-2xl ${tarjeta.glow} ${
        tarjeta.destacado ? "sm:col-span-2 lg:col-span-2" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-linear-to-br ${tarjeta.gradiente} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
      />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
          {tarjeta.logo ? (
            <Image
              src={tarjeta.logo}
              alt={tarjeta.titulo}
              width={64}
              height={64}
              className="h-14 w-14 object-contain drop-shadow-lg sm:h-16 sm:w-16"
              unoptimized
            />
          ) : (
            tarjeta.icono
          )}
        </div>
        {tarjeta.tagline && (
          <span
            className={`shrink-0 rounded-full bg-linear-to-r ${tarjeta.gradiente} px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white`}
          >
            {tarjeta.tagline}
          </span>
        )}
      </div>

      <h3 className="relative text-xl font-black text-white">{tarjeta.titulo}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-white/55">{tarjeta.descripcion}</p>

      <div className="relative mt-5 flex items-center gap-2 text-sm font-bold text-white/75 transition-colors group-hover:text-white">
        Abrir
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function RegistrosPage() {
  const router = useRouter();
  const { clubSlug, clubNombre, programas, listo } = useClubActivo();

  const seccionesFiltradas = useMemo(() => {
    return SECCIONES.map((seccion) => ({
      ...seccion,
      tarjetas: seccion.tarjetas.filter((t) =>
        tarjetaVisibleParaClub(t.alcance, programas)
      ),
    })).filter((s) => s.tarjetas.length > 0);
  }, [programas]);

  const totalTarjetas = seccionesFiltradas.reduce((n, s) => n + s.tarjetas.length, 0);
  const programaPrincipal = programas[0];
  const estiloPrograma = programaPrincipal ? programaHome(programaPrincipal) : null;
  const etiquetaPrograma = nombreProgramaClub(programas);

  if (!listo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07060f] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-fuchsia-400" />
      </div>
    );
  }

  if (programas.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07060f] px-6 text-center text-white">
        <p className="text-lg font-bold text-white/80">
          No se encontró el programa de este club.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(rutaConClub("/admin", clubSlug))}
          className="border-white/15 text-white"
        >
          Volver al panel
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-red-600/20 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07060f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() => router.push(rutaConClub("/admin", clubSlug))}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Panel admin
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-white/60">
              {clubNombre || clubSlug} · {etiquetaPrograma}
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-400">
              <Sparkles className="h-4 w-4" />
              Club de {etiquetaPrograma}
            </p>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              Registros{" "}
              <span
                className={`bg-linear-to-r ${estiloPrograma?.gradiente ?? "from-cyan-400 to-violet-400"} bg-clip-text text-transparent`}
              >
                {etiquetaPrograma}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              Solo las herramientas de tu programa. Sin mezclar Conquistadores, Aventureros ni JA.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/70">
                {totalTarjetas} herramientas
              </span>
              <span
                className={`rounded-full border ${estiloPrograma?.borde ?? "border-cyan-500/30"} ${estiloPrograma?.fondo ?? "bg-cyan-500/10"} px-4 py-1.5 text-xs font-bold text-white/90`}
              >
                Programa exclusivo
              </span>
            </div>
          </div>

          <div className="mb-10 flex justify-center gap-3">
            {programas.map((id) => {
              const p = programaHome(id);
              if (!p) return null;
              return (
                <Image
                  key={p.id}
                  src={p.logo}
                  alt={p.nombre}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-2xl bg-white/10 p-2 object-contain ring-1 ring-white/20"
                  unoptimized
                />
              );
            })}
          </div>

          <div className="space-y-16">
            {seccionesFiltradas.map((seccion) => (
              <section key={seccion.id}>
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      {seccion.icono}
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                        {seccion.etiqueta}
                      </p>
                    </div>
                    <h2 className="text-2xl font-black sm:text-3xl">{seccion.subtitulo}</h2>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {seccion.tarjetas.map((tarjeta) => (
                    <Tarjeta
                      key={tarjeta.id}
                      tarjeta={tarjeta}
                      href={rutaConClub(tarjeta.ruta, clubSlug)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(rutaConClub("/admin", clubSlug))}
              className="h-12 rounded-2xl border-white/15 bg-white/5 px-8 font-bold text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar al menú principal
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
