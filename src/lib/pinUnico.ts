import { db } from "@/src/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { toNumberPuntos } from "@/src/lib/categoriasPuntos";

/** PINs del sistema (login admin / evaluador / director fijo). No asignar a miembros al azar. */
export const PINS_RESERVADOS_SISTEMA = new Set(["1844", "*611", "1902"]);

const COLECCIONES_CON_PIN = [
  { id: "RegistroConquis", etiqueta: "Conquistador" },
  { id: "aspirantesGuiaMayor", etiqueta: "Aspirante" },
  { id: "consejeros", etiqueta: "Consejero" },
  { id: "directivaClub", etiqueta: "Directiva" },
] as const;

export type ColeccionPin = (typeof COLECCIONES_CON_PIN)[number]["id"];

export type ConflictoPin = {
  coleccion: string;
  etiqueta: string;
  docId: string;
  nombre: string;
};

export type ResultadoPinDisponible =
  | { ok: true }
  | { ok: false; mensaje: string; conflicto?: ConflictoPin };

export type ExcluirDocumento = {
  coleccion: ColeccionPin;
  docId: string;
};

function normalizarPin(pin: string): string {
  return String(pin ?? "").trim();
}

function nombreDesdeData(
  coleccion: ColeccionPin,
  data: Record<string, unknown>
): string {
  if (coleccion === "RegistroConquis") {
    return [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
  }
  return String(data.nombre ?? "").trim() || "Sin nombre";
}

/** Todos los PIN ya usados en el club (todas las colecciones + reservados del sistema). */
export async function cargarPinsOcupadosClub(): Promise<Set<string>> {
  const pins = new Set<string>(PINS_RESERVADOS_SISTEMA);

  for (const { id } of COLECCIONES_CON_PIN) {
    const snap = await getDocs(collection(db, id));
    for (const docSnap of snap.docs) {
      const pin = normalizarPin(String(docSnap.data().pin ?? ""));
      if (pin) pins.add(pin);
    }
  }

  return pins;
}

/** Genera un PIN de 4 dígitos que no esté en el set (ni reservados). */
export function crearPinEnSet(pinsOcupados: Set<string>): string {
  for (let intento = 0; intento < 100; intento++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (!pinsOcupados.has(pin) && !PINS_RESERVADOS_SISTEMA.has(pin)) {
      return pin;
    }
  }
  let pin = String(Date.now()).slice(-4);
  while (pinsOcupados.has(pin) || PINS_RESERVADOS_SISTEMA.has(pin)) {
    pin = String(Math.floor(1000 + Math.random() * 9000));
  }
  return pin;
}

/** Nuevo PIN libre en todo el club. */
export async function generarPinUnicoClub(): Promise<string> {
  const ocupados = await cargarPinsOcupadosClub();
  const pin = crearPinEnSet(ocupados);
  ocupados.add(pin);
  return pin;
}

/** Varios PIN únicos seguidos (p. ej. reset masivo en configuración). */
export async function generarPinsUnicosEnLote(
  cantidad: number,
  baseOcupados?: Set<string>
): Promise<string[]> {
  const ocupados = new Set(baseOcupados ?? (await cargarPinsOcupadosClub()));
  const lista: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const pin = crearPinEnSet(ocupados);
    ocupados.add(pin);
    lista.push(pin);
  }
  return lista;
}

/** Comprueba que el PIN no exista en otra persona (opcional: excluir un documento al editar). */
export async function validarPinDisponible(
  pin: string,
  excluir?: ExcluirDocumento[]
): Promise<ResultadoPinDisponible> {
  const p = normalizarPin(pin);
  if (!p) {
    return { ok: false, mensaje: "El PIN no puede estar vacío." };
  }
  if (!/^\d{4}$/.test(p) && p !== "*611") {
    return { ok: false, mensaje: "El PIN debe ser de 4 dígitos numéricos." };
  }
  if (PINS_RESERVADOS_SISTEMA.has(p) && !excluir?.length) {
    return {
      ok: false,
      mensaje: "Ese PIN está reservado para el sistema (admin o directiva).",
    };
  }

  const excluidos = excluir ?? [];

  for (const { id: coleccion, etiqueta } of COLECCIONES_CON_PIN) {
    const snap = await getDocs(
      query(collection(db, coleccion), where("pin", "==", p))
    );
    for (const docSnap of snap.docs) {
      const omitir = excluidos.some(
        (e) => e.coleccion === coleccion && e.docId === docSnap.id
      );
      if (omitir) continue;
      return {
        ok: false,
        mensaje: `El PIN ${p} ya lo usa ${nombreDesdeData(coleccion, docSnap.data() as Record<string, unknown>)} (${etiqueta}).`,
        conflicto: {
          coleccion,
          etiqueta,
          docId: docSnap.id,
          nombre: nombreDesdeData(coleccion, docSnap.data() as Record<string, unknown>),
        },
      };
    }
  }

  return { ok: true };
}

/** Lista duplicados actuales en Firebase (para revisión en admin). */
export async function detectarPinsDuplicados(): Promise<
  { pin: string; registros: ConflictoPin[] }[]
> {
  const porPin = new Map<string, ConflictoPin[]>();

  for (const { id: coleccion, etiqueta } of COLECCIONES_CON_PIN) {
    const snap = await getDocs(collection(db, coleccion));
    for (const docSnap of snap.docs) {
      const pin = normalizarPin(String(docSnap.data().pin ?? ""));
      if (!pin) continue;
      const entry: ConflictoPin = {
        coleccion,
        etiqueta,
        docId: docSnap.id,
        nombre: nombreDesdeData(coleccion, docSnap.data() as Record<string, unknown>),
      };
      if (!porPin.has(pin)) porPin.set(pin, []);
      porPin.get(pin)!.push(entry);
    }
  }

  return Array.from(porPin.entries())
    .filter(([, registros]) => registros.length > 1)
    .map(([pin, registros]) => ({ pin, registros }));
}

/** Mueve puntos del documento calificacionesConquis del PIN anterior al nuevo. */
export async function migrarCalificacionesAlNuevoPin(
  pinAnterior: string,
  pinNuevo: string,
  nombre: string
): Promise<void> {
  const viejo = normalizarPin(pinAnterior);
  const nuevo = normalizarPin(pinNuevo);
  if (!viejo || !nuevo || viejo === nuevo) return;

  const refViejo = doc(db, "calificacionesConquis", viejo);
  const refNuevo = doc(db, "calificacionesConquis", nuevo);
  const [snapViejo, snapNuevo] = await Promise.all([getDoc(refViejo), getDoc(refNuevo)]);

  if (!snapViejo.exists()) {
    await setDoc(
      refNuevo,
      { pin: nuevo, nombre, puntos: {}, etiquetasActividades: {} },
      { merge: true }
    );
  } else {
    const dataViejo = snapViejo.data();
    const puntosViejos = (dataViejo.puntos as Record<string, unknown>) || {};
    const etiquetasViejas =
      (dataViejo.etiquetasActividades as Record<string, string>) || {};
    const nombreFinal = nombre || String(dataViejo.nombre ?? "");

    if (snapNuevo.exists()) {
      const dataNuevo = snapNuevo.data();
      const puntosNuevos = (dataNuevo.puntos as Record<string, unknown>) || {};
      const etiquetasNuevas =
        (dataNuevo.etiquetasActividades as Record<string, string>) || {};
      const puntosFusionados = { ...puntosNuevos };
      for (const [k, v] of Object.entries(puntosViejos)) {
        puntosFusionados[k] = toNumberPuntos(puntosFusionados[k]) + toNumberPuntos(v);
      }
      await setDoc(
        refNuevo,
        {
          pin: nuevo,
          nombre: nombreFinal,
          puntos: puntosFusionados,
          etiquetasActividades: { ...etiquetasViejas, ...etiquetasNuevas },
        },
        { merge: true }
      );
    } else {
      await setDoc(refNuevo, {
        ...dataViejo,
        pin: nuevo,
        nombre: nombreFinal,
      });
    }

    try {
      await deleteDoc(refViejo);
    } catch {
      /* el doc nuevo ya tiene los puntos */
    }
  }

  await migrarHistorialSemanalAlNuevoPin(viejo, nuevo);
  await migrarFichaMedicaAlNuevoPin(viejo, nuevo);
}

/** Historial semanal: actualiza el campo pin en cada evento del PIN anterior. */
async function migrarHistorialSemanalAlNuevoPin(
  pinAnterior: string,
  pinNuevo: string
): Promise<void> {
  const snap = await getDocs(
    query(collection(db, "calificacionesSemanal"), where("pin", "==", pinAnterior))
  );
  if (snap.empty) return;

  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, "calificacionesSemanal", d.id), { pin: pinNuevo })
    )
  );
}

/** Ficha médica guardada bajo el PIN de acceso. */
async function migrarFichaMedicaAlNuevoPin(
  pinAnterior: string,
  pinNuevo: string
): Promise<void> {
  const refViejo = doc(db, "fichasMedicas", pinAnterior);
  const refNuevo = doc(db, "fichasMedicas", pinNuevo);
  const snapViejo = await getDoc(refViejo);
  if (!snapViejo.exists()) return;

  const snapNuevo = await getDoc(refNuevo);
  if (snapNuevo.exists()) {
    await setDoc(refNuevo, { ...snapViejo.data(), ...snapNuevo.data() }, { merge: true });
  } else {
    await setDoc(refNuevo, snapViejo.data());
  }

  try {
    await deleteDoc(refViejo);
  } catch {
    /* ficha ya copiada */
  }
}

/**
 * Único punto de cambio de PIN con migración de datos (puntos, historial, ficha médica).
 * Usar desde Admin → Configuración; no cambiar el PIN con updateDoc en otros formularios.
 */
export async function cambiarPinConMigracion(opts: {
  coleccion: ColeccionPin;
  docId: string;
  nombre: string;
  pinFijo?: string;
}): Promise<{ pinAnterior: string; pinNuevo: string }> {
  return resetearPinPersona(opts);
}

/**
 * Asigna un PIN único a una persona, actualiza Firebase y migra puntos + historial.
 * @see cambiarPinConMigracion — usar siempre este flujo para cambiar PIN.
 */
export async function resetearPinPersona(opts: {
  coleccion: ColeccionPin;
  docId: string;
  nombre: string;
  pinFijo?: string;
}): Promise<{ pinAnterior: string; pinNuevo: string }> {
  const ref = doc(db, opts.coleccion, opts.docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("No se encontró el registro.");
  }

  const data = snap.data() as Record<string, unknown>;
  const pinAnterior = normalizarPin(String(data.pin ?? ""));
  const nombre =
    opts.nombre ||
    nombreDesdeData(opts.coleccion, data);

  let pinNuevo: string;

  if (opts.pinFijo) {
    const val = await validarPinDisponible(opts.pinFijo, [
      { coleccion: opts.coleccion, docId: opts.docId },
    ]);
    if (!val.ok) throw new Error(val.mensaje);
    pinNuevo = opts.pinFijo;
  } else {
    const ocupados = await cargarPinsOcupadosClub();
    pinNuevo = crearPinEnSet(ocupados);
    while (pinNuevo === pinAnterior) {
      ocupados.add(pinNuevo);
      pinNuevo = crearPinEnSet(ocupados);
    }
  }

  await updateDoc(ref, { pin: pinNuevo });

  if (opts.coleccion === "aspirantesGuiaMayor" && opts.docId === pinAnterior && pinAnterior !== pinNuevo) {
    /* Registros antiguos con docId = PIN: el login por query sigue funcionando; puntos migrados abajo */
  }

  await migrarCalificacionesAlNuevoPin(pinAnterior || opts.docId, pinNuevo, nombre);

  return { pinAnterior, pinNuevo };
}

/** Deja el primer registro de cada PIN duplicado; los demás reciben PIN nuevo único. */
export async function corregirPinsDuplicadosEnClub(): Promise<{
  corregidos: number;
  mensajes: string[];
}> {
  const duplicados = await detectarPinsDuplicados();
  const ocupados = await cargarPinsOcupadosClub();
  const mensajes: string[] = [];
  let corregidos = 0;

  for (const { pin, registros } of duplicados) {
    for (let i = 1; i < registros.length; i++) {
      const r = registros[i];
      if (pin === "1902" && r.coleccion === "directivaClub") continue;

      const pinNuevo = crearPinEnSet(ocupados);
      ocupados.add(pinNuevo);

      await updateDoc(doc(db, r.coleccion, r.docId), { pin: pinNuevo });
      await migrarCalificacionesAlNuevoPin(pin, pinNuevo, r.nombre);

      mensajes.push(`${r.nombre} (${r.etiqueta}): ${pin} → ${pinNuevo}`);
      corregidos++;
    }
  }

  return { corregidos, mensajes };
}

/** Resetea todos los PIN de una colección (excepto Director/a con 1902). Migra puntos. */
export async function resetearPinsMasivoEnColeccion(
  coleccion: ColeccionPin
): Promise<{ total: number }> {
  const snap = await getDocs(collection(db, coleccion));
  const filas = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const cargo = String(data.cargo ?? "");
      if (coleccion === "directivaClub" && cargo === "Director/a") return null;
      return {
        docId: d.id,
        pinAnterior: normalizarPin(String(data.pin ?? "")),
        nombre: nombreDesdeData(coleccion, data),
      };
    })
    .filter(Boolean) as { docId: string; pinAnterior: string; nombre: string }[];

  const ocupados = await cargarPinsOcupadosClub();
  const pines = await generarPinsUnicosEnLote(filas.length, ocupados);

  for (let i = 0; i < filas.length; i++) {
    const { docId, pinAnterior, nombre } = filas[i];
    const pinNuevo = pines[i];
    await updateDoc(doc(db, coleccion, docId), { pin: pinNuevo });
    await migrarCalificacionesAlNuevoPin(pinAnterior || docId, pinNuevo, nombre);
  }

  return { total: filas.length };
}
