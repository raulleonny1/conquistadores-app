"use client";

import { useEffect } from "react";
import { ensureFirebaseSession } from "@/src/lib/firebaseSession";

export default function FirebaseSessionInit() {
  useEffect(() => {
    ensureFirebaseSession().catch(() => {
      /* La UI mostrará errores de Firestore si falla */
    });
  }, []);

  return null;
}
