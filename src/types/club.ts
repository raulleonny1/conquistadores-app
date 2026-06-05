export type ProgramaClub = "conquistadores" | "aventureros" | "ja";

export type Club = {
  id: string;
  slug: string;
  nombre: string;
  ciudad: string;
  pais: string;
  responsable: string;
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
  email: string;
  whatsapp: string;
  programas: ProgramaClub[];
  password: string;
  adminUid?: string;
};
