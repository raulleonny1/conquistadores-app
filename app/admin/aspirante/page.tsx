"use client";

import React, { useState, useEffect } from "react";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { tarjetaGuiaMayor } from "@/src/data/tarjetaGuiaMayor";
import { guardarFichaMedica } from "@/src/lib/guardarFichaMedica";
import {
  ASOCIACIONES_MISION,
  CARGO_ASPIRANTE,
  nombreCompletoAspirante,
} from "@/src/constants/aspirante";
import { buildWhatsappUrl, mensajePinAspirante } from "@/src/utils/whatsapp";
import FichaMedicaUpload from "@/src/components/forms/FichaMedicaUpload";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "react-hot-toast";

type AspiranteDoc = {
  id: string;
  nombre: string;
  apellido: string;
  edad: string;
  nacimiento: string;
  genero: string;
  asociacion: string;
  cargo: string;
  pin: string;
  telefono?: string;
  whatsapp?: string;
  fichaMedicaUrl?: string;
  fichaMedicaNombre?: string;
  fichaMedicaTipo?: string;
  fechaRegistro?: string;
};

const formInicial = {
  nombre: "",
  apellido: "",
  edad: "",
  nacimiento: "",
  genero: "",
  asociacion: ASOCIACIONES_MISION[0] as string,
  cargo: CARGO_ASPIRANTE,
  telefono: "",
};

function numeroWhatsappAspirante(a: Pick<AspiranteDoc, "telefono" | "whatsapp">): string {
  return (a.whatsapp || a.telefono || "").trim();
}

export default function AspirantePage() {
  const [form, setForm] = useState(formInicial);
  const [fichaArchivo, setFichaArchivo] = useState<File | null>(null);
  const [fichaMedicaUrl, setFichaMedicaUrl] = useState("");
  const [fichaMedicaNombre, setFichaMedicaNombre] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspirantes, setAspirantes] = useState<AspiranteDoc[]>([]);

  const generarPin = () => Math.floor(1000 + Math.random() * 9000).toString();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "aspirantesGuiaMayor"), (snap) => {
      setAspirantes(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AspiranteDoc, "id">),
        }))
      );
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm(formInicial);
    setFichaArchivo(null);
    setFichaMedicaUrl("");
    setFichaMedicaNombre("");
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === "nacimiento") {
      const nacimiento = e.target.value;
      let edad = "";
      if (nacimiento) {
        const birthDate = new Date(nacimiento);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          years--;
        }
        edad = years.toString();
      }
      setForm({ ...form, nacimiento, edad });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      toast.error("Nombre y apellido son obligatorios.");
      return false;
    }
    if (!form.nacimiento || !form.edad) {
      toast.error("Fecha de nacimiento y edad son obligatorias.");
      return false;
    }
    if (!form.genero) {
      toast.error("Selecciona el género.");
      return false;
    }
    if (!form.asociacion) {
      toast.error("Selecciona la asociación / misión.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const docId = editId ?? generarPin();

      const telefono = form.telefono.trim();

      const payload: Record<string, string> = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        edad: form.edad,
        nacimiento: form.nacimiento,
        genero: form.genero,
        asociacion: form.asociacion,
        cargo: CARGO_ASPIRANTE,
        telefono,
        whatsapp: telefono,
      };

      if (fichaArchivo) {
        Object.assign(payload, await guardarFichaMedica(fichaArchivo, docId));
      } else if (fichaMedicaUrl.trim()) {
        Object.assign(payload, {
          fichaMedicaUrl,
          fichaMedicaNombre,
          fichaMedicaTipo: "",
        });
      }

      if (editId) {
        await updateDoc(doc(db, "aspirantesGuiaMayor", editId), payload);
        toast.success("Aspirante actualizado.");
      } else {
        await setDoc(doc(db, "aspirantesGuiaMayor", docId), {
          ...payload,
          pin: docId,
          fechaRegistro: formatFechaDDMMYYYY(new Date()),
        });
        await setDoc(doc(db, "tarjetaGuiaMayor", docId), {
          aspiranteId: docId,
          aspiranteNombre: nombreCompletoAspirante(form),
          fechaInicio: new Date().toLocaleDateString(),
          actividades: tarjetaGuiaMayor.flatMap((grupo) =>
            grupo.actividades.map((act) => ({
              nombre: act,
              completado: false,
              evaluador: "",
              fecha: "",
              hora: "",
              firma: "",
            }))
          ),
        });
        toast.success(`Aspirante registrado. PIN: ${docId}`);
      }
      resetForm();
    } catch {
      toast.error("Error al guardar en Firebase.");
    }
    setLoading(false);
  };

  const handleEdit = (a: AspiranteDoc) => {
    setForm({
      nombre: a.nombre || "",
      apellido: a.apellido || "",
      edad: a.edad || "",
      nacimiento: a.nacimiento || "",
      genero: a.genero || (a as { sexo?: string }).sexo || "",
      asociacion: a.asociacion || ASOCIACIONES_MISION[0],
      cargo: CARGO_ASPIRANTE,
      telefono: numeroWhatsappAspirante(a),
    });
    setFichaMedicaUrl(a.fichaMedicaUrl || "");
    setFichaMedicaNombre(a.fichaMedicaNombre || "");
    setFichaArchivo(null);
    setEditId(a.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const whatsappUrlFromForm = () => {
    const pin = editId ?? "";
    if (!form.telefono.trim() || !pin) return "";
    return buildWhatsappUrl(
      form.telefono,
      mensajePinAspirante({
        nombre: form.nombre,
        apellido: form.apellido,
        pin,
        asociacion: form.asociacion,
        cargo: form.cargo,
      })
    );
  };

  const whatsappUrlFromAspirante = (a: AspiranteDoc) => {
    const numero = numeroWhatsappAspirante(a);
    if (!numero || !a.pin) return "";
    return buildWhatsappUrl(
      numero,
      mensajePinAspirante({
        nombre: a.nombre,
        apellido: a.apellido,
        pin: a.pin,
        asociacion: a.asociacion,
        cargo: a.cargo,
      })
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este aspirante?")) return;
    await deleteDoc(doc(db, "aspirantesGuiaMayor", id));
    toast.success("Aspirante eliminado.");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto mt-10 px-4 pb-16">
        <div className="flex flex-wrap justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin/registros";
            }}
            className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-indigo-800 transition-all"
          >
            <ArrowLeft className="inline mr-2" />
            Retornar a Admin
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-red-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-800 transition-all"
          >
            Cerrar sesión
          </button>
        </div>

        <section className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-2 text-indigo-700">
            Registrar Aspirante a Guía Mayor
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Los datos se guardan en Firebase para consultas futuras.
          </p>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="nombre" className="text-sm font-semibold text-slate-700">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className="border border-slate-200 p-2 rounded-xl"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="apellido" className="text-sm font-semibold text-slate-700">
                Apellido
              </label>
              <input
                id="apellido"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="Apellido"
                className="border border-slate-200 p-2 rounded-xl"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="nacimiento" className="text-sm font-semibold text-slate-700">
                Fecha de nacimiento
              </label>
              <input
                id="nacimiento"
                name="nacimiento"
                type="date"
                value={form.nacimiento}
                onChange={handleChange}
                className="border border-slate-200 p-2 rounded-xl"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="edad" className="text-sm font-semibold text-slate-700">
                Edad
              </label>
              <input
                id="edad"
                name="edad"
                type="number"
                value={form.edad}
                readOnly
                className="border border-slate-200 p-2 rounded-xl bg-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="genero" className="text-sm font-semibold text-slate-700">
                Género
              </label>
              <select
                id="genero"
                name="genero"
                value={form.genero}
                onChange={handleChange}
                className="border border-slate-200 p-2 rounded-xl"
                required
              >
                <option value="">Selecciona género</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="cargo" className="text-sm font-semibold text-slate-700">
                Cargo
              </label>
              <select
                id="cargo"
                name="cargo"
                value={form.cargo}
                disabled
                className="border border-slate-200 p-2 rounded-xl bg-slate-100 text-slate-700"
              >
                <option value={CARGO_ASPIRANTE}>{CARGO_ASPIRANTE}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="telefono" className="text-sm font-semibold text-slate-700">
                WhatsApp
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                placeholder="WhatsApp (ej. 0991234567 o +593991234567)"
                className="border border-slate-200 p-2 rounded-xl"
              />
              <p className="text-xs text-slate-500">
                Opcional al registrar; puedes agregarlo después en Editar para enviar el PIN y datos
                del aspirante.
              </p>
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="asociacion" className="text-sm font-semibold text-slate-700">
                Asociación / Misión
              </label>
              <select
                id="asociacion"
                name="asociacion"
                value={form.asociacion}
                onChange={handleChange}
                className="border border-slate-200 p-2 rounded-xl"
                required
              >
                <option value="">Selecciona asociación / misión</option>
                {ASOCIACIONES_MISION.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <FichaMedicaUpload
              archivoSeleccionado={fichaArchivo}
              onArchivoChange={setFichaArchivo}
              urlActual={fichaMedicaUrl}
              nombreActual={fichaMedicaNombre}
              opcional
            />

            <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-900 transition-all disabled:opacity-60"
              >
                {loading ? "Guardando..." : editId ? "Actualizar Aspirante" : "Guardar Aspirante"}
              </button>
              {editId && whatsappUrlFromForm() && (
                <a
                  href={whatsappUrlFromForm()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-800 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar información por WhatsApp
                </a>
              )}
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-400 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-500"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          <div className="mt-10">
            <h3 className="font-bold mb-4 text-indigo-700">Aspirantes registrados</h3>
            {aspirantes.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay aspirantes registrados.</p>
            ) : (
              <ul className="space-y-3">
                {aspirantes.map((a) => {
                  const nombre = nombreCompletoAspirante(a);
                  const numero = numeroWhatsappAspirante(a);
                  const waUrl = whatsappUrlFromAspirante(a);
                  return (
                    <li
                      key={a.id}
                      className="bg-indigo-50 rounded-xl p-4 flex flex-col gap-3 border border-indigo-200"
                    >
                      <div>
                        <span className="font-bold text-indigo-800">{nombre}</span>
                        <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                          <p>Edad: {a.edad || "—"} · Género: {a.genero || "—"}</p>
                          <p>Asociación: {a.asociacion || "—"} · Cargo: {a.cargo || CARGO_ASPIRANTE}</p>
                          <p>
                            WhatsApp:{" "}
                            {numero ? (
                              <span className="text-slate-700">{numero}</span>
                            ) : (
                              <span className="text-amber-700">Sin número — usa Editar para agregarlo</span>
                            )}
                          </p>
                          {a.fichaMedicaUrl && (
                            <p>
                              <a
                                href={a.fichaMedicaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 underline"
                              >
                                Ver ficha médica
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-mono text-sm">
                          PIN: {a.pin}
                        </span>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-800"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Enviar por WhatsApp
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEdit(a)}
                            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-300"
                            title="Edita el registro y agrega WhatsApp"
                          >
                            Agregar WhatsApp
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(a)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-yellow-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
