"use client";

import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";
import type { EventoDoc } from "@/src/types/firestoreDocs";

export function useEventos() {
  const { data: eventos, loading } = useFirestoreCollection<EventoDoc>("eventos");
  return { eventos, loading };
}
