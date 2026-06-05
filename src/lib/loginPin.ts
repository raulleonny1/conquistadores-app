import { db } from "@/src/firebase";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";
import { collection, getDocs, query, where } from "firebase/firestore";
import { registroAspiranteCompleto } from "@/src/constants/aspirante";
import { guardarSesionClub } from "@/src/lib/clubSession";
import {
  buscarClubPorSlug,
  clubTienePrograma,
  coleccionPorPrograma,
} from "@/src/lib/clubs";
import { iniciarSesionAdminPin } from "@/src/lib/authClub";
import { logError, logInfo } from "@/src/lib/logger";
import { irARuta } from "@/src/lib/navegacion";
import { storageSeguroSet } from "@/src/lib/storageSeguro";
import type { ProgramaClub } from "@/src/types/club";

export type ResultadoLoginPin =
  | { ok: true }
  | { ok: false; mensaje: string };

type OpcionesLogin = {
  clubSlug: string;
  programa?: ProgramaClub | "club";
};

function consultarDirectiva(clubId: string, pin: string, cargo: string) {
  return getDocs(
    query(
      collection(db, "directivaClub"),
      where("clubId", "==", clubId),
      where("cargo", "==", cargo),
      where("pin", "==", pin)
    )
  );
}

/** Login administrador del club (PIN generado al registrar el club). */
export async function resolverLoginAdminClub(
  clubSlug: string,
  pin: string
): Promise<ResultadoLoginPin> {
  return iniciarSesionAdminPin(clubSlug, pin);
}

/** Resuelve el PIN dentro de un club y programa. */
export async function resolverLoginPorPin(
  pin: string,
  opciones: OpcionesLogin
): Promise<ResultadoLoginPin> {
  const clubSlug = opciones.clubSlug.trim();
  const programa = opciones.programa ?? "conquistadores";

  if (programa === "club") {
    return resolverLoginAdminClub(clubSlug, pin);
  }

  try {
    await ensureFirebaseSession();
    const club = await buscarClubPorSlug(clubSlug);
    if (!club || !club.activo) {
      return { ok: false, mensaje: "Club no encontrado. Verifica el código." };
    }

    if (!(await clubTienePrograma(clubSlug, programa))) {
      return {
        ok: false,
        mensaje: `Este club no tiene habilitado el programa de ${programa}.`,
      };
    }

    guardarSesionClub(club);
    const clubId = club.id;

    if (programa === "conquistadores") {
      if (pin === "*611") {
        logInfo("Login evaluador guía mayor exitoso");
        irARuta(`/admin/evaluar-guia-mayor?club=${encodeURIComponent(club.slug)}`);
        return { ok: true };
      }

      try {
        const snapshotDirector = await consultarDirectiva(clubId, pin, "Director/a");
        if (!snapshotDirector.empty) {
          logInfo("Login director exitoso: " + pin);
          irARuta(
            `/admin/directiva/dashboard-director?pin=${encodeURIComponent(pin)}&club=${encodeURIComponent(club.slug)}`
          );
          return { ok: true };
        }
      } catch (err) {
        logError("Consulta director: " + String(err));
      }

      try {
        const snapshotSubdirector = await consultarDirectiva(clubId, pin, "Subdirector/a");
        if (!snapshotSubdirector.empty) {
          logInfo("Login subdirector exitoso: " + pin);
          irARuta(
            `/admin/directiva/dashboard-subdirector?pin=${encodeURIComponent(pin)}&club=${encodeURIComponent(club.slug)}`
          );
          return { ok: true };
        }
      } catch (err) {
        logError("Consulta subdirector: " + String(err));
      }

      const snapshotConsejero = await getDocs(
        query(
          collection(db, "consejeros"),
          where("clubId", "==", clubId),
          where("pin", "==", pin)
        )
      );
      if (!snapshotConsejero.empty) {
        const consejeroDoc = snapshotConsejero.docs[0];
        logInfo("Login consejero exitoso: " + consejeroDoc.id);
        storageSeguroSet("consejeroId", consejeroDoc.id);
        irARuta(`/consejero/${consejeroDoc.id}?club=${encodeURIComponent(club.slug)}`);
        return { ok: true };
      }

      const snapshotMiembro = await getDocs(
        query(
          collection(db, "RegistroConquis"),
          where("clubId", "==", clubId),
          where("pin", "==", pin)
        )
      );
      if (!snapshotMiembro.empty) {
        logInfo("Login miembro exitoso: " + pin);
        irARuta(
          `/miembros/dashboard?pin=${encodeURIComponent(pin)}&club=${encodeURIComponent(club.slug)}`
        );
        return { ok: true };
      }

      const snapshotAspirante = await getDocs(
        query(
          collection(db, "aspirantesGuiaMayor"),
          where("clubId", "==", clubId),
          where("pin", "==", pin)
        )
      );
      if (!snapshotAspirante.empty) {
        const aspiranteDoc = snapshotAspirante.docs[0];
        const data = aspiranteDoc.data();
        const registroCompleto = registroAspiranteCompleto(data);
        logInfo("Login aspirante exitoso: " + pin);
        if (!registroCompleto) {
          irARuta(
            `/aspirante/completar-registro?pin=${encodeURIComponent(pin)}&club=${encodeURIComponent(club.slug)}`
          );
        } else {
          irARuta(
            `/aspirante/dashboard?pin=${encodeURIComponent(pin)}&club=${encodeURIComponent(club.slug)}`
          );
        }
        return { ok: true };
      }
    } else {
      const coleccion = coleccionPorPrograma(programa);
      const snapshotMiembro = await getDocs(
        query(
          collection(db, coleccion),
          where("clubId", "==", clubId),
          where("pin", "==", pin)
        )
      );
      if (!snapshotMiembro.empty) {
        logInfo(`Login ${programa} exitoso: ` + pin);
        irARuta(
          `/${programa}/dashboard?pin=${encodeURIComponent(pin)}&club=${encodeURIComponent(club.slug)}`
        );
        return { ok: true };
      }
    }

    logError("PIN incorrecto: " + pin);
    return { ok: false, mensaje: "PIN incorrecto para este club." };
  } catch (err) {
    logError("Error de conexión en login: " + String(err));
    return {
      ok: false,
      mensaje: "No se pudo conectar. Revisa internet o intenta de nuevo.",
    };
  }
}
