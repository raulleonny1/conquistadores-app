export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/src/firebase";
import RegistroConquisPageInner from "./RegistroConquisPageInner";

async function fetchUnidades() {
  const snapshot = await getDocs(collection(db, "unidades"));
  return snapshot.docs.map(doc => ({ nombre: doc.data().nombre, consejero: doc.data().consejero || "" }));
}

async function fetchConsejeros() {
  const snapshot = await getDocs(collection(db, "consejeros"));
  return snapshot.docs.map(doc => ({ nombre: doc.data().nombre, unidades: doc.data().unidades || [] }));
}

export default async function RegistroConquisPage() {
  const [unidades, consejeros] = await Promise.all([fetchUnidades(), fetchConsejeros()]);

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegistroConquisPageInner unidades={unidades} consejeros={consejeros} />
    </Suspense>
  );
}
