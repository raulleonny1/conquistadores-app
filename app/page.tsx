"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronRight,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LOGO_MINISTERIO_JOVEN,
  PROGRAMAS_HOME,
} from "@/src/constants/programLogos";

const STATS = [
  { valor: "3", label: "Ministerios" },
  { valor: "100%", label: "Tu club" },
  { valor: "24/7", label: "En línea" },
  { valor: "∞", label: "Posibilidades" },
];

const FEATURES = [
  {
    icono: Trophy,
    titulo: "Rankings en vivo",
    texto: "Puntos, unidades y competencias — al instante.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icono: Calendar,
    titulo: "Eventos & retos",
    texto: "Calendario, campamentos y retos semanales.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icono: Star,
    titulo: "Guía Mayor",
    texto: "Sigue el camino de tus aspirantes paso a paso.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icono: Users,
    titulo: "Multi-club",
    texto: "Cada iglesia con su espacio y datos propios.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icono: Shield,
    titulo: "Accesos seguros",
    texto: "Login separado por programa y por club.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    icono: Zap,
    titulo: "App en tu celular",
    texto: "Instálala como PWA y llévala al campamento.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      {/* Fondo animado */}
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

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07060f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={LOGO_MINISTERIO_JOVEN}
              alt="Ministerio Joven"
              width={44}
              height={44}
              className="rounded-xl"
              unoptimized
            />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-400">
                Ministerio Joven
              </p>
              <p className="text-lg font-black">ConquisApp</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden font-bold text-white/70 hover:text-white sm:inline-flex"
            >
              <Link href="/padres">
                <Heart className="mr-1.5 h-4 w-4" />
                Padres
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="hidden font-bold text-white/70 hover:text-white sm:inline-flex"
            >
              <Link href="/login">Entrar</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-linear-to-r from-fuchsia-500 to-violet-600 px-5 font-bold shadow-lg shadow-fuchsia-500/25 hover:opacity-90"
            >
              <Link href="/registro">
                Registrar club
                <Rocket className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-5 pb-16 pt-10 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fuchsia-300">
                <Sparkles className="h-3.5 w-3.5" />
                Hecho para líderes y jóvenes
              </div>

              <h1 className="text-[2.75rem] font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block">Tu ministerio</span>
                <span className="mt-1 block bg-linear-to-r from-yellow-300 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  al siguiente nivel
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
                La plataforma donde cada club de{" "}
                <strong className="text-white">Conquistadores</strong>,{" "}
                <strong className="text-white">Aventureros</strong> y{" "}
                <strong className="text-white">JA</strong> tiene su propio
                espacio. Registra, organiza y compite — sin mezclar datos con
                nadie más.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-2xl bg-white px-8 text-base font-black text-slate-900 shadow-xl shadow-white/10 hover:bg-white/90"
                >
                  <Link href="/registro">
                    Crear mi club gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base font-bold text-white hover:bg-white/10"
                >
                  <Link href="/login">Ya tengo cuenta</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-4 gap-3">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/8 bg-white/4 px-2 py-3 text-center backdrop-blur sm:px-3"
                  >
                    <p className="text-xl font-black text-white sm:text-2xl">{s.valor}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 sm:text-[10px]">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Logos flotantes hero */}
            <div className="relative mx-auto flex h-[340px] w-full max-w-md items-center justify-center sm:h-[420px] lg:max-w-none">
              <div className="absolute inset-0 rounded-[3rem] border border-white/10 bg-linear-to-br from-white/8 to-white/2 backdrop-blur-sm" />

              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-3xl bg-linear-to-br from-fuchsia-600/30 to-violet-600/30 p-4 shadow-2xl shadow-fuchsia-500/20 ring-1 ring-white/20 sm:h-44 sm:w-44">
                  <Image
                    src={LOGO_MINISTERIO_JOVEN}
                    alt="Ministerio Joven Adventista"
                    width={140}
                    height={140}
                    className="drop-shadow-2xl"
                    priority
                    unoptimized
                  />
                </div>
              </div>

              {PROGRAMAS_HOME.map((p, i) => {
                const positions = [
                  "left-2 top-4 sm:left-4 sm:top-6 -rotate-12",
                  "right-2 top-8 sm:right-6 sm:top-10 rotate-12",
                  "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-8 rotate-0",
                ];
                return (
                  <div
                    key={p.id}
                    className={`absolute ${positions[i]} z-20 animate-bounce`}
                    style={{ animationDuration: `${2.5 + i * 0.5}s`, animationDelay: `${i * 0.3}s` }}
                  >
                    <div
                      className={`rounded-2xl border ${p.borde} ${p.fondo} p-2 shadow-xl ${p.glow} backdrop-blur-md sm:p-3`}
                    >
                      <Image
                        src={p.logo}
                        alt={p.nombre}
                        width={72}
                        height={72}
                        className="h-14 w-14 object-contain sm:h-[72px] sm:w-[72px]"
                        unoptimized
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee programas */}
      <section className="border-y border-white/5 bg-white/2 py-4">
        <div className="flex animate-[marquee_20s_linear_infinite] gap-12 whitespace-nowrap">
          {[...PROGRAMAS_HOME, ...PROGRAMAS_HOME].map((p, i) => (
            <span
              key={`${p.id}-${i}`}
              className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white/30"
            >
              <Image src={p.logo} alt="" width={28} height={28} className="opacity-60" unoptimized />
              {p.nombre}
              <span className="text-fuchsia-500">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Programas con logos grandes */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              Elige tu ministerio
            </p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              Tres clubes,{" "}
              <span className="bg-linear-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                un solo lugar
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/50">
              Cada programa tiene login y datos separados. Tu club, tus reglas.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PROGRAMAS_HOME.map((p) => (
              <Link
                key={p.id}
                href={p.login}
                className={`group relative overflow-hidden rounded-[2rem] border ${p.borde} bg-white/4 p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-white/6 hover:shadow-2xl ${p.glow}`}
              >
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-linear-to-br ${p.gradiente} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
                />

                <div className="relative mb-6 flex items-start justify-between">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                    <Image
                      src={p.logo}
                      alt={p.nombre}
                      width={80}
                      height={80}
                      className="h-16 w-16 object-contain drop-shadow-lg sm:h-20 sm:w-20"
                      unoptimized
                    />
                  </div>
                  <span
                    className={`rounded-full bg-linear-to-r ${p.gradiente} px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white`}
                  >
                    {p.tagline}
                  </span>
                </div>

                <h3 className="relative text-2xl font-black">{p.nombre}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-white/55">
                  {p.descripcion}
                </p>

                <div className="relative mt-6 flex items-center gap-2 text-sm font-bold text-white/80 transition-colors group-hover:text-white">
                  Entrar ahora
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-linear-to-b from-transparent to-violet-950/20 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="text-3xl font-black sm:text-4xl">
                Todo el poder del club
              </h2>
              <p className="mt-2 text-white/50">Herramientas que los jóvenes van a usar de verdad</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white/60">Datos en tiempo real</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icono = f.icono;
              return (
                <div
                  key={f.titulo}
                  className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition-colors hover:border-white/15 hover:bg-white/5"
                >
                  <div
                    className={`mb-4 inline-flex rounded-xl ${f.bg} p-3 transition-transform group-hover:scale-110`}
                  >
                    <Icono className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="font-black">{f.titulo}</h3>
                  <p className="mt-1.5 text-sm text-white/50">{f.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-fuchsia-500/30 bg-linear-to-br from-fuchsia-600/20 via-violet-600/15 to-cyan-600/10 p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative flex justify-center gap-4 mb-6">
              {PROGRAMAS_HOME.map((p) => (
                <Image
                  key={p.id}
                  src={p.logo}
                  alt={p.nombre}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl bg-white/10 p-1 object-contain ring-1 ring-white/20"
                  unoptimized
                />
              ))}
            </div>

            <h2 className="relative flex items-center justify-center gap-3 text-3xl font-black sm:text-5xl">
              ¿Listo para el despegue?
              <Rocket className="h-8 w-8 text-fuchsia-400 sm:h-10 sm:w-10" />
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-white/60">
              Registra tu club en minutos. Recibes código único + PIN de admin.
              Empieza a invitar a tu gente hoy.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-2xl bg-white px-10 text-base font-black text-slate-900 hover:bg-white/90"
              >
                <Link href="/registro">Registrar mi club</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 rounded-2xl border-white/25 bg-white/5 px-10 text-base font-bold text-white"
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={LOGO_MINISTERIO_JOVEN}
                alt="Ministerio Joven"
                width={32}
                height={32}
                className="rounded-lg opacity-70"
                unoptimized
              />
              <p className="text-xs font-semibold text-white/40">
                ConquisApp · {new Date().getFullYear()}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-bold">
              <Link href="/aviso-legal?volver=/" className="text-amber-400/80 hover:text-amber-300">
                Aviso legal
              </Link>
              <Link href="/privacidad?volver=/" className="text-sky-400/80 hover:text-sky-300">
                Privacidad
              </Link>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] leading-relaxed text-white/30 sm:text-left">
            No oficial IASD · Abierta a clubes de todo el mundo · Emblemas © titulares oficiales
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
