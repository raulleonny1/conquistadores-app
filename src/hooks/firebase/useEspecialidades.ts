import { useFirestoreCollection } from "@/src/hooks/firebase/useFirestoreCollection";
import type { EspecialidadDoc } from "@/src/types/firestoreDocs";

export function useEspecialidades() {
  const { data: especialidades, loading } = useFirestoreCollection<EspecialidadDoc>("especialidades");
  return { especialidades, loading };
}
