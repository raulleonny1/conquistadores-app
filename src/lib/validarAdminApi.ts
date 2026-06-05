import { db } from "@/src/firebase";
import { doc, getDoc } from "firebase/firestore";

/** Valida PIN de administrador de un club (uso en API routes). */
export async function validarPinAdminApi(
  clubSlug: string | undefined,
  pin: string | undefined
): Promise<boolean> {
  if (!clubSlug?.trim() || !pin?.trim()) return false;

  const ref = doc(db, "clubs", clubSlug.trim().toLowerCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const data = snap.data();
  return String(data.adminPin ?? "") === pin.trim() && data.activo !== false;
}
