import { useState, useEffect } from "react";
import { db } from "@/src/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export function useConsejeros() {
  const [consejeros, setConsejeros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "consejeros"), (snapshot) => {
      setConsejeros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { consejeros, loading };
}
