"use client";

import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";
import type { UnidadDoc } from "@/src/types/firestoreDocs";

export function useUnidades() {
  const { data: unidades, loading } = useFirestoreCollection<UnidadDoc>("unidades");
  return { unidades, loading };
}
