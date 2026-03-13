import { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function useAspirantes() {
  const [aspirantes, setAspirantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "aspirantes"), (snapshot) => {
      setAspirantes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { aspirantes, loading };
}
