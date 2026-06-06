"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";

/** Rutas donde no hace falta sesión anónima (registro/login con correo). */
const RUTAS_SIN_ANONIMO = ["/registro", "/login/club"];

export default function FirebaseSessionInit() {
  const pathname = usePathname();

  useEffect(() => {
    if (RUTAS_SIN_ANONIMO.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      return;
    }
    ensureFirebaseSession().catch((err: unknown) => {
      const code = (err as { code?: string }).code;
      if (code === "auth/configuration-not-found") {
        console.warn(
          "[Firebase] Authentication no está activo en este proyecto. " +
            "Firebase Console → Authentication → Comenzar → habilita Anónimo y Correo/contraseña."
        );
      }
    });
  }, [pathname]);

  return null;
}
