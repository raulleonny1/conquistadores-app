"use client";

import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";

export function useUnidades() {
  const { data: unidades, loading } = useFirestoreCollection("unidades");
  return { unidades, loading };
}
