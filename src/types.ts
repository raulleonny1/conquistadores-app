export interface TarjetaGuiaMayor {
  id: string;
  estado: "en_proceso" | "completado";
  progreso: number;
  fechaInicio: string;
  nombre?: string;
}
