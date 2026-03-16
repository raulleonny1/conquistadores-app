/**
 * Example: set custom claims for a Firebase user.
 *
 * Usage:
 *   npm install firebase-admin
 *   node scripts/setCustomClaims.js <uid> <role> [pin] [unidad] [consejeroId]
 *
 * This script is not required for the app to run, but it helps seed
 * the `request.auth.token.role` claim that the security rules rely on.
 */

const admin = require("firebase-admin");

// Replace with your service account JSON or use GOOGLE_APPLICATION_CREDENTIALS.
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const [uid, role, pin, unidad, consejeroId] = process.argv.slice(2);

if (!uid || !role) {
  console.error("Usage: node scripts/setCustomClaims.js <uid> <role> [pin] [unidad] [consejeroId]");
  process.exit(1);
}

const claims = { role };
if (pin) claims.pin = pin;
if (unidad) claims.unidad = unidad;
if (consejeroId) claims.consejeroId = consejeroId;

admin
  .auth()
  .setCustomUserClaims(uid, claims)
  .then(() => {
    console.log("Custom claims set:", claims);
    console.log("Note: the user must reauthenticate to see updated claims.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error setting custom claims:", err);
    process.exit(1);
  });
