/**
 * Backfill calificacionesConquis for existing RegistroConquis and aspirantesGuiaMayor.
 *
 * Usage:
 *   node scripts/backfillCalificacionesConquis.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const localServiceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const envServiceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

if (fs.existsSync(localServiceAccountPath)) {
  const serviceAccount = require(localServiceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (envServiceAccountPath && fs.existsSync(envServiceAccountPath)) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} else {
  console.error("Missing credentials. Provide either:");
  console.error("1) ./serviceAccountKey.json in project root, or");
  console.error("2) GOOGLE_APPLICATION_CREDENTIALS pointing to a valid service account JSON file.");
  process.exit(1);
}

const db = admin.firestore();

const CATEGORIAS_BASE = [
  "puntualidad",
  "asistencia",
  "disciplina",
  "reclutador",
  "materiales",
  "fidelidad",
  "misionero",
  "colaborador",
  "orden_cerrado",
  "tareas",
  "especialidades",
];

function buildZeroPoints() {
  return CATEGORIAS_BASE.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

async function collectPeople() {
  const [conquisSnap, aspirantesSnap] = await Promise.all([
    db.collection("RegistroConquis").get(),
    db.collection("aspirantesGuiaMayor").get(),
  ]);

  const people = [];

  conquisSnap.docs.forEach((d) => {
    const data = d.data() || {};
    const pin = data.pin;
    if (!pin) return;
    const fullName = [data.nombre || "", data.apellido || ""].join(" ").trim();
    people.push({
      pin: String(pin),
      nombre: fullName || data.nombre || "",
      tipo: "conquistador",
    });
  });

  aspirantesSnap.docs.forEach((d) => {
    const data = d.data() || {};
    const pin = data.pin || d.id;
    if (!pin) return;
    people.push({
      pin: String(pin),
      nombre: data.nombre || "",
      tipo: "aspirante",
    });
  });

  const dedup = new Map();
  people.forEach((p) => {
    if (!dedup.has(p.pin)) dedup.set(p.pin, p);
  });
  return Array.from(dedup.values());
}

async function run() {
  const people = await collectPeople();
  if (people.length === 0) {
    console.log("No people with pin found.");
    return;
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  const batchSize = 400;
  let batch = db.batch();
  let pending = 0;

  for (const person of people) {
    const ref = db.collection("calificacionesConquis").doc(person.pin);
    const snap = await ref.get();

    if (!snap.exists) {
      batch.set(ref, {
        pin: person.pin,
        nombre: person.nombre,
        tipo: person.tipo,
        puntos: buildZeroPoints(),
      });
      created += 1;
      pending += 1;
    } else {
      const data = snap.data() || {};
      const existingPoints = data.puntos || {};
      const mergedPoints = { ...buildZeroPoints(), ...existingPoints };
      const needsPointsShape = Object.keys(mergedPoints).length !== Object.keys(existingPoints).length;
      const needsPin = !data.pin;
      const needsName = !data.nombre && person.nombre;
      const needsTipo = !data.tipo;

      if (needsPointsShape || needsPin || needsName || needsTipo) {
        const patch = { puntos: mergedPoints };
        if (needsPin) patch.pin = person.pin;
        if (needsName) patch.nombre = person.nombre;
        if (needsTipo) patch.tipo = person.tipo;
        batch.set(ref, patch, { merge: true });
        updated += 1;
        pending += 1;
      } else {
        unchanged += 1;
      }
    }

    if (pending >= batchSize) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
  }

  console.log("Backfill complete.");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill error:", err);
    process.exit(1);
  });
