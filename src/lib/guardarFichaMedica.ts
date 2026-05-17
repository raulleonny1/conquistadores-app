import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export type FichaMedicaMeta = {
  fichaMedicaUrl: string;
  fichaMedicaNombre: string;
  fichaMedicaTipo: string;
};

export async function guardarFichaMedica(
  file: File,
  aspiranteId: string
): Promise<FichaMedicaMeta> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fileRef = ref(storage, `fichasMedicasGuiaMayor/${aspiranteId}/${safeName}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return {
    fichaMedicaUrl: url,
    fichaMedicaNombre: file.name,
    fichaMedicaTipo: file.type || "application/octet-stream",
  };
}
