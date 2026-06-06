import type { ProgramaClub } from "@/src/types/club";

/** Tarjetas visibles solo para estos programas; "comun" = todos los clubes. */
export type AlcanceTarjetaRegistro = ProgramaClub | "comun";

export function tarjetaVisibleParaClub(
  alcance: AlcanceTarjetaRegistro[],
  programasClub: ProgramaClub[]
): boolean {
  if (alcance.includes("comun")) return true;
  if (programasClub.length === 0) return false;
  return alcance.some(
    (p) => p !== "comun" && programasClub.includes(p)
  );
}

export function nombreProgramaClub(programas: ProgramaClub[]): string {
  if (programas.length === 1) {
    switch (programas[0]) {
      case "conquistadores":
        return "Conquistadores";
      case "aventureros":
        return "Aventureros";
      case "ja":
        return "Jóvenes Adventistas";
    }
  }
  if (programas.length > 1) {
    return programas
      .map((p) => {
        if (p === "ja") return "JA";
        return p.charAt(0).toUpperCase() + p.slice(1);
      })
      .join(" · ");
  }
  return "tu ministerio";
}
