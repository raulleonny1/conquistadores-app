import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";

export function useConsejeros() {
  const { data: consejeros, loading } = useFirestoreCollection("consejeros");
  return { consejeros, loading };
}
