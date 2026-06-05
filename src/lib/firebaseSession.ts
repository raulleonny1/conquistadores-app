import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "@/src/firebase";

let sessionPromise: Promise<void> | null = null;

/**
 * Garantiza una sesión Firebase antes de leer/escribir Firestore.
 * Usuarios con correo (admin) conservan su sesión; el resto entra como anónimo.
 */
export function ensureFirebaseSession(): Promise<void> {
  if (auth.currentUser) return Promise.resolve();

  if (!sessionPromise) {
    sessionPromise = new Promise((resolve, reject) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          unsub();
          resolve();
        }
      });
      signInAnonymously(auth).catch((err) => {
        sessionPromise = null;
        unsub();
        reject(err);
      });
    });
  }

  return sessionPromise;
}
