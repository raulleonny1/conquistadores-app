"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function ConsejeroSinPermisoCalificar({
  consejeroId,
}: {
  consejeroId?: string | null;
}) {
  const volver = consejeroId ? `/consejero/${consejeroId}` : "/consejero";

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
      <ShieldOff className="mx-auto mb-4 h-12 w-12 text-amber-600" />
      <h2 className="mb-2 text-xl font-bold text-slate-800">Calificación desactivada</h2>
      <p className="mb-4 text-sm text-slate-600">
        Solo el <strong>administrador</strong> puede asignar puntos a conquistadores y aspirantes.
        Si la directiva te autoriza, el admin activará tu permiso de calificar.
      </p>
      <Link
        href={volver}
        className="inline-block rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800"
      >
        Volver al panel
      </Link>
    </div>
  );
}
