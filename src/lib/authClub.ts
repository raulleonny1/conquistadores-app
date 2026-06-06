import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
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

function mensajeErrorRegistroAuth(code?: string): string {
  switch (code) {
    case "auth/email-already-in-use":
    case "auth/credential-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Correo electrónico no válido.";
    case "auth/configuration-not-found":
      return "Firebase Authentication no está configurado. En Firebase Console → Authentication, pulsa «Comenzar» y activa «Correo/contraseña» y «Anónimo».";
    case "auth/operation-not-allowed":
      return "El registro con correo no está habilitado. En Firebase Console → Authentication → Sign-in method, activa «Correo/contraseña».";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu internet e intenta de nuevo.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    default:
      return "No se pudo crear la cuenta. Intenta de nuevo.";
  }
}

export async function registrarAdminFirebase(
  email: string,
  password: string
): Promise<{ ok: true; uid: string } | { ok: false; mensaje: string }> {
  const emailNorm = email.trim().toLowerCase();

  try {
    const actual = auth.currentUser;

    // La app inicia sesión anónima al cargar; vinculamos esa sesión al correo nuevo.
    if (actual?.isAnonymous) {
      const credential = EmailAuthProvider.credential(emailNorm, password);
      const cred = await linkWithCredential(actual, credential);
      return { ok: true, uid: cred.user.uid };
    }

    if (actual) {
      await signOut(auth);
    }

    const cred = await createUserWithEmailAndPassword(auth, emailNorm, password);
    return { ok: true, uid: cred.user.uid };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    console.error("[registrarAdminFirebase]", code, err);
    return { ok: false, mensaje: mensajeErrorRegistroAuth(code) };
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
