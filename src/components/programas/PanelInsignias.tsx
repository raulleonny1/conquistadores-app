"use client";

import { Award, CheckCircle2, Circle } from "lucide-react";

type InsigniaItem = {
  id: string;
  nombre: string;
  area: string;
  completada: boolean;
};

type PanelInsigniasProps = {
  titulo?: string;
  clase: string;
  siguienteClase: string | null;
  progresoClase: number;
  progresoPrograma: number;
  completadas: number;
  total: number;
  insignias: InsigniaItem[];
  tema?: "amber" | "violet";
};

const TEMAS = {
  amber: {
    barra: "bg-amber-500",
    barraFondo: "bg-amber-900/40",
    badge: "bg-amber-500/20 text-amber-300",
    check: "text-amber-400",
    borde: "border-amber-500/20",
  },
  violet: {
    barra: "bg-violet-500",
    barraFondo: "bg-violet-900/40",
    badge: "bg-violet-500/20 text-violet-300",
    check: "text-violet-400",
    borde: "border-violet-500/20",
  },
};

export default function PanelInsignias({
  titulo = "Insignias de clase",
  clase,
  siguienteClase,
  progresoClase,
  progresoPrograma,
  completadas,
  total,
  insignias,
  tema = "amber",
}: PanelInsigniasProps) {
  const t = TEMAS[tema];

  return (
    <section className={`rounded-3xl border ${t.borde} bg-white/5 p-6`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Award className={`h-5 w-5 ${t.check}`} />
          {titulo}
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${t.badge}`}>
          {completadas}/{total}
        </span>
      </div>

      <p className="mb-3 text-sm text-slate-400">
        Clase actual: <strong className="text-white">{clase}</strong>
        {siguienteClase && (
          <> · Siguiente: <strong className="text-white">{siguienteClase}</strong></>
        )}
      </p>

      <div className="mb-2 flex justify-between text-xs text-slate-500">
        <span>Avance en clase</span>
        <span>{progresoClase}%</span>
      </div>
      <div className={`mb-4 h-2 overflow-hidden rounded-full ${t.barraFondo}`}>
        <div className={`h-full rounded-full ${t.barra}`} style={{ width: `${progresoClase}%` }} />
      </div>

      <div className="mb-4 flex justify-between text-xs text-slate-500">
        <span>Avance en el programa</span>
        <span>{progresoPrograma}%</span>
      </div>
      <div className={`mb-6 h-1.5 overflow-hidden rounded-full ${t.barraFondo}`}>
        <div className={`h-full rounded-full ${t.barra} opacity-70`} style={{ width: `${progresoPrograma}%` }} />
      </div>

      {insignias.length === 0 ? (
        <p className="text-sm text-slate-500">Sin insignias definidas para esta clase.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {insignias.map((ins) => (
            <li
              key={ins.id}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
                ins.completada ? "border-white/15 bg-white/10" : "border-white/5 bg-slate-900/30"
              }`}
            >
              {ins.completada ? (
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${t.check}`} />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
              )}
              <div>
                <p className={`text-sm font-semibold ${ins.completada ? "text-white" : "text-slate-400"}`}>
                  {ins.nombre}
                </p>
                <p className="text-xs text-slate-500">{ins.area}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
