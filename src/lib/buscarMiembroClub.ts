import { db } from "@/src/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";
import { COLECCION_POR_PROGRAMA } from "@/src/constants/categoriasPrograma";
import { normalizarInsignias } from "@/src/lib/progresoAventurero";
export type ProgramaMiembro = "conquistadores" | "aventureros" | "ja" | "aspirante";

export type MiembroClubEncontrado = {
  programa: ProgramaMiembro;
  pin: string;
  nombre: string;
  apellido: string;
  clase: string;
  grupo: string;
  whatsapp: string;
  insignias: Record<string, boolean>;
  coleccionCalificaciones: string;
};

const BUSQUEDAS: {
  programa: ProgramaMiembro;
  coleccion: string;
  coleccionCalificaciones: string;
}[] = [
  { programa: "aventureros", coleccion: "aventureros", coleccionCalificaciones: COLECCION_POR_PROGRAMA.aventureros },
  { programa: "ja", coleccion: "jovenesJA", coleccionCalificaciones: COLECCION_POR_PROGRAMA.ja },
  { programa: "conquistadores", coleccion: "RegistroConquis", coleccionCalificaciones: "calificacionesConquis" },
  { programa: "aspirante", coleccion: "aspirantesGuiaMayor", coleccionCalificaciones: "calificacionesConquis" },
];

export async function buscarMiembroPorPinClub(
  clubId: string,
  pin: string
): Promise<MiembroClubEncontrado | null> {
  await ensureFirebaseSession();
  const pinNorm = pin.trim();
  if (!clubId || !pinNorm) return null;

  for (const { programa, coleccion, coleccionCalificaciones } of BUSQUEDAS) {
    const snap = await getDocs(
      query(
        collection(db, coleccion),
        where("clubId", "==", clubId),
        where("pin", "==", pinNorm)
      )
    );
    if (snap.empty) continue;

    const data = snap.docs[0].data();
    if (programa === "conquistadores") {
      return {
        programa,
        pin: pinNorm,
        nombre: String(data.nombre ?? ""),
        apellido: String(data.apellido ?? ""),
        clase: String(data.clase ?? ""),
        grupo: String(data.unidad ?? ""),
        whatsapp: String(data.whatsapp ?? ""),
        insignias: {},
        coleccionCalificaciones,
      };
    }
    if (programa === "aspirante") {
      return {
        programa,
        pin: pinNorm,
        nombre: String(data.nombre ?? ""),
        apellido: String(data.apellido ?? ""),
        clase: String(data.cargo ?? "Aspirante"),
        grupo: String(data.asociacion ?? ""),
        whatsapp: String(data.whatsapp ?? data.telefono ?? ""),
        insignias: {},
        coleccionCalificaciones,
      };
    }
    if (programa === "aventureros") {
      return {
        programa,
        pin: pinNorm,
        nombre: String(data.nombre ?? ""),
        apellido: String(data.apellido ?? ""),
        clase: String(data.clase ?? ""),
        grupo: String(data.club ?? ""),
        whatsapp: String(data.whatsapp ?? ""),
        insignias: normalizarInsignias(data.insignias as Record<string, unknown>),
        coleccionCalificaciones,
      };
    }
    return {
      programa: "ja",
      pin: pinNorm,
      nombre: String(data.nombre ?? ""),
      apellido: String(data.apellido ?? ""),
      clase: String(data.clase ?? ""),
      grupo: String(data.grupo ?? ""),
      whatsapp: String(data.whatsapp ?? ""),
      insignias: normalizarInsignias(data.insignias as Record<string, unknown>),
      coleccionCalificaciones,
    };
  }

  return null;
}

export function etiquetaPrograma(programa: ProgramaMiembro): string {
  switch (programa) {
    case "conquistadores":
      return "Conquistadores";
    case "aventureros":
      return "Aventureros";
    case "ja":
      return "Jóvenes Adventistas";
    case "aspirante":
      return "Aspirante a Guía Mayor";
  }
}
