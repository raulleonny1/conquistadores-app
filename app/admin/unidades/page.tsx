"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db } from "@/src/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { logInfo } from "@/src/lib/logger";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Flag,
  Layers,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGO_CONQUISTADORES } from "@/src/constants/programLogos";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";
import { rutaConClub } from "@/src/lib/rutasClub";

type UnidadDoc = {
  id: string;
  nombre: string;
  banderin?: string;
};

export default function UnidadesPage() {
  const router = useRouter();
  const { clubId, clubSlug, clubNombre, listo } = useClubActivo();

  const [form, setForm] = useState({ nombre: "", banderin: "" });
  const [unidades, setUnidades] = useState<UnidadDoc[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20";
  const labelClass = "text-sm font-semibold text-white/80";

  const cargarUnidades = async () => {
    const q = queryColeccionClub("unidades", clubId);
    if (!q) return;
    const snapshot = await getDocs(q);
    const lista = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<UnidadDoc, "id">),
    }));
    setUnidades(lista);
    setCargando(false);
  };

  useEffect(() => {
    if (clubId) cargarUnidades();
  }, [clubId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ nombre: "", banderin: "" });
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nombre = form.nombre.trim();
    if (!nombre) return;

    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }

    setGuardando(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "unidades", editId), { ...form, nombre });
        logInfo("Unidad actualizada: " + editId);
        toast.success("Unidad actualizada.");
        setEditId(null);
      } else {
        const docRef = await addDoc(
          collection(db, "unidades"),
          datosConClub({ ...form, nombre }, clubId)
        );
        logInfo("Unidad registrada: " + docRef.id);
        toast.success("Unidad registrada.");
      }
      setForm({ nombre: "", banderin: "" });
      await cargarUnidades();
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = (unidad: UnidadDoc) => {
    setForm({
      nombre: unidad.nombre,
      banderin: unidad.banderin ?? "",
    });
    setEditId(unidad.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const confirmar = confirm("¿Eliminar esta unidad?");
    if (!confirmar) return;

    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }

    try {
      await deleteDoc(doc(db, "unidades", id));
      logInfo("Unidad eliminada: " + id);
      toast.success("Unidad eliminada.");
      setUnidades(unidades.filter((u) => u.id !== id));
      if (editId === id) resetForm();
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
    }
  };

  if (!listo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07060f] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-cyan-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-fuchsia-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() => router.push(rutaConClub("/admin/registros", clubSlug))}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Registros
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 sm:flex">
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
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              <Sparkles className="h-4 w-4" />
              Organización del club
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              <span className="bg-linear-to-r from-cyan-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                Unidades
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-white/50">
              Crea y administra las unidades de tu club. Usa nombres simples como «Gacelas» o
              «Tigres».
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/70">
                <Layers className="mr-1.5 inline h-3.5 w-3.5" />
                {unidades.length} unidades
              </span>
            </div>
          </div>

          <div className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-400/25 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20">
                {editId ? (
                  <Pencil className="h-6 w-6 text-white" />
                ) : (
                  <Plus className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {editId ? "Editar unidad" : "Registrar unidad"}
                </h2>
                <p className="text-sm text-white/50">
                  {editId
                    ? "Modifica el nombre o banderín y guarda los cambios."
                    : "Agrega una nueva unidad al catálogo del club."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="nombre" className={labelClass}>
                  Nombre de la unidad
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Gacelas, Tigres, Leones…"
                  className={`${inputClass} mt-2`}
                  required
                />
              </div>

              <div>
                <label htmlFor="banderin" className={labelClass}>
                  Banderín
                </label>
                <input
                  id="banderin"
                  name="banderin"
                  value={form.banderin}
                  onChange={handleChange}
                  placeholder="URL de imagen o descripción del banderín"
                  className={`${inputClass} mt-2`}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={guardando}
                  className="rounded-2xl bg-linear-to-r from-cyan-500 to-fuchsia-600 px-8 py-2.5 font-bold shadow-lg shadow-cyan-500/20 hover:opacity-90"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : editId ? (
                    "Actualizar unidad"
                  ) : (
                    "Guardar unidad"
                  )}
                </Button>
                {editId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="rounded-2xl border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    Cancelar edición
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="border-b border-white/10 px-6 py-5 sm:px-8">
              <h3 className="text-lg font-black text-white">Unidades registradas</h3>
              <p className="mt-1 text-sm text-white/45">
                Listado del catálogo de unidades de tu club.
              </p>
            </div>

            {cargando ? (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-white/50">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Cargando unidades…
              </div>
            ) : unidades.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Layers className="h-8 w-8 text-white/30" />
                </div>
                <p className="font-semibold text-white/60">No hay unidades registradas</p>
                <p className="mt-1 text-sm text-white/40">
                  Usa el formulario de arriba para crear la primera.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {unidades.map((unidad) => (
                  <li
                    key={unidad.id}
                    className={`flex flex-col gap-4 px-6 py-5 transition sm:flex-row sm:items-center sm:justify-between sm:px-8 ${
                      editId === unidad.id ? "bg-cyan-500/10" : "hover:bg-white/3"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/20 to-fuchsia-500/20 ring-1 ring-white/10">
                        <Flag className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{unidad.nombre}</p>
                        <p className="mt-0.5 text-sm text-white/45">
                          Banderín:{" "}
                          <span className="text-white/65">
                            {unidad.banderin?.trim() || "Sin definir"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(unidad)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(unidad.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
