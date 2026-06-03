import { db } from "@/src/firebase";
import { nombreCompletoAspirante } from "@/src/constants/aspirante";
import {
  extraerFechaNacimiento,
  extraerFechaNacimientoAsociado,
  extraerFechaNacimientoTitular,
  IndiceFechasNacimiento,
} from "@/src/lib/cumpleanos";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

export type ResultadoSincronizacionFechas = {
  actualizados: number;
  detalle: string[];
};

async function construirIndiceDesdeFirebase(): Promise<IndiceFechasNacimiento> {
  const indice = new IndiceFechasNacimiento();

  const [conquis, aspirantes, consejeros, directiva, fichas] = await Promise.all([
    getDocs(collection(db, "RegistroConquis")),
    getDocs(collection(db, "aspirantesGuiaMayor")),
    getDocs(collection(db, "consejeros")),
    getDocs(collection(db, "directivaClub")),
    getDocs(collection(db, "fichasMedicas")).catch(() => null),
  ]);

  for (const d of conquis.docs) {
    const data = d.data() as Record<string, unknown>;
    const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "RegistroConquis", d.id);
  }

  for (const d of aspirantes.docs) {
    const data = d.data() as Record<string, unknown>;
    const nombre = nombreCompletoAspirante(data);
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "aspirantesGuiaMayor", d.id);
  }

  for (const d of consejeros.docs) {
    const data = d.data() as Record<string, unknown>;
    const titular = String(data.nombre ?? "").trim();
    const asoc = String(data.consejeroAsociado ?? "").trim();
    const fTit = extraerFechaNacimientoTitular(data);
    const fAsoc = extraerFechaNacimientoAsociado(data);
    if (titular && fTit) indice.agregar(titular, fTit, "consejeros", d.id);
    if (asoc && fAsoc) indice.agregar(asoc, fAsoc, "consejeros", d.id);
  }

  for (const d of directiva.docs) {
    const data = d.data() as Record<string, unknown>;
    const nombre = String(data.nombre ?? "").trim();
    const fecha = extraerFechaNacimiento(data);
    if (nombre && fecha) indice.agregar(nombre, fecha, "directivaClub", d.id);
  }

  if (fichas) {
    for (const d of fichas.docs) {
      const data = d.data() as Record<string, unknown>;
      const nombre = String(data.nombre ?? "").trim();
      const fecha = extraerFechaNacimiento(data);
      if (nombre && fecha) indice.agregar(nombre, fecha, "fichasMedicas", d.id);
      if (fecha) indice.agregarPorPin(d.id, fecha);
    }
  }

  return indice;
}

function buscarFechaPorPin(
  pin: string,
  fichasSnap: Awaited<ReturnType<typeof getDocs>> | null
): string {
  const p = String(pin ?? "").trim();
  if (!p || !fichasSnap) return "";
  const docSnap = fichasSnap.docs.find((d) => d.id === p);
  if (!docSnap) return "";
  return extraerFechaNacimiento(docSnap.data() as Record<string, unknown>);
}

/** Copia fechas encontradas en cualquier colección al registro que le falta. */
export async function sincronizarFechasNacimientoClub(): Promise<ResultadoSincronizacionFechas> {
  const indice = await construirIndiceDesdeFirebase();
  const fichasSnap = await getDocs(collection(db, "fichasMedicas")).catch(() => null);
  const detalle: string[] = [];
  let actualizados = 0;

  const consejerosSnap = await getDocs(collection(db, "consejeros"));
  for (const d of consejerosSnap.docs) {
    const data = d.data() as Record<string, unknown>;
    const titular = String(data.nombre ?? "").trim();
    const asoc = String(data.consejeroAsociado ?? "").trim();
    const pin = String(data.pin ?? "").trim();
    const patch: Record<string, string> = {};

    if (titular && !extraerFechaNacimientoTitular(data)) {
      const fecha = indice.buscar(titular) || buscarFechaPorPin(pin, fichasSnap);
      if (fecha) patch.nacimiento = fecha;
    }

    if (asoc && !extraerFechaNacimientoAsociado(data)) {
      const fecha = indice.buscar(asoc);
      if (fecha) patch.asociadoNacimiento = fecha;
    }

    if (Object.keys(patch).length > 0) {
      await updateDoc(doc(db, "consejeros", d.id), patch);
      actualizados++;
      if (patch.nacimiento) {
        detalle.push(`${titular} (consejero): ${patch.nacimiento}`);
      }
      if (patch.asociadoNacimiento) {
        detalle.push(`${asoc} (asociado de ${titular}): ${patch.asociadoNacimiento}`);
      }
    }
  }

  const directivaSnap = await getDocs(collection(db, "directivaClub"));
  for (const d of directivaSnap.docs) {
    const data = d.data() as Record<string, unknown>;
    const nombre = String(data.nombre ?? "").trim();
    if (!nombre || extraerFechaNacimiento(data)) continue;

    const pin = String(data.pin ?? "").trim();
    const fecha = indice.buscar(nombre) || buscarFechaPorPin(pin, fichasSnap);
    if (!fecha) continue;

    await updateDoc(doc(db, "directivaClub", d.id), { nacimiento: fecha });
    actualizados++;
    detalle.push(`${nombre} (directiva): ${fecha}`);
  }

  const conquisSnap = await getDocs(collection(db, "RegistroConquis"));
  for (const d of conquisSnap.docs) {
    const data = d.data() as Record<string, unknown>;
    const nombre = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
    if (!nombre || extraerFechaNacimiento(data)) continue;

    const fecha = indice.buscar(nombre);
    if (!fecha) continue;

    await updateDoc(doc(db, "RegistroConquis", d.id), { fechaNacimiento: fecha });
    actualizados++;
    detalle.push(`${nombre} (conquistador): ${fecha}`);
  }

  return { actualizados, detalle };
}

/** Construye índice en memoria a partir de datos ya cargados en pantalla. */
export function indiceDesdeRegistros(
  registros: {
    nombre: string;
    fecha: string;
    coleccion: string;
    docId: string;
  }[]
): IndiceFechasNacimiento {
  const indice = new IndiceFechasNacimiento();
  for (const r of registros) {
    indice.agregar(r.nombre, r.fecha, r.coleccion, r.docId);
  }
  return indice;
}

export { construirIndiceDesdeFirebase };
