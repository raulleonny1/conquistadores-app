"use client";

import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";

export function useEventos() {
  const { data: eventos, loading } = useFirestoreCollection("eventos");
  return { eventos, loading };
}
