"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/firebase";
import {
  collection,
  onSnapshot,
  query,
  QueryConstraint,
  Query,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";

/**
 * Use this hook to subscribe to a Firestore collection with optional query filters.
 *
 * Advantages:
 * - Avoids downloading whole collections when a filter is available.
 * - Centralizes subscription logic.
 * - Makes components easier to test / refactor.
 */
export function useFirestoreCollection<T = any>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colRef: CollectionReference<DocumentData> = collection(db, collectionName);
    const q: Query<DocumentData> = queryConstraints.length
      ? query(colRef, ...queryConstraints)
      : (colRef as Query<DocumentData>);

    const unsub = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T)));
      setLoading(false);
    });

    return () => unsub();
  }, [collectionName, queryConstraints.length, ...deps]);

  return { data, loading };
}
