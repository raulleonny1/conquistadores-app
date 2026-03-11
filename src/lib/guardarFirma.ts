import { ref, uploadString, getDownloadURL } from "firebase/storage"
import { storage } from "../firebase"

export async function guardarFirma(
  base64: string,
  aspiranteId: string,
  actividadIndex: number
) {
  const fileRef = ref(
    storage,
    `firmasGuiaMayor/${aspiranteId}/actividad-${actividadIndex}.png`
  )
  await uploadString(fileRef, base64, "data_url")
  const url = await getDownloadURL(fileRef)
  return url
}
