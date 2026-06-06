"use client";

import React, { useState, useEffect, useRef } from "react";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  MessageCircle,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { LOGO_CONQUISTADORES } from "@/src/constants/programLogos";
import { generarPinUnicoClub } from "@/src/lib/pinUnico";
import { rutaConClub } from "@/src/lib/rutasClub";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";

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
  const router = useRouter();
  const { clubId, clubSlug, clubNombre } = useClubActivo();

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20";
  const labelClass = "text-sm font-semibold text-white/80";
  const [form, setForm] = useState(formInicial);
  const [fichaArchivo, setFichaArchivo] = useState<File | null>(null);
  const [fichaMedicaUrl, setFichaMedicaUrl] = useState("");
  const [fichaMedicaNombre, setFichaMedicaNombre] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspirantes, setAspirantes] = useState<AspiranteDoc[]>([]);
  const editarDesdeUrlAplicado = useRef(false);


  useEffect(() => {
    const q = queryColeccionClub("aspirantesGuiaMayor", clubId);
    if (!q) return;
    const unsub = onSnapshot(q, (snap) => {
      setAspirantes(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AspiranteDoc, "id">),
        }))
      );
    });
    return () => unsub();
  }, [clubId]);

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

    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }

    setLoading(true);
    try {
      const docId = editId ?? (await generarPinUnicoClub());

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
        await setDoc(doc(db, "aspirantesGuiaMayor", docId), datosConClub({
          ...payload,
          pin: docId,
          fechaRegistro: formatFechaDDMMYYYY(new Date()),
        }, clubId!));
        await setDoc(doc(db, "tarjetaGuiaMayor", docId), datosConClub({
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
        }, clubId!));
        toast.success(`Aspirante registrado. PIN: ${docId}`);
      }
      resetForm();
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
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
    setTimeout(() => {
      document.getElementById("campo-nacimiento")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  useEffect(() => {
    if (editarDesdeUrlAplicado.current || aspirantes.length === 0) return;
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("editar")
        : null;
    if (!id) return;
    const a = aspirantes.find((x) => x.id === id);
    if (a) {
      editarDesdeUrlAplicado.current = true;
      handleEdit(a);
    }
  }, [aspirantes]);

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
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    try {
      await deleteDoc(doc(db, "aspirantesGuiaMayor", id));
      toast.success("Aspirante eliminado.");
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-amber-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-orange-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-yellow-600/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07060f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() => router.push(rutaConClub("/admin/registros", clubSlug))}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Registros
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 sm:flex">
              <Image
                src={LOGO_CONQUISTADORES}
                alt=""
                width={22}
                height={22}
                className="h-5 w-5 object-contain"
                unoptimized
              />
              <span className="text-xs font-bold text-white/80">
                {clubNombre || clubSlug || "Club"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center sm:text-left">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
              <Sparkles className="h-4 w-4" />
              Camino a Guía Mayor
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              <span className="bg-linear-to-r from-amber-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Aspirante a Guía Mayor
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-white/50">
              Los datos se guardan en Firebase para consultas futuras.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/70">
                <Users className="mr-1.5 inline h-3.5 w-3.5" />
                {aspirantes.length} aspirantes
              </span>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-200">
                <Star className="mr-1.5 inline h-3.5 w-3.5" />
                {CARGO_ASPIRANTE}
              </span>
            </div>
          </div>

          <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-amber-400/30 bg-white/4 p-6 shadow-2xl shadow-amber-500/10 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-linear-to-br from-amber-500 via-orange-500 to-yellow-500 opacity-20 blur-3xl" />
            <div className="relative mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Star className="h-10 w-10 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-black">
                  {editId ? "Editar aspirante" : "Registrar aspirante"}
                </h2>
                <p className="text-sm text-white/50">
                  {editId ? "Actualiza los datos y guarda los cambios." : "Completa el formulario para generar PIN."}
                </p>
              </div>
            </div>

            <form
              className="relative grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className={labelClass}>Nombre</label>
                <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className={inputClass} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="apellido" className={labelClass}>Apellido</label>
                <input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className={inputClass} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nacimiento" className={labelClass}>Fecha de nacimiento</label>
                <input id="campo-nacimiento" name="nacimiento" type="date" value={form.nacimiento} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edad" className={labelClass}>Edad</label>
                <input id="edad" name="edad" type="number" value={form.edad} readOnly className={`${inputClass} bg-white/10 opacity-80`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="genero" className={labelClass}>Género</label>
                <select id="genero" name="genero" value={form.genero} onChange={handleChange} className={inputClass} required>
                  <option value="" className="bg-slate-900">Selecciona género</option>
                  <option value="Hombre" className="bg-slate-900">Hombre</option>
                  <option value="Mujer" className="bg-slate-900">Mujer</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cargo" className={labelClass}>Cargo</label>
                <select id="cargo" name="cargo" value={form.cargo} disabled className={`${inputClass} bg-white/10 opacity-80`}>
                  <option value={CARGO_ASPIRANTE} className="bg-slate-900">{CARGO_ASPIRANTE}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="telefono" className={labelClass}>WhatsApp</label>
                <input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} placeholder="WhatsApp (ej. 0991234567 o +593991234567)" className={inputClass} />
                <p className="text-xs text-white/45">
                  Opcional al registrar; puedes agregarlo después en Editar para enviar el PIN y datos del aspirante.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="asociacion" className={labelClass}>Asociación / Misión</label>
                <select id="asociacion" name="asociacion" value={form.asociacion} onChange={handleChange} className={inputClass} required>
                  <option value="" className="bg-slate-900">Selecciona asociación / misión</option>
                  {ASOCIACIONES_MISION.map((a) => (
                    <option key={a} value={a} className="bg-slate-900">{a}</option>
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

              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-yellow-500 font-bold text-white hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : editId ? (
                    "Actualizar Aspirante"
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Guardar Aspirante
                    </>
                  )}
                </Button>
                {editId && whatsappUrlFromForm() && (
                  <a
                    href={whatsappUrlFromForm()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {editId && (
                  <Button type="button" variant="outline" onClick={resetForm} className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10">
                    Cancelar edición
                  </Button>
                )}
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/4 p-6 sm:p-8">
            <h3 className="mb-6 text-xl font-black">Aspirantes registrados</h3>
            {aspirantes.length === 0 ? (
              <p className="text-sm text-white/50">No hay aspirantes registrados.</p>
            ) : (
              <ul className="space-y-4">
                {aspirantes.map((a) => {
                  const nombre = nombreCompletoAspirante(a);
                  const numero = numeroWhatsappAspirante(a);
                  const waUrl = whatsappUrlFromAspirante(a);
                  return (
                    <li
                      key={a.id}
                      className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5 transition hover:border-amber-400/35 hover:bg-amber-500/8"
                    >
                      <div>
                        <span className="text-lg font-bold text-white">{nombre}</span>
                        <div className="mt-2 space-y-1 text-xs text-white/55">
                          <p>Edad: {a.edad || "—"} · Género: {a.genero || "—"}</p>
                          <p>Asociación: {a.asociacion || "—"} · Cargo: {a.cargo || CARGO_ASPIRANTE}</p>
                          <p>
                            WhatsApp:{" "}
                            {numero ? (
                              <span className="text-white/80">{numero}</span>
                            ) : (
                              <span className="text-amber-400/90">Sin número — usa Editar para agregarlo</span>
                            )}
                          </p>
                          {a.fichaMedicaUrl && (
                            <p>
                              <a
                                href={a.fichaMedicaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-amber-300 underline hover:text-amber-200"
                              >
                                Ver ficha médica
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 font-mono text-sm font-bold text-amber-200">
                          PIN: {a.pin}
                        </span>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEdit(a)}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                            title="Edita el registro y agrega WhatsApp"
                          >
                            Agregar WhatsApp
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(a)}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-500/90 px-3 py-2 text-sm font-bold text-white hover:bg-amber-500"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-red-600/90 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
