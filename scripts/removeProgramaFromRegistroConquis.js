/**
 * Removes "programa" field from all documents in RegistroConquis.
 *
 * Usage:
 *   npm install firebase-admin
 *   node scripts/removeProgramaFromRegistroConquis.js
 */

const admin = require("firebase-admin");

// Reuse local service account used by other scripts in this repo.
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection("RegistroConquis").get();
  if (snapshot.empty) {
    console.log("No documents found in RegistroConquis.");
    return;
  }

  let updated = 0;
  const batchSize = 400;
  let batch = db.batch();
  let pending = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (Object.prototype.hasOwnProperty.call(data, "programa")) {
      batch.update(docSnap.ref, {
        programa: admin.firestore.FieldValue.delete(),
      });
      updated += 1;
      pending += 1;
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

  console.log(`Completed. Removed "programa" from ${updated} documents.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error removing programa field:", err);
    process.exit(1);
  });
