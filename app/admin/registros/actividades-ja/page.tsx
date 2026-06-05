"use client";

import ActividadesProgramaAdmin from "@/src/components/admin/ActividadesProgramaAdmin";

export default function ActividadesJAPage() {
  return (
    <ActividadesProgramaAdmin
      programa="ja"
      titulo="Puntos actividades — Jóvenes Adventistas"
      coleccionMiembros="jovenesJA"
      color="violet"
      campoGrupo="grupo"
      etiquetaGrupo="Grupo"
    />
  );
}
