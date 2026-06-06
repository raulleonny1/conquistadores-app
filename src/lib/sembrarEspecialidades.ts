import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/src/firebase";
import { especialidadesBase } from "@/src/data/especialidades";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { logInfo } from "@/src/lib/logger";

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
