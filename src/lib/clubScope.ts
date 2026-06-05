import {
  collection,
  query,
  where,
  type CollectionReference,
  type DocumentData,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/src/firebase";

/** Colecciones operativas que deben pertenecer a un solo club. */
export const COLECCIONES_CON_CLUB = new Set([
  "RegistroConquis",
  "aspirantesGuiaMayor",
  "consejeros",
  "directivaClub",
  "unidades",
  "eventos",
  "calificaciones",
  "especialidades",
  "calificacionesSemanal",
  "retosEspeciales",
  "evaluacionesGuiaMayor",
  "actividadesTarjetaGuiaMayor",
  "tarjetaGuiaMayor",
  "frasesSemana",
  "aventureros",
  "jovenesJA",
]);

/** calificacionesConquis y fichasMedicas usan PIN como ID; se filtran vía miembros del club. */
export const COLECCIONES_GLOBALES = new Set(["clubs", "config"]);

export function coleccionRequiereClub(nombre: string): boolean {
  return COLECCIONES_CON_CLUB.has(nombre);
}

export function restriccionesConsultaClub(
  nombreColeccion: string,
  clubId: string | null | undefined,
  extra: QueryConstraint[] = []
): QueryConstraint[] | null {
  if (!coleccionRequiereClub(nombreColeccion)) {
    return extra;
  }
  if (!clubId?.trim()) {
    return null;
  }
  return [where("clubId", "==", clubId.trim()), ...extra];
}

export function queryColeccionClub(
  nombreColeccion: string,
  clubId: string | null | undefined,
  extra: QueryConstraint[] = []
): Query<DocumentData> | null {
  const restricciones = restriccionesConsultaClub(nombreColeccion, clubId, extra);
  if (restricciones === null) return null;
  const colRef = collection(db, nombreColeccion) as CollectionReference<DocumentData>;
  return restricciones.length ? query(colRef, ...restricciones) : colRef;
}

/** Solo documentos del club activo (aislamiento estricto). */
export function perteneceAlClub(
  data: Record<string, unknown>,
  clubId: string | null | undefined
): boolean {
  if (!clubId?.trim()) return false;
  return String(data.clubId ?? "").trim() === clubId.trim();
}

export function datosConClub<T extends Record<string, unknown>>(
  data: T,
  clubId: string
): T & { clubId: string } {
  return { ...data, clubId: clubId.trim() };
}

export function filtrarSnapshotPorClub<T extends Record<string, unknown>>(
  docs: { id: string; data: () => T }[],
  clubId: string | null | undefined
): { id: string; data: () => T }[] {
  if (!clubId?.trim()) return [];
  return docs.filter((d) => perteneceAlClub(d.data(), clubId));
}
