import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "@/src/lib/firebaseConfig";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/** Formatea a dd/mm/yyyy. Acepta Date, ISO (yyyy-mm-dd) o texto ya en dd/mm/yyyy. */
export function formatFechaDDMMYYYY(date: Date | string | null | undefined): string {
  if (date == null || date === "") return "—";

  if (typeof date === "string") {
    const s = date.trim();
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const m1 = s.match(ddmmyyyy);
    if (m1) {
      const [, d, mo, y] = m1;
      return `${d.padStart(2, "0")}/${mo.padStart(2, "0")}/${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(`${s.slice(0, 10)}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        return formatFechaDDMMYYYY(d);
      }
    }
    const parsed = new Date(s);
    if (!Number.isNaN(parsed.getTime())) {
      return formatFechaDDMMYYYY(parsed);
    }
    return s;
  }

  if (Number.isNaN(date.getTime())) return "—";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
