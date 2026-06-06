import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";
import type { AspiranteDoc } from "@/src/types/firestoreDocs";

export function useAspirantes() {
  const { data: aspirantes, loading } = useFirestoreCollection<AspiranteDoc>("aspirantes");
  return { aspirantes, loading };
}
