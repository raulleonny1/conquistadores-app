import { db } from "@/src/firebase";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { CargoDirectiva, Club, ProgramaClub, RegistroClubInput } from "@/src/types/club";

export function slugificarNombre(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function generarAdminPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function buscarClubPorSlug(slug: string): Promise<Club | null> {
  const normalizado = slugificarNombre(slug);
  if (!normalizado) return null;

  await ensureFirebaseSession();
  const ref = doc(db, "clubs", normalizado);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    slug: snap.id,
    nombre: String(data.nombre ?? ""),
    ciudad: String(data.ciudad ?? ""),
    pais: String(data.pais ?? ""),
    responsable: String(data.responsable ?? ""),
    cargo: data.cargo ? (String(data.cargo) as CargoDirectiva) : undefined,
    email: String(data.email ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    programas: (data.programas ?? []) as ProgramaClub[],
    adminPin: String(data.adminPin ?? ""),
    activo: data.activo !== false,
    creadoEn: String(data.creadoEn ?? ""),
  };
}

export async function registrarClub(
  input: RegistroClubInput
): Promise<{ ok: true; club: Club } | { ok: false; mensaje: string }> {
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, mensaje: "Ingresa el nombre del club." };
  if (!input.ciudad.trim()) return { ok: false, mensaje: "Ingresa la ciudad." };
  if (!input.pais.trim()) return { ok: false, mensaje: "Selecciona el país." };
  if (!input.responsable.trim()) return { ok: false, mensaje: "Ingresa tu nombre." };
  if (!input.cargo) return { ok: false, mensaje: "Selecciona tu cargo en la directiva." };
  if (!input.email.trim()) return { ok: false, mensaje: "Ingresa un correo de contacto." };
  if (!input.programa) {
    return { ok: false, mensaje: "Selecciona el programa del club." };
  }

  const slug = slugificarNombre(nombre);
  if (!slug) return { ok: false, mensaje: "El nombre del club no es válido." };

  // Tras registrarAdminFirebase el usuario ya tiene sesión con correo; no forzar anónimo.
  if (!input.adminUid) {
    await ensureFirebaseSession();
  }
  const existente = await getDoc(doc(db, "clubs", slug));
  if (existente.exists()) {
    return {
      ok: false,
      mensaje: "Ya existe un club con un nombre similar. Elige otro nombre o contacta soporte.",
    };
  }

  const adminPin = generarAdminPin();

  const creadoEn = new Date().toISOString();
  const clubData: Record<string, unknown> = {
    nombre,
    ciudad: input.ciudad.trim(),
    pais: input.pais.trim() || "Ecuador",
    responsable: input.responsable.trim(),
    cargo: input.cargo,
    email: input.email.trim().toLowerCase(),
    whatsapp: input.whatsapp.trim(),
    programas: [input.programa],
    adminPin,
    activo: true,
    creadoEn,
  };
  if (input.adminUid) {
    clubData.adminUid = input.adminUid;
  }

  try {
    await setDoc(doc(db, "clubs", slug), clubData);
  } catch (err: unknown) {
    console.error("[registrarClub] Firestore", err);
    const code = (err as { code?: string }).code;
    if (code === "permission-denied") {
      return {
        ok: false,
        mensaje:
          "No se pudo guardar el club (permisos de Firestore). Despliega firestore.rules en Firebase.",
      };
    }
    return { ok: false, mensaje: "No se pudo guardar el club. Intenta de nuevo." };
  }

  const club: Club = {
    id: slug,
    slug,
    nombre,
    ciudad: input.ciudad.trim(),
    pais: input.pais.trim() || "Ecuador",
    responsable: input.responsable.trim(),
    cargo: input.cargo,
    email: input.email.trim().toLowerCase(),
    whatsapp: input.whatsapp.trim(),
    programas: [input.programa],
    adminPin,
    activo: true,
    creadoEn,
  };

  return { ok: true, club };
}

export async function validarAdminClub(
  slug: string,
  pin: string
): Promise<Club | null> {
  const club = await buscarClubPorSlug(slug);
  if (!club || !club.activo) return null;
  if (club.adminPin !== pin.trim()) return null;
  return club;
}

export async function clubTienePrograma(
  slug: string,
  programa: ProgramaClub
): Promise<boolean> {
  const club = await buscarClubPorSlug(slug);
  return Boolean(club?.programas.includes(programa));
}

/** Colección de miembros según programa */
export function coleccionPorPrograma(programa: ProgramaClub): string {
  switch (programa) {
    case "conquistadores":
      return "RegistroConquis";
    case "aventureros":
      return "aventureros";
    case "ja":
      return "jovenesJA";
  }
}

export async function buscarClubPorAdminPin(pin: string): Promise<Club | null> {
  const snap = await getDocs(
    query(collection(db, "clubs"), where("adminPin", "==", pin.trim()))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    slug: d.id,
    nombre: String(data.nombre ?? ""),
    ciudad: String(data.ciudad ?? ""),
    pais: String(data.pais ?? ""),
    responsable: String(data.responsable ?? ""),
    cargo: data.cargo ? (String(data.cargo) as CargoDirectiva) : undefined,
    email: String(data.email ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    programas: (data.programas ?? []) as ProgramaClub[],
    adminPin: String(data.adminPin ?? ""),
    activo: data.activo !== false,
    creadoEn: String(data.creadoEn ?? ""),
  };
}
