const { exec } = require("child_process");

// Cambia por tu proyecto y ruta de backup
const { projectId: PROJECT_ID } = require("../../firebase.config.json");
const BACKUP_PATH = "./firestore-backup";

exec(
  `firebase firestore:export ${BACKUP_PATH} --project ${PROJECT_ID}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error("Error en backup:", error);
      return;
    }
    console.log("Backup completado:", stdout);
  }
);