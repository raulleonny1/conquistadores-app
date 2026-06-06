/**
 * Recarga el catálogo IASD en Firebase para un club.
 * Uso: node scripts/recargar-especialidades-run.mjs caleb
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const clubId = (process.argv[2] || "caleb").trim();

const firebaseConfig = JSON.parse(
  readFileSync(resolve(root, "firebase.config.json"), "utf8")
);

/** Parsea especialidadesBase desde el archivo TS (sin compilar). */
function cargarEspecialidadesBase() {
  const src = readFileSync(resolve(root, "src/data/especialidades.ts"), "utf8");
  const items = [];
  const re =
    /\{\s*area:\s*"([^"]+)",\s*categoria:\s*"([^"]+)",\s*especialidad:\s*"([^"]+)"(?:,\s*codigo:\s*"([^"]+)")?\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    items.push({
      area: m[1],
      categoria: m[2],
      especialidad: m[3],
      ...(m[4] ? { codigo: m[4] } : {}),
    });
  }
  return items;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log(`Club: ${clubId}`);
  await signInAnonymously(auth);
  console.log("Sesión anónima OK");

  const catalogo = cargarEspecialidadesBase();
  console.log(`Catálogo IASD: ${catalogo.length} especialidades`);

  const q = query(collection(db, "especialidades"), where("clubId", "==", clubId));
  const snap = await getDocs(q);
  console.log(`En Firebase ahora: ${snap.size} documentos`);

  let batch = writeBatch(db);
  let ops = 0;
  let eliminados = 0;
  for (const d of snap.docs) {
    batch.delete(doc(db, "especialidades", d.id));
    ops++;
    eliminados++;
    if (ops >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  console.log(`Eliminados: ${eliminados}`);

  let agregados = 0;
  for (const esp of catalogo) {
    await addDoc(collection(db, "especialidades"), { ...esp, clubId });
    agregados++;
    if (agregados % 50 === 0) console.log(`  …${agregados}`);
  }

  console.log(`Agregados en Firebase: ${agregados}`);
  console.log("✓ Listo. Recarga /admin/especialidades?club=" + clubId);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e.message || e);
  process.exit(1);
});
