"use client";

import ActividadesProgramaAdmin from "@/src/components/admin/ActividadesProgramaAdmin";

export default function ActividadesAventurerosPage() {
  return (
    <ActividadesProgramaAdmin
      programa="aventureros"
      titulo="Puntos actividades — Aventureros"
      coleccionMiembros="aventureros"
      color="amber"
      campoGrupo="club"
      etiquetaGrupo="Club"
    />
  );
}
