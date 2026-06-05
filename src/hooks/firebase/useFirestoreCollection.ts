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
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { restriccionesConsultaClub } from "@/src/lib/clubScope";

/**
 * Suscripción a Firestore con filtro automático por clubId cuando aplica.
 */
export function useFirestoreCollection<T = unknown>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  deps: unknown[] = []
) {
  const { clubId } = useClubActivo();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restricciones = restriccionesConsultaClub(
      collectionName,
      clubId,
      queryConstraints
    );

    if (restricciones === null) {
      setData([]);
      setLoading(false);
      return;
    }

    const colRef: CollectionReference<DocumentData> = collection(db, collectionName);
    const q: Query<DocumentData> = restricciones.length
      ? query(colRef, ...restricciones)
      : (colRef as Query<DocumentData>);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as unknown as T)
        );
        setLoading(false);
      },
      () => {
        setData([]);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, clubId, queryConstraints.length, ...deps]);

  return { data, loading, clubId };
}
