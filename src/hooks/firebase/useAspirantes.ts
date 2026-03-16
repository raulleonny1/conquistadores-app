import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";

export function useAspirantes() {
  const { data: aspirantes, loading } = useFirestoreCollection("aspirantes");
  return { aspirantes, loading };
}
