import {
  collection,
  addDoc,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/src/firebase";
import { especialidadesBase } from "@/src/data/especialidades";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { logInfo } from "@/src/lib/logger";

const BATCH_SIZE = 400;

async function eliminarEspecialidadesClub(clubId: string): Promise<number> {
  const q = queryColeccionClub("especialidades", clubId);
  if (!q) return 0;

  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;

  let eliminados = 0;
  let batch = writeBatch(db);
  let ops = 0;
  const commits: Promise<void>[] = [];

  for (const docSnap of snapshot.docs) {
    batch.delete(doc(db, "especialidades", docSnap.id));
    ops++;
    eliminados++;
    if (ops >= BATCH_SIZE) {
      commits.push(batch.commit());
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) commits.push(batch.commit());
  await Promise.all(commits);
  return eliminados;
}

export async function sembrarEspecialidadesClub(clubId: string): Promise<number> {
  const q = queryColeccionClub("especialidades", clubId);
  if (!q) return 0;

  const querySnapshot = await getDocs(q);
  const existentes = querySnapshot.docs.map((docSnap) => docSnap.data());
  let agregados = 0;

  for (const esp of especialidadesBase) {
    const yaExiste = existentes.some(
      (e) =>
        e.area === esp.area &&
        e.categoria === esp.categoria &&
        e.especialidad === esp.especialidad
    );
    if (!yaExiste) {
      const docRef = await addDoc(
        collection(db, "especialidades"),
        datosConClub(esp, clubId)
      );
      logInfo("Especialidad agregada: " + docRef.id);
      agregados++;
    }
  }

  return agregados;
}

/** Borra el catálogo del club y vuelve a cargar las especialidades oficiales IASD. */
export async function recargarEspecialidadesClub(
  clubId: string
): Promise<{ eliminados: number; agregados: number }> {
  const eliminados = await eliminarEspecialidadesClub(clubId);
  const agregados = await sembrarEspecialidadesClub(clubId);
  return { eliminados, agregados };
}

export const TOTAL_ESPECIALIDADES_IASD = especialidadesBase.length;
