import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/src/firebase";
import { buscarClubPorSlug } from "@/src/lib/clubs";
import { guardarSesionClub } from "@/src/lib/clubSession";
import { irARuta } from "@/src/lib/navegacion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/src/firebase";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";

export type ResultadoAuthClub =
  | { ok: true }
  | { ok: false; mensaje: string };

export async function registrarAdminFirebase(
  email: string,
  password: string
): Promise<{ ok: true; uid: string } | { ok: false; mensaje: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    return { ok: true, uid: cred.user.uid };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-in-use") {
      return { ok: false, mensaje: "Ese correo ya está registrado." };
    }
    if (code === "auth/weak-password") {
      return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
    }
    if (code === "auth/invalid-email") {
      return { ok: false, mensaje: "Correo electrónico no válido." };
    }
    return { ok: false, mensaje: "No se pudo crear la cuenta. Intenta de nuevo." };
  }
}

export async function buscarClubPorAdmin(user: User) {
  const porUid = await getDocs(
    query(collection(db, "clubs"), where("adminUid", "==", user.uid))
  );
  if (!porUid.empty) {
    const d = porUid.docs[0];
    const data = d.data();
    return {
      id: d.id,
      slug: d.id,
      nombre: String(data.nombre ?? ""),
      ciudad: String(data.ciudad ?? ""),
      pais: String(data.pais ?? ""),
      responsable: String(data.responsable ?? ""),
      email: String(data.email ?? ""),
      whatsapp: String(data.whatsapp ?? ""),
      programas: (data.programas ?? []) as import("@/src/types/club").ProgramaClub[],
      adminPin: String(data.adminPin ?? ""),
      activo: data.activo !== false,
      creadoEn: String(data.creadoEn ?? ""),
    };
  }

  const email = user.email?.trim().toLowerCase();
  if (email) {
    const porEmail = await getDocs(
      query(collection(db, "clubs"), where("email", "==", email))
    );
    if (!porEmail.empty) {
      const d = porEmail.docs[0];
      const data = d.data();
      return {
        id: d.id,
        slug: d.id,
        nombre: String(data.nombre ?? ""),
        ciudad: String(data.ciudad ?? ""),
        pais: String(data.pais ?? ""),
        responsable: String(data.responsable ?? ""),
        email: String(data.email ?? ""),
        whatsapp: String(data.whatsapp ?? ""),
        programas: (data.programas ?? []) as import("@/src/types/club").ProgramaClub[],
        adminPin: String(data.adminPin ?? ""),
        activo: data.activo !== false,
        creadoEn: String(data.creadoEn ?? ""),
      };
    }
  }

  return null;
}

export async function iniciarSesionAdminEmail(
  email: string,
  password: string
): Promise<ResultadoAuthClub> {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    const club = await buscarClubPorAdmin(cred.user);
    if (!club || !club.activo) {
      await signOut(auth);
      return { ok: false, mensaje: "No hay un club asociado a esta cuenta." };
    }
    guardarSesionClub(club);
    irARuta(`/admin?club=${encodeURIComponent(club.slug)}`);
    return { ok: true };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      return { ok: false, mensaje: "Correo o contraseña incorrectos." };
    }
    if (code === "auth/user-not-found") {
      return { ok: false, mensaje: "No existe una cuenta con ese correo." };
    }
    return { ok: false, mensaje: "No se pudo iniciar sesión. Intenta de nuevo." };
  }
}

export async function iniciarSesionAdminPin(
  clubSlug: string,
  pin: string
): Promise<ResultadoAuthClub> {
  await ensureFirebaseSession();
  const club = await buscarClubPorSlug(clubSlug);
  if (!club || !club.activo || club.adminPin !== pin.trim()) {
    return { ok: false, mensaje: "Código de club o PIN incorrecto." };
  }
  guardarSesionClub(club);
  irARuta(`/admin?club=${encodeURIComponent(club.slug)}`);
  return { ok: true };
}

export async function cerrarSesionAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    /* ignorar */
  }
}
