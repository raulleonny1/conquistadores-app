"use client";

import RankingProgramaAdmin from "@/src/components/admin/RankingProgramaAdmin";

export default function RankinAventurerosPage() {
  return (
    <RankingProgramaAdmin
      programa="aventureros"
      titulo="Ranking — Aventureros"
      coleccionMiembros="aventureros"
      campoGrupo="club"
      etiquetaGrupo="Club"
      color="amber"
    />
  );
}
