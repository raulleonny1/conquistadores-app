const { exec } = require("child_process");

// Cambia por tu proyecto y ruta de backup
const PROJECT_ID = "conquistadoresapp-78f92";
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