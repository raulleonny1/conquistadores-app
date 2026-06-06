"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  Settings,
  Calendar,
  Trophy,
  MessageCircle,
  Sparkles,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { rutaConClub } from "@/src/lib/rutasClub";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import {
  LOGO_MINISTERIO_JOVEN,
  PROGRAMAS_HOME,
} from "@/src/constants/programLogos";
import {
  type AlcanceTarjetaRegistro,
  nombreProgramaClub,
  tarjetaVisibleParaClub,
} from "@/src/lib/registrosPorPrograma";
import { Button } from "@/components/ui/button";
import CumpleanosProximos from "@/src/components/admin/CumpleanosProximos";

type MenuItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  borde: string;
  fondo: string;
  gradiente: string;
  glow: string;
  alcance: AlcanceTarjetaRegistro[];
};

const MENU_BASE: MenuItem[] = [
  {
    id: "registros",
    title: "Registros",
    description: "Miembros, unidades, puntos y rankings de tu programa.",
    icon: <ClipboardList className="h-8 w-8 text-cyan-400" />,
    borde: "border-cyan-400/40",
    fondo: "bg-cyan-500/10",
    gradiente: "from-cyan-500 via-sky-500 to-blue-500",
    glow: "shadow-cyan-500/25",
    alcance: ["comun"],
  },
  {
    id: "directiva",
    title: "Directiva del club",
    description: "Director, secretaría, tesorería y cargos oficiales.",
    icon: <Users className="h-8 w-8 text-fuchsia-400" />,
    borde: "border-fuchsia-400/40",
    fondo: "bg-fuchsia-500/10",
    gradiente: "from-fuchsia-600 via-purple-500 to-violet-500",
    glow: "shadow-fuchsia-500/25",
    alcance: ["comun"],
  },
  {
    id: "especialidadesEnCurso",
    title: "Especialidades en curso",
    description: "Visualiza y gestiona especialidades en proceso.",
    icon: <ShieldCheck className="h-8 w-8 text-indigo-400" />,
    borde: "border-indigo-400/40",
    fondo: "bg-indigo-500/10",
    gradiente: "from-indigo-600 via-violet-500 to-purple-500",
    glow: "shadow-indigo-500/25",
    alcance: ["conquistadores"],
  },
  {
    id: "rankin",
    title: "Ranking Conquistadores",
    description: "Puntos, unidades y competencias en vivo.",
    icon: <Trophy className="h-8 w-8 text-yellow-400" />,
    borde: "border-yellow-400/40",
    fondo: "bg-yellow-500/10",
    gradiente: "from-yellow-500 via-amber-500 to-orange-500",
    glow: "shadow-yellow-500/25",
    alcance: ["conquistadores"],
  },
  {
    id: "rankinAventureros",
    title: "Ranking Aventureros",
    description: "Clases, insignias y puntos aventureros.",
    icon: <Trophy className="h-8 w-8 text-rose-400" />,
    borde: "border-rose-400/40",
    fondo: "bg-rose-500/10",
    gradiente: "from-rose-500 via-pink-500 to-fuchsia-500",
    glow: "shadow-rose-500/25",
    alcance: ["aventureros"],
  },
  {
    id: "rankinJa",
    title: "Ranking JA",
    description: "Actividades y puntos de Jóvenes Adventistas.",
    icon: <Trophy className="h-8 w-8 text-violet-400" />,
    borde: "border-violet-400/40",
    fondo: "bg-violet-500/10",
    gradiente: "from-violet-500 via-purple-500 to-indigo-500",
    glow: "shadow-violet-500/25",
    alcance: ["ja"],
  },
  {
    id: "notificacionesPadres",
    title: "Notificar padres",
    description: "Resúmenes de avance por WhatsApp a familias.",
    icon: <MessageCircle className="h-8 w-8 text-sky-400" />,
    borde: "border-sky-400/40",
    fondo: "bg-sky-500/10",
    gradiente: "from-sky-500 via-cyan-500 to-blue-500",
    glow: "shadow-sky-500/25",
    alcance: ["comun"],
  },
  {
    id: "frases",
    title: "Frases de la semana",
    description: "Inspira al club con mensajes motivadores.",
    icon: <Calendar className="h-8 w-8 text-teal-400" />,
    borde: "border-teal-400/40",
    fondo: "bg-teal-500/10",
    gradiente: "from-teal-500 via-emerald-500 to-green-500",
    glow: "shadow-teal-500/25",
    alcance: ["comun"],
  },
  {
    id: "calendario",
    title: "Calendario",
    description: "Eventos, campamentos y reuniones del club.",
    icon: <Calendar className="h-8 w-8 text-emerald-400" />,
    borde: "border-emerald-400/40",
    fondo: "bg-emerald-500/10",
    gradiente: "from-emerald-600 via-green-500 to-teal-500",
    glow: "shadow-emerald-500/25",
    alcance: ["comun"],
  },
  {
    id: "calificaciones",
    title: "Calificaciones",
    description: "Catálogo de actividades y puntos del programa.",
    icon: <BarChart3 className="h-8 w-8 text-pink-400" />,
    borde: "border-pink-400/40",
    fondo: "bg-pink-500/10",
    gradiente: "from-pink-500 via-rose-500 to-fuchsia-500",
    glow: "shadow-pink-500/25",
    alcance: ["conquistadores", "aventureros", "ja"],
  },
];

const RUTAS_MENU: Record<string, string> = {
  registros: "/admin/registros",
  frases: "/admin/frases",
  calificaciones: "/admin/calificaciones",
  calendario: "/admin/calendario",
  directiva: "/admin/directiva",
  especialidadesEnCurso: "/admin/especialidades-en-curso",
  rankin: "/admin/rankin",
  notificacionesPadres: "/admin/notificaciones-padres",
  rankinAventureros: "/admin/rankin-aventureros",
  rankinJa: "/admin/rankin-ja",
};

function SortableMenuCard({
  item,
  onSelectTab,
}: {
  item: MenuItem;
  onSelectTab: (id: string) => void;
}) {
  const router = useRouter();
  const { clubSlug } = useClubActivo();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  let dragStarted = false;

  const navigate = () => {
    const path = RUTAS_MENU[item.id];
    if (path) router.push(rutaConClub(path, clubSlug));
    else onSelectTab(item.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={() => {
        dragStarted = false;
      }}
      onPointerMove={() => {
        dragStarted = true;
      }}
      onPointerUp={() => {
        if (!dragStarted) navigate();
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-[2rem] border ${item.borde} ${item.fondo} bg-white/4 p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-white/6 hover:shadow-2xl ${item.glow}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-linear-to-br ${item.gradiente} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
      />
      <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 transition-transform group-hover:scale-110">
        {item.icon}
      </div>
      <h3 className="relative text-lg font-black text-white">{item.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>
      <div className="relative mt-5 flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-widest text-white/75 group-hover:text-white">
        Gestionar <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { clubSlug, clubNombre, programas, listo } = useClubActivo();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const menuFiltrado = useMemo(
    () => MENU_BASE.filter((item) => tarjetaVisibleParaClub(item.alcance, programas)),
    [programas]
  );

  const [menuItems, setMenuItems] = useState(MENU_BASE);

  const menuVisible = useMemo(() => {
    const ids = new Set(menuFiltrado.map((m) => m.id));
    return menuItems.filter((m) => ids.has(m.id));
  }, [menuItems, menuFiltrado]);

  const etiquetaPrograma = nombreProgramaClub(programas);
  const logoPrograma = programas[0]
    ? PROGRAMAS_HOME.find((p) => p.id === programas[0])
    : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = menuItems.findIndex((i) => i.id === active.id);
    const newIndex = menuItems.findIndex((i) => i.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0) {
      setMenuItems(arrayMove(menuItems, oldIndex, newIndex));
    }
  };

  const renderTabContent = () => {
    if (activeTab === "configuracion") {
      return (
        <div className="mx-auto max-w-lg rounded-[2rem] border border-amber-400/30 bg-amber-500/10 p-8 text-left">
          <h2 className="text-xl font-black text-amber-200">Configuración</h2>
          <p className="mt-3 text-sm text-white/60">
            El cambio de PIN (con migración de puntos e historial) solo se hace en la pantalla
            dedicada de configuración.
          </p>
          <Button
            type="button"
            onClick={() => router.push(rutaConClub("/admin/configuracion", clubSlug))}
            className="mt-6 rounded-2xl bg-linear-to-r from-indigo-500 to-violet-600 font-bold"
          >
            Ir a Configuración → Resetear PIN
          </Button>
        </div>
      );
    }
    return null;
  };

  if (!listo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07060f] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-fuchsia-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[100px]" />
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
          <div className="flex items-center gap-3">
            <Image
              src={logoPrograma?.logo ?? LOGO_MINISTERIO_JOVEN}
              alt="Club"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl bg-white/10 p-1 object-contain ring-1 ring-white/15"
              unoptimized
            />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-400">
                Panel admin
              </p>
              <p className="text-lg font-black">
                {clubNombre || clubSlug || "ConquisApp"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(rutaConClub("/admin/configuracion", clubSlug))}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="mb-12 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
            <Sparkles className="h-4 w-4" />
            {etiquetaPrograma}
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Centro de{" "}
            <span className="bg-linear-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              gestión
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/50">
            Bienvenido al panel del club. Acceso para directiva y secretaría — arrastra las tarjetas
            para ordenar tu menú.
          </p>
          {programas.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/70">
                {menuVisible.length} módulos
              </span>
              <span
                className={`rounded-full border ${logoPrograma?.borde ?? "border-violet-400/30"} ${logoPrograma?.fondo ?? "bg-violet-500/10"} px-4 py-1.5 text-xs font-bold`}
              >
                Club de {etiquetaPrograma}
              </span>
            </div>
          )}
        </div>

        <CumpleanosProximos />

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={menuVisible.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {menuVisible.map((item) => (
                <SortableMenuCard key={item.id} item={item} onSelectTab={setActiveTab} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {activeTab && activeTab !== "miembros" && activeTab !== "registros" && (
          <div className="mt-12">{renderTabContent()}</div>
        )}
      </main>

      <footer className="relative z-10 py-10 text-center text-xs text-white/30">
        © {new Date().getFullYear()} ConquisApp · Sirviendo con honor
      </footer>
    </div>
  );
}
