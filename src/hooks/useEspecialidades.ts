import { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function useEspecialidades() {
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "especialidades"), (snapshot) => {
      setEspecialidades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { especialidades, loading };
}
