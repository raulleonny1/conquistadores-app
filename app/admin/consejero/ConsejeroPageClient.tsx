"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { db } from "@/src/firebase";
import { collection, addDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { handleError } from "@/src/lib/errorHandler";
import { generarPinUnicoClub } from "@/src/lib/pinUnico";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";
import { rutaConClub } from "@/src/lib/rutasClub";
import { LOGO_CONQUISTADORES } from "@/src/constants/programLogos";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 [color-scheme:dark]";
const labelClass = "text-sm font-semibold text-white/80";

type ConsejeroPageClientProps = {
  initialUnidadesRegistradas?: string[];
};

export default function ConsejeroPage({ initialUnidadesRegistradas }: ConsejeroPageClientProps) {
  const router = useRouter();
  const { clubId, clubSlug, clubNombre, listo } = useClubActivo();
  const [editarDocIdDesdeUrl, setEditarDocIdDesdeUrl] = useState<string | null>(null);
  const [editarAsociadoDesdeUrl, setEditarAsociadoDesdeUrl] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    nacimiento: "",
    unidades: [] as string[],
    consejeroAsociado: "",
    asociadoNacimiento: "",
  });
  const [unidadesRegistradas, setUnidadesRegistradas] = useState<string[]>(
    initialUnidadesRegistradas ?? []
  );
  const [guardando, setGuardando] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditarDocIdDesdeUrl(params.get("editar"));
    setEditarAsociadoDesdeUrl(params.get("asociado") === "1");
  }, []);

  useEffect(() => {
    if (initialUnidadesRegistradas || !clubId) return;
    import("firebase/firestore").then(({ getDocs }) => {
      const q = queryColeccionClub("unidades", clubId);
      if (!q) return;
      getDocs(q).then((snapshot) => {
        setUnidadesRegistradas(snapshot.docs.map((d) => d.data().nombre));
      });
    });
  }, [initialUnidadesRegistradas, clubId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUnidadToggle = (unidad: string) => {
    setForm((prev) => {
      const exists = prev.unidades.includes(unidad);
      return {
        ...prev,
        unidades: exists
          ? prev.unidades.filter((u) => u !== unidad)
          : [...prev.unidades, unidad],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    setGuardando(true);
    try {
      const pin = await generarPinUnicoClub();
      await addDoc(
        collection(db, "consejeros"),
        datosConClub(
          {
            nombre: form.nombre.trim(),
            nacimiento: form.nacimiento.trim(),
            unidades: form.unidades,
            consejeroAsociado: form.consejeroAsociado.trim(),
            asociadoNacimiento: form.asociadoNacimiento.trim(),
            pin,
            puedeCalificar: false,
          },
          clubId
        )
      );
      toast.success(`Consejero registrado. PIN de acceso: ${pin}`);
      setForm({
        nombre: "",
        nacimiento: "",
        unidades: [],
        consejeroAsociado: "",
        asociadoNacimiento: "",
      });
      setRefresh((r) => r + 1);
    } catch (error) {
      toast.error(mensajeErrorFirestore(error));
      handleError(error, "Error al registrar en Firebase");
    } finally {
      setGuardando(false);
    }
  };

  if (!listo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07060f] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-teal-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-green-600/10 blur-[100px]" />
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
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 sm:flex">
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
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Liderazgo del club
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              <span className="bg-linear-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                Consejeros
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-white/50">
              Registra consejeros, asigna unidades y controla quién puede calificar puntos.
            </p>
          </div>

          <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-emerald-400/30 bg-white/4 p-6 shadow-2xl shadow-emerald-500/10 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-linear-to-br from-emerald-500 via-teal-500 to-green-500 opacity-20 blur-3xl" />
            <div className="relative mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Plus className="h-10 w-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black">Registrar consejero</h2>
                <p className="text-sm text-white/50">
                  El PIN de 4 dígitos se genera automáticamente al guardar.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className={labelClass}>
                  Nombre del consejero
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="campo-nacimiento" className={labelClass}>
                  Fecha de nacimiento
                </label>
                <input
                  id="campo-nacimiento"
                  name="nacimiento"
                  type="date"
                  value={form.nacimiento}
                  onChange={handleChange}
                  className={inputClass}
                  title="Fecha de nacimiento del consejero"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="consejeroAsociado" className={labelClass}>
                  Consejero asociado
                </label>
                <input
                  id="consejeroAsociado"
                  name="consejeroAsociado"
                  value={form.consejeroAsociado}
                  onChange={handleChange}
                  placeholder="Nombre del asociado (opcional)"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="campo-nacimiento-asociado" className={labelClass}>
                  Nacimiento del asociado
                </label>
                <input
                  id="campo-nacimiento-asociado"
                  name="asociadoNacimiento"
                  type="date"
                  value={form.asociadoNacimiento}
                  onChange={handleChange}
                  className={inputClass}
                  title="Fecha de nacimiento del consejero asociado"
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Unidades que puede asesorar</label>
                {unidadesRegistradas.length === 0 ? (
                  <p className="mt-2 text-sm text-white/45">
                    No hay unidades registradas.{" "}
                    <button
                      type="button"
                      onClick={() => router.push(rutaConClub("/admin/unidades", clubSlug))}
                      className="font-semibold text-emerald-300 underline hover:text-emerald-200"
                    >
                      Crear unidades primero
                    </button>
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unidadesRegistradas.map((unidad) => (
                      <UnidadPill
                        key={unidad}
                        nombre={unidad}
                        checked={form.unidades.includes(unidad)}
                        onToggle={() => handleUnidadToggle(unidad)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button
                  type="submit"
                  disabled={guardando}
                  className="rounded-2xl bg-linear-to-r from-emerald-500 via-teal-500 to-green-500 font-bold text-white hover:opacity-90"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Guardar consejero
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/4 p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25">
                <Users className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xl font-black">Consejeros registrados</h3>
                <p className="text-sm text-white/45">Edita, elimina o autoriza calificaciones.</p>
              </div>
            </div>
            <ConsejerosList
              refresh={refresh}
              unidadesRegistradas={unidadesRegistradas}
              editarDocIdDesdeUrl={editarDocIdDesdeUrl}
              editarAsociadoDesdeUrl={editarAsociadoDesdeUrl}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function UnidadPill({
  nombre,
  checked,
  onToggle,
}: {
  nombre: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        checked
          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
          : "border-white/10 bg-white/5 text-white/60 hover:border-emerald-400/30 hover:bg-emerald-500/10"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="sr-only"
      />
      {checked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
      {nombre}
    </label>
  );
}

type Consejero = {
  id?: string;
  nombre: string;
  nacimiento?: string;
  unidades: string[];
  consejeroAsociado?: string;
  asociadoNacimiento?: string;
  pin?: string;
  puedeCalificar?: boolean;
};

function ConsejerosList({
  refresh,
  unidadesRegistradas,
  editarDocIdDesdeUrl,
  editarAsociadoDesdeUrl,
}: {
  refresh: number;
  unidadesRegistradas: string[];
  editarDocIdDesdeUrl?: string | null;
  editarAsociadoDesdeUrl?: boolean;
}) {
  const { clubId } = useClubActivo();
  const [consejeros, setConsejeros] = useState<Consejero[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const editarDesdeUrlAplicado = React.useRef(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    nacimiento: "",
    unidades: [] as string[],
    consejeroAsociado: "",
    asociadoNacimiento: "",
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    const fetchConsejeros = async () => {
      if (!clubId) return;
      setLoading(true);
      setLoadError(null);
      try {
        const q = queryColeccionClub("consejeros", clubId);
        if (!q) return;
        const querySnapshot = await getDocs(q);
        const lista: Consejero[] = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<Consejero, "id">;
          return {
            id: docSnap.id,
            ...data,
            pin: String(data.pin ?? "").trim(),
            unidades: Array.isArray(data.unidades) ? data.unidades : [],
          };
        });
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        setConsejeros(lista);
      } catch (error) {
        handleError(error, "Error al cargar consejeros");
        setLoadError("No se pudieron cargar los consejeros. Recarga la página.");
        setConsejeros([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConsejeros();
  }, [refresh, clubId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este consejero?")) return;
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    try {
      await import("firebase/firestore").then(({ doc, deleteDoc }) =>
        deleteDoc(doc(db, "consejeros", id))
      );
      setConsejeros(consejeros.filter((c) => c.id !== id));
      toast.success("Consejero eliminado");
    } catch (error) {
      toast.error(mensajeErrorFirestore(error));
      handleError(error, "Error al eliminar");
    }
  };

  const handleEdit = (c: Consejero) => {
    setEditId(c.id || null);
    setEditForm({
      nombre: c.nombre,
      nacimiento: c.nacimiento || "",
      unidades: c.unidades,
      consejeroAsociado: c.consejeroAsociado || "",
      asociadoNacimiento: c.asociadoNacimiento || "",
    });
    setTimeout(() => {
      document.getElementById("campo-nacimiento")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  useEffect(() => {
    if (editarDesdeUrlAplicado.current || !editarDocIdDesdeUrl || consejeros.length === 0) return;
    const c = consejeros.find((x) => x.id === editarDocIdDesdeUrl);
    if (c) {
      editarDesdeUrlAplicado.current = true;
      handleEdit(c);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        const campoId = editarAsociadoDesdeUrl ? "campo-nacimiento-asociado" : "campo-nacimiento";
        document.getElementById(campoId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [editarDocIdDesdeUrl, editarAsociadoDesdeUrl, consejeros]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditUnidadToggle = (unidad: string) => {
    setEditForm((prev) => {
      const exists = prev.unidades.includes(unidad);
      return {
        ...prev,
        unidades: exists
          ? prev.unidades.filter((u) => u !== unidad)
          : [...prev.unidades, unidad],
      };
    });
  };

  const togglePuedeCalificar = async (c: Consejero) => {
    if (!c.id) return;
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    const activar = c.puedeCalificar !== true;
    try {
      await updateDoc(doc(db, "consejeros", c.id), { puedeCalificar: activar });
      setConsejeros((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, puedeCalificar: activar } : x))
      );
      toast.success(
        activar
          ? `${c.nombre} puede calificar conquistadores y aspirantes.`
          : `Calificación desactivada para ${c.nombre}. Solo admin asigna puntos.`
      );
    } catch (error) {
      toast.error(mensajeErrorFirestore(error));
      handleError(error, "No se pudo actualizar el permiso de calificar");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    setGuardandoEdicion(true);
    try {
      await updateDoc(doc(db, "consejeros", editId), {
        nombre: editForm.nombre.trim(),
        nacimiento: editForm.nacimiento.trim(),
        unidades: editForm.unidades,
        consejeroAsociado: editForm.consejeroAsociado.trim(),
        asociadoNacimiento: editForm.asociadoNacimiento.trim(),
      });
      setEditId(null);
      setEditForm({
        nombre: "",
        nacimiento: "",
        unidades: [],
        consejeroAsociado: "",
        asociadoNacimiento: "",
      });
      setConsejeros(
        consejeros.map((c) => (c.id === editId ? { ...c, ...editForm, pin: c.pin } : c))
      );
      toast.success("Consejero actualizado.");
    } catch (error) {
      toast.error(mensajeErrorFirestore(error));
      handleError(error, "Error al editar");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-white/50">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        Cargando consejeros…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {loadError}
      </div>
    );
  }

  if (consejeros.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <Shield className="h-8 w-8 text-white/30" />
        </div>
        <p className="font-semibold text-white/60">No hay consejeros registrados</p>
        <p className="mt-1 text-sm text-white/40">Usa el formulario de arriba para agregar el primero.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {consejeros.map((c) => (
        <li
          key={c.id}
          className={`rounded-2xl border p-5 transition ${
            editId === c.id
              ? "border-emerald-400/40 bg-emerald-500/10"
              : "border-emerald-400/20 bg-emerald-500/5 hover:border-emerald-400/35 hover:bg-emerald-500/8"
          }`}
        >
          {editId === c.id ? (
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Nombre</label>
                <input
                  name="nombre"
                  value={editForm.nombre}
                  onChange={handleEditChange}
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Nacimiento</label>
                <input
                  id="campo-nacimiento"
                  name="nacimiento"
                  type="date"
                  value={editForm.nacimiento}
                  onChange={handleEditChange}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Consejero asociado</label>
                <input
                  name="consejeroAsociado"
                  value={editForm.consejeroAsociado}
                  onChange={handleEditChange}
                  placeholder="Consejero asociado"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Nacimiento asociado</label>
                <input
                  id="campo-nacimiento-asociado"
                  name="asociadoNacimiento"
                  type="date"
                  value={editForm.asociadoNacimiento}
                  onChange={handleEditChange}
                  className={inputClass}
                  title="Nacimiento del asociado"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Unidades</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {unidadesRegistradas.map((unidad) => (
                    <UnidadPill
                      key={unidad}
                      nombre={unidad}
                      checked={editForm.unidades.includes(unidad)}
                      onToggle={() => handleEditUnidadToggle(unidad)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 font-bold"
                >
                  {guardandoEdicion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditId(null)}
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-white">{c.nombre}</p>
                  <div className="mt-2 space-y-1 text-xs text-white/55">
                    <p>
                      Unidades:{" "}
                      <span className="text-white/75">
                        {Array.isArray(c.unidades) && c.unidades.length > 0
                          ? c.unidades.join(", ")
                          : "Sin asignar"}
                      </span>
                    </p>
                    <p>
                      Asociado:{" "}
                      <span className="text-white/75">{c.consejeroAsociado || "Sin asignar"}</span>
                    </p>
                    {c.nacimiento && (
                      <p>
                        Nacimiento: <span className="text-white/75">{c.nacimiento}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 font-mono text-sm font-bold text-emerald-200">
                  PIN: {c.pin || "…"}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-sky-400/25 bg-sky-500/10 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-300">
                  Permiso para calificar
                </p>
                <p className="mb-3 text-xs text-white/50">
                  Puntos a conquistadores y aspirantes de sus unidades.
                </p>
                <button
                  type="button"
                  onClick={() => togglePuedeCalificar(c)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    c.puedeCalificar === true
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : "border border-sky-400/30 bg-white/5 text-sky-200 hover:bg-sky-500/15"
                  }`}
                >
                  {c.puedeCalificar === true
                    ? "Calificar: ACTIVADO — clic para desactivar"
                    : "Calificar: desactivado — clic para autorizar"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(c)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id!)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
