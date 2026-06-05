/**
 * Ejecuta consolidación de unidades en Firebase (Unidad de Gacelas → Gacelas, etc.)
 * Uso: node scripts/consolidar-unidades-run.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const path = resolve(root, ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

function normalizarUnidad(nombre) {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bdel\b/g, "de")
    .replace(/\s+/g, " ");
}

function quitarPrefijoUnidadDe(nombre) {
  return nombre.trim().replace(/^unidad de\s+/i, "").trim();
}

function claveBaseUnidad(nombre) {
  return normalizarUnidad(quitarPrefijoUnidadDe(nombre));
}

function elegirNombreCanonicoUnidad(nombres) {
  const unicos = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))];
  if (!unicos.length) return "";
  const sinPrefijo = unicos.find((u) => !/^unidad de\s+/i.test(u));
  if (sinPrefijo) return sinPrefijo;
  return quitarPrefijoUnidadDe(unicos[0]) || unicos[0];
}

function canonicalizarUnidad(nombre, catalogo) {
  const trimmed = nombre.trim();
  if (!trimmed) return trimmed;
  const base = claveBaseUnidad(trimmed);
  const candidatos = catalogo.filter((u) => claveBaseUnidad(u) === base);
  if (candidatos.length) {
    const sinPrefijo = candidatos.find((u) => !/^unidad de\s+/i.test(u.trim()));
    return (sinPrefijo ?? candidatos[0]).trim();
  }
  return quitarPrefijoUnidadDe(trimmed) || trimmed;
}

function toNumberPuntos(v) {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

function claveDocCalificacionesUnidad(unidad, catalogo) {
  const nombre = catalogo.length ? canonicalizarUnidad(unidad.trim(), catalogo) : unidad.trim();
  const slug = normalizarUnidad(nombre).replace(/\s+/g, "_");
  return `unidad_${slug}`;
}

function fusionarMapasPuntos(destino, origen) {
  const out = { ...destino };
  for (const [k, v] of Object.entries(origen)) {
    out[k] = toNumberPuntos(out[k]) + toNumberPuntos(v);
  }
  return out;
}

async function fusionarDocumentoPuntosUnidad(nombreViejo, nombreNuevo, catalogo) {
  const idViejo = claveDocCalificacionesUnidad(nombreViejo, catalogo);
  const idNuevo = claveDocCalificacionesUnidad(nombreNuevo, catalogo);
  if (idViejo === idNuevo) return false;

  const refViejo = doc(db, "calificacionesConquis", idViejo);
  const refNuevo = doc(db, "calificacionesConquis", idNuevo);
  const [snapViejo, snapNuevo] = await Promise.all([getDoc(refViejo), getDoc(refNuevo)]);

  if (!snapViejo.exists()) return false;

  const dataViejo = snapViejo.data();
  const puntosViejos = dataViejo.puntos || {};
  const etiquetasViejas = dataViejo.etiquetasActividades || {};
  const puntosNuevos = snapNuevo.exists() ? snapNuevo.data().puntos || {} : {};
  const etiquetasNuevas = snapNuevo.exists() ? snapNuevo.data().etiquetasActividades || {} : {};

  await setDoc(
    refNuevo,
    {
      tipo: "unidad",
      alcance: "unidad",
      unidad: nombreNuevo,
      nombre: nombreNuevo,
      pin: idNuevo,
      puntos: fusionarMapasPuntos(puntosNuevos, puntosViejos),
      etiquetasActividades: { ...etiquetasViejas, ...etiquetasNuevas },
      fechaUltima: dataViejo.fechaUltima ?? snapNuevo.data()?.fechaUltima ?? "",
    },
    { merge: true }
  );

  await deleteDoc(refViejo);
  return true;
}

async function main() {
  console.log("Consolidando unidades en Firebase...\n");

  const unidadesSnap = await getDocs(collection(db, "unidades"));
  const filasCatalogo = unidadesSnap.docs.map((d) => ({
    id: d.id,
    nombre: String(d.data().nombre ?? "").trim(),
  }));

  console.log("Catálogo actual:", filasCatalogo.map((f) => f.nombre).join(", "));

  const mapaRenombre = new Map();
  const gruposCatalogo = new Map();

  for (const f of filasCatalogo) {
    if (!f.nombre) continue;
    const base = claveBaseUnidad(f.nombre);
    const prev = gruposCatalogo.get(base) ?? [];
    prev.push(f);
    gruposCatalogo.set(base, prev);
  }

  for (const [base, grupo] of gruposCatalogo) {
    const canon = elegirNombreCanonicoUnidad(grupo.map((g) => g.nombre));
    const keeper = grupo.find((g) => g.nombre === canon) ?? grupo[0];

    console.log(`\nGrupo «${base}»: canónico = «${canon}»`);

    if (keeper.nombre !== canon) {
      await updateDoc(doc(db, "unidades", keeper.id), { nombre: canon });
      mapaRenombre.set(keeper.nombre, canon);
      console.log(`  Renombrado catálogo: «${keeper.nombre}» → «${canon}»`);
    }

    for (const g of grupo) {
      if (g.nombre !== canon) mapaRenombre.set(g.nombre, canon);
      if (g.id === keeper.id) continue;
      await deleteDoc(doc(db, "unidades", g.id));
      console.log(`  Eliminado del catálogo: «${g.nombre}»`);
    }
  }

  const catalogoActualizado = [
    ...new Set(filasCatalogo.map((f) => mapaRenombre.get(f.nombre) ?? f.nombre).filter(Boolean)),
  ];

  const resolverCanon = (nombre) => {
    const trimmed = nombre.trim();
    if (!trimmed) return trimmed;
    if (mapaRenombre.has(trimmed)) return mapaRenombre.get(trimmed);
    return canonicalizarUnidad(trimmed, catalogoActualizado);
  };

  const conquisSnap = await getDocs(collection(db, "RegistroConquis"));
  let batch = writeBatch(db);
  let ops = 0;
  let conquisOk = 0;

  for (const d of conquisSnap.docs) {
    const viejo = String(d.data().unidad ?? "").trim();
    if (!viejo) continue;
    const nuevo = resolverCanon(viejo);
    if (nuevo && nuevo !== viejo) {
      batch.update(doc(db, "RegistroConquis", d.id), { unidad: nuevo });
      ops++;
      conquisOk++;
      console.log(`  Conquistador ${d.data().nombre}: «${viejo}» → «${nuevo}»`);
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }
  if (ops > 0) await batch.commit();
  console.log(`\nConquistadores actualizados: ${conquisOk}`);

  for (const [viejo, nuevo] of mapaRenombre) {
    const ok = await fusionarDocumentoPuntosUnidad(viejo, nuevo, catalogoActualizado);
    if (ok) console.log(`  Puntos unidad fusionados: «${viejo}» → «${nuevo}»`);
  }

  const historialSnap = await getDocs(collection(db, "calificacionesSemanal"));
  batch = writeBatch(db);
  ops = 0;
  let hist = 0;
  for (const d of historialSnap.docs) {
    const u = String(d.data().unidad ?? "").trim();
    if (!u) continue;
    const nuevo = resolverCanon(u);
    if (nuevo && nuevo !== u) {
      batch.update(doc(db, "calificacionesSemanal", d.id), { unidad: nuevo });
      ops++;
      hist++;
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }
  if (ops > 0) await batch.commit();
  console.log(`Historial actualizado: ${hist}`);

  console.log("\n✓ Listo. Recarga /admin/rankin");
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
