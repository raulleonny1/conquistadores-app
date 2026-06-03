import { sincronizarFechasNacimientoClub } from "../src/lib/sincronizarFechasNacimiento";

async function main() {
  const result = await sincronizarFechasNacimientoClub();
  console.log("Actualizados:", result.actualizados);
  for (const line of result.detalle) console.log(" -", line);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
