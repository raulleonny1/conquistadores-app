import { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function useMiembros() {
  const [miembros, setMiembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "RegistroConquis"), (snapshot) => {
      setMiembros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { miembros, loading };
}
