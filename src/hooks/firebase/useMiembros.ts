"use client";

import { where } from "firebase/firestore";
import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";

export function useMiembros(unidad?: string) {
  const constraints = unidad ? [where("unidad", "==", unidad)] : [];
  const { data: miembros, loading } = useFirestoreCollection("RegistroConquis", constraints, [unidad]);
  return { miembros, loading };
}
