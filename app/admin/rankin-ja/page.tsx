"use client";

import RankingProgramaAdmin from "@/src/components/admin/RankingProgramaAdmin";

export default function RankinJAPage() {
  return (
    <RankingProgramaAdmin
      programa="ja"
      titulo="Ranking — Jóvenes Adventistas"
      coleccionMiembros="jovenesJA"
      campoGrupo="grupo"
      etiquetaGrupo="Grupo"
      color="violet"
    />
  );
}
