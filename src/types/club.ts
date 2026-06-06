export type ProgramaClub = "conquistadores" | "aventureros" | "ja";

export type CargoDirectiva =
  | "Director/a"
  | "Subdirector/a"
  | "Secretario/a"
  | "Tesorero/a";

export type Club = {
  id: string;
  slug: string;
  nombre: string;
  ciudad: string;
  pais: string;
  responsable: string;
  cargo?: CargoDirectiva;
  email: string;
  whatsapp: string;
  programas: ProgramaClub[];
  adminPin: string;
  activo: boolean;
  creadoEn: string;
};

export type RegistroClubInput = {
  nombre: string;
  ciudad: string;
  pais: string;
  responsable: string;
  cargo: CargoDirectiva;
  email: string;
  whatsapp: string;
  programa: ProgramaClub;
  password: string;
  adminUid?: string;
};
