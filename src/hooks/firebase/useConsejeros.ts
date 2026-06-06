import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";
import type { ConsejeroDoc } from "@/src/types/firestoreDocs";

export function useConsejeros() {
  const { data: consejeros, loading } = useFirestoreCollection<ConsejeroDoc>("consejeros");
  return { consejeros, loading };
}
