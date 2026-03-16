export const dynamic = "force-dynamic";

import ConsejeroPage from "./ConsejeroPageClient";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../src/firebase";

async function fetchUnidadesRegistradas() {
  const snapshot = await getDocs(collection(db, "unidades"));
  return snapshot.docs.map(doc => doc.data().nombre);
}

export default async function ConsejeroPageWrapper() {
  const unidadesRegistradas = await fetchUnidadesRegistradas();
  return <ConsejeroPage initialUnidadesRegistradas={unidadesRegistradas} />;
}
