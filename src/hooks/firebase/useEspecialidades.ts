import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";

export function useEspecialidades() {
  const { data: especialidades, loading } = useFirestoreCollection("especialidades");
  return { especialidades, loading };
}
