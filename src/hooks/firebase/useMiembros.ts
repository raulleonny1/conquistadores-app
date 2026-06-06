"use client";

import { where } from "firebase/firestore";
import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";
import type { MiembroDoc } from "@/src/types/firestoreDocs";

export function useMiembros(unidad?: string) {
  const constraints = unidad ? [where("unidad", "==", unidad)] : [];
  const { data: miembros, loading } = useFirestoreCollection<MiembroDoc>(
    "RegistroConquis",
    constraints,
    [unidad]
  );
  return { miembros, loading };
}
