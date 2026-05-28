"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/firebase";
import { consejeroPuedeCalificar } from "@/src/lib/consejeroPermisos";

export function useConsejeroPuedeCalificar(consejeroId: string | null | undefined) {
  const [puedeCalificar, setPuedeCalificar] = useState(false);
  const [loading, setLoading] = useState(Boolean(consejeroId));

  useEffect(() => {
    if (!consejeroId) {
      setPuedeCalificar(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(doc(db, "consejeros", consejeroId), (snap) => {
      setPuedeCalificar(
        snap.exists() ? consejeroPuedeCalificar(snap.data()) : false
      );
      setLoading(false);
    });
    return () => unsub();
  }, [consejeroId]);

  return { puedeCalificar, loading };
}
