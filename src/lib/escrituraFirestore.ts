import { auth } from "@/src/firebase";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";

export type PrepararEscrituraResult =
  | { ok: true }
  | { ok: false; mensaje: string };

/** Garantiza club activo + sesión Firebase antes de escribir en Firestore. */
export async function prepararEscrituraClub(
  clubId: string | null | undefined
): Promise<PrepararEscrituraResult> {
  const id = clubId?.trim();
  if (!id) {
    return {
      ok: false,
      mensaje:
        "Sesión de club no válida. Entra al panel con PIN o correo y usa ?club= en la URL.",
    };
  }

  try {
    await ensureFirebaseSession();
    if (!auth.currentUser) {
      return {
        ok: false,
        mensaje:
          "No hay sesión Firebase. En Firebase Console activa Authentication (Anónimo y Correo/contraseña).",
      };
    }
    return { ok: true };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/configuration-not-found") {
      return {
        ok: false,
        mensaje:
          "Firebase Authentication no está configurado. Consola → Authentication → Comenzar → activa Anónimo y Correo/contraseña.",
      };
    }
    return {
      ok: false,
      mensaje: "No se pudo conectar con Firebase. Revisa tu conexión e intenta de nuevo.",
    };
  }
}

export function mensajeErrorFirestore(err: unknown): string {
  const code = (err as { code?: string }).code;
  if (code === "permission-denied") {
    return "Permiso denegado en Firestore. Despliega firestore.rules o entra con el correo/PIN del administrador del club.";
  }
  if (code === "unauthenticated") {
    return "Sesión Firebase expirada. Recarga la página o vuelve a iniciar sesión.";
  }
  return "Error al guardar en Firebase. Intenta de nuevo.";
}
