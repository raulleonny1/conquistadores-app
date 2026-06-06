import type { CargoDirectiva } from "@/src/types/club";

export const CARGOS_DIRECTIVA: CargoDirectiva[] = [
  "Director/a",
  "Subdirector/a",
  "Secretario/a",
  "Tesorero/a",
];

export function etiquetaCargo(cargo: CargoDirectiva): string {
  switch (cargo) {
    case "Director/a":
      return "Director/a";
    case "Subdirector/a":
      return "Subdirector/a";
    case "Secretario/a":
      return "Secretario/a";
    case "Tesorero/a":
      return "Tesorero/a";
  }
}
