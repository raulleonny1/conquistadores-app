"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDocs, doc, updateDoc, deleteDoc, addDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/src/firebase";
import { especialidadesBase } from "@/src/data/especialidades";
import { handleError } from "@/src/lib/errorHandler";
import { generarPinUnicoClub } from "@/src/lib/pinUnico";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LOGO_CONQUISTADORES } from "@/src/constants/programLogos";
import { rutaConClub } from "@/src/lib/rutasClub";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildWhatsappUrl, mensajePinConquistador } from "@/src/utils/whatsapp";
import {
  canonicalizarUnidad,
  consejeroAsesoraUnidad,
} from "@/src/lib/unidades";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

type EspecialidadObj = {
  area: string;
  categoria: string;
  especialidad: string;
};

type Unidad = { nombre: string; consejero: string };

type Consejero = { nombre: string; unidades: string[] };

type RegistroConquis = {
  id: string;
  nombre: string;
  apellido: string;
  edad: string;
  fechaNacimiento: string;
  whatsapp: string;
  unidad: string;
  consejero: string;
  clase: string;
  especialidadArea: string;
  especialidadCategoria: string;
  especialidad: string;
  especialidades: EspecialidadObj[];
  pin: string;
};

type RegistroConquisPageInnerProps = {
  unidades?: Unidad[];
  consejeros?: Consejero[];
};

export default function RegistroConquisPageInner({ unidades: initialUnidades, consejeros: initialConsejeros }: RegistroConquisPageInnerProps) {
  const router = useRouter();
  const { clubId, clubSlug, clubNombre } = useClubActivo();

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-red-400/50 focus:ring-2 focus:ring-red-400/20";
  const labelClass = "text-sm font-semibold text-white/80";
  const [conquis, setConquis] = useState<RegistroConquis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<RegistroConquis | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    fechaNacimiento: "",
    whatsapp: "",
    unidad: "",
    consejero: "",
    clase: "",
    especialidadArea: "",
    especialidadCategoria: "",
    especialidad: "",
    especialidades: [] as EspecialidadObj[],
    pin: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<Unidad[]>(initialUnidades ?? []);
  const [consejeros, setConsejeros] = useState<Consejero[]>(initialConsejeros ?? []);
  const [editId, setEditId] = useState<string | null>(null);
  const editarDesdeUrlAplicado = useRef(false);
  const clasesOficiales = [
    "Amigo",
    "Compañero",
    "Explorador",
    "Pionero",
    "Excursionista",
    "Guía"
  ];

  useEffect(() => {
    const q = queryColeccionClub("RegistroConquis", clubId);
    if (!q) {
      setConquis([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(q, (snapshot) => {
      const sortedConquis = snapshot.docs
        .map((doc) => {
          const data = doc.data() as Partial<RegistroConquis>;
          return {
            id: doc.id,
            apellido: data.apellido || "",
            clase: data.clase || "",
            consejero: data.consejero || "",
            edad: data.edad || "",
            especialidad: data.especialidad || "",
            especialidadArea: data.especialidadArea || "",
            especialidadCategoria: data.especialidadCategoria || "",
            especialidades: (data.especialidades as EspecialidadObj[]) || [],
            nombre: data.nombre || "",
            pin: data.pin || "",
            unidad: data.unidad || "",
            whatsapp: data.whatsapp || "",
            ...data,
          } as RegistroConquis;
        })
        .sort((a, b) => {
          const nombreA = (a.nombre || "").toLowerCase();
          const nombreB = (b.nombre || "").toLowerCase();
          if (nombreA < nombreB) return -1;
          if (nombreA > nombreB) return 1;
          return 0;
        });
      setConquis(sortedConquis);
      setLoading(false);
    });
    return () => unsub();
  }, [clubId]);
  useEffect(() => {
    if (!initialUnidades?.length) {
      const loadUnidades = async () => {
        try {
          const qU = queryColeccionClub("unidades", clubId);
          if (!qU) return;
          const unidadesSnapshot = await getDocs(qU);
          setUnidades(
            unidadesSnapshot.docs.map((docSnap) => {
              const data = docSnap.data() as Partial<Unidad>;
              return { nombre: data.nombre || "", consejero: data.consejero || "" };
            })
          );
        } catch (err) {
          handleError(err, "Error cargando unidades");
        }
      };
      loadUnidades();
    }
  }, [initialUnidades, clubId]);

  useEffect(() => {
    const qC = queryColeccionClub("consejeros", clubId);
    if (!qC) {
      setConsejeros([]);
      return;
    }
    const unsub = onSnapshot(qC, (snapshot) => {
      setConsejeros(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<Consejero>;
          return { nombre: data.nombre || "", unidades: data.unidades || [] };
        })
      );
    });
    return () => unsub();
  }, [clubId]);

  const catalogoUnidades = useMemo(
    () => unidades.map((u) => u.nombre).filter(Boolean),
    [unidades]
  );

  /** Consejeros de Firebase con unidades alineadas al catálogo oficial (`unidades`). */
  const consejerosDesdeRegistro = useMemo(
    () =>
      consejeros.map((c) => ({
        ...c,
        unidades: (c.unidades ?? []).map((u) =>
          canonicalizarUnidad(u, catalogoUnidades)
        ),
      })),
    [consejeros, catalogoUnidades]
  );

  const consejerosDisponibles = useMemo(() => {
    if (!form.unidad) return consejerosDesdeRegistro;
    const paraUnidad = consejerosDesdeRegistro.filter((c) =>
      consejeroAsesoraUnidad(c.unidades, form.unidad)
    );
    return paraUnidad.length > 0 ? paraUnidad : consejerosDesdeRegistro;
  }, [consejerosDesdeRegistro, form.unidad]);

  const hayConsejeroParaUnidad = useMemo(
    () =>
      form.unidad
        ? consejerosDesdeRegistro.some((c) =>
            consejeroAsesoraUnidad(c.unidades, form.unidad)
          )
        : true,
    [consejerosDesdeRegistro, form.unidad]
  );

  const filteredConquis = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conquis;

    return conquis.filter((c) => {
      const match = (value?: string) => (value || "").toLowerCase().includes(term);
      return (
        match(c.nombre) ||
        match(c.apellido) ||
        match(c.unidad) ||
        match(c.consejero) ||
        match(c.whatsapp)
      );
    });
  }, [conquis, search]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "unidad") {
      const paraUnidad = consejerosDesdeRegistro.filter((c) =>
        consejeroAsesoraUnidad(c.unidades, value)
      );
      let consejero = form.consejero;
      if (paraUnidad.length === 1) {
        consejero = paraUnidad[0].nombre;
      } else if (!paraUnidad.some((c) => c.nombre === form.consejero)) {
        consejero = "";
      }
      setForm({ ...form, unidad: value, consejero });
    } else {
      setForm({ ...form, [name]: value });
    }
  };
  // Especialidades anidadas
  const areas = Array.from(new Set(especialidadesBase.map(e => e.area)));
  const categorias = form.especialidadArea ? Array.from(new Set(especialidadesBase.filter(e => e.area === form.especialidadArea).map(e => e.categoria))) : [];
  const especialidades = form.especialidadArea && form.especialidadCategoria ? especialidadesBase.filter(e => e.area === form.especialidadArea && e.categoria === form.especialidadCategoria).map(e => e.especialidad) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      setSaving(false);
      return;
    }
    try {
      if (editMode && editId) {
        const { pin: _pinIgnorado, ...rest } = form;
        const payload = {
          ...rest,
          unidad: rest.unidad
            ? canonicalizarUnidad(rest.unidad, catalogoUnidades)
            : rest.unidad,
        };
        await updateDoc(doc(db, "RegistroConquis", editId), payload);
        setEditId(null);
        setEditMode(false);
        toast.success("Conquistador actualizado");
      } else {
        const pin = await generarPinUnicoClub();
        await addDoc(
          collection(db, "RegistroConquis"),
          datosConClub(
            {
              ...form,
              pin,
              unidad: form.unidad
                ? canonicalizarUnidad(form.unidad, catalogoUnidades)
                : form.unidad,
              especialidades: form.especialidades,
            },
            clubId
          )
        );
        toast.success("Conquistador registrado");
      }

      setForm({
        nombre: "",
        apellido: "",
        edad: "",
        fechaNacimiento: "",
        whatsapp: "",
        unidad: "",
        consejero: "",
        clase: "",
        especialidadArea: "",
        especialidadCategoria: "",
        especialidad: "",
        especialidades: [],
        pin: ""
      });
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
      handleError(err, editMode ? "Error al editar conquistador" : "Error al registrar conquistador");
    } finally {
      setSaving(false);
    }
  };
  // Edición
  const iniciarEdicion = (miembro: RegistroConquis) => {
    setEditId(miembro.id);
    const rawEsp = miembro.especialidades as EspecialidadObj[] | string | undefined;
    const especialidadesArr: EspecialidadObj[] = Array.isArray(rawEsp)
      ? rawEsp
      : typeof rawEsp === "string" && rawEsp.length > 0
        ? [{ area: "", categoria: "", especialidad: rawEsp }]
        : ([] as EspecialidadObj[]);
    setForm({
      nombre: [miembro.nombre, miembro.apellido].filter(Boolean).join(" "),
      apellido: miembro.apellido || "",
      edad: miembro.edad || "",
      fechaNacimiento: miembro.fechaNacimiento || "",
      whatsapp: miembro.whatsapp || "",
      unidad: miembro.unidad || "",
      consejero: miembro.consejero || "",
      clase: miembro.clase || "",
      especialidadArea: miembro.especialidadArea || "",
      especialidadCategoria: miembro.especialidadCategoria || "",
      especialidad: miembro.especialidad || "",
      especialidades: especialidadesArr,
      pin: miembro.pin || ""
    });
    setEditMode(true);
    setTimeout(() => {
      document.getElementById("campo-nacimiento")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  useEffect(() => {
    if (editarDesdeUrlAplicado.current || loading || conquis.length === 0) return;
    const id =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("editar")
        : null;
    if (!id) return;
    const m = conquis.find((c) => c.id === id);
    if (m) {
      editarDesdeUrlAplicado.current = true;
      iniciarEdicion(m);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loading, conquis]);

  const cancelarEdicion = () => {
    setEditId(null);
    setForm({
      nombre: "",
      apellido: "",
      clase: "",
      consejero: "",
      edad: "",
      especialidad: "",
      especialidadArea: "",
      especialidadCategoria: "",
      especialidades: [],
      pin: "",
      unidad: "",
      whatsapp: "",
      fechaNacimiento: ""
    });
    setEditMode(false);
  };
  // Removed unused guardarEdicion and editForm/setEditForm
  const solicitarEliminacion = (miembro: RegistroConquis) => {
    setSelectedForDelete(miembro);
    setDeleteDialogOpen(true);
  };

  const whatsappUrlFromRegistro = (m: Pick<RegistroConquis, "nombre" | "apellido" | "pin" | "unidad" | "consejero" | "clase" | "whatsapp">) =>
    buildWhatsappUrl(
      m.whatsapp,
      mensajePinConquistador({
        nombre: m.nombre,
        apellido: m.apellido,
        pin: m.pin,
        unidad: m.unidad,
        consejero: m.consejero,
        clase: m.clase,
      })
    );

  const confirmarEliminacion = async () => {
    if (!selectedForDelete?.id) return;

    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }

    try {
      await deleteDoc(doc(db, 'RegistroConquis', selectedForDelete.id));
      toast.success("Registro eliminado");
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
      handleError(err, "Error al eliminar el registro");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedForDelete(null);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07060f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-red-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-orange-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-rose-600/15 blur-[100px]" />
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
          <div className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2">
            <Image
              src={LOGO_CONQUISTADORES}
              alt="Conquistadores"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              unoptimized
            />
            <span className="text-xs font-bold text-white/80">
              {clubNombre || clubSlug || "Club"}
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:text-left">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-red-400">
              <Sparkles className="h-4 w-4" />
              Registro de miembros
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              <span className="bg-linear-to-r from-red-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                Conquistadores
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-white/50">
              Altas, edición, PIN y envío por WhatsApp. Todo el club en un panel elegante.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/70">
                <Users className="mr-1.5 inline h-3.5 w-3.5" />
                {loading ? "…" : conquis.length} registrados
              </span>
              <span className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-200">
                {unidades.length} unidades
              </span>
            </div>
          </div>

          <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-red-400/30 bg-white/4 p-6 shadow-2xl shadow-red-500/10 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-linear-to-br from-red-600 via-rose-500 to-orange-500 opacity-20 blur-3xl" />
            <div className="relative mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Image
                  src={LOGO_CONQUISTADORES}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-xl font-black">
                  {editMode ? "Editar conquistador" : "Nuevo conquistador"}
                </h2>
                <p className="text-sm text-white/50">
                  {editMode ? "Actualiza los datos y guarda los cambios." : "Completa el formulario para generar PIN."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className={labelClass}>Nombre *</label>
                <input id="nombre" type="text" name="nombre" value={form.nombre} onChange={handleInput} placeholder="Nombre" className={inputClass} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="apellido" className={labelClass}>Apellido</label>
                <input id="apellido" type="text" name="apellido" value={form.apellido} onChange={handleInput} placeholder="Apellido" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="campo-nacimiento" className={labelClass}>Fecha de nacimiento</label>
                <input id="campo-nacimiento" type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleInput} className={`${inputClass} [color-scheme:dark]`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edad" className={labelClass}>Edad</label>
                <input id="edad" type="number" name="edad" value={form.edad} onChange={handleInput} placeholder="Edad" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="whatsapp" className={labelClass}>WhatsApp</label>
                <input id="whatsapp" type="tel" name="whatsapp" value={form.whatsapp} onChange={handleInput} placeholder="+593…" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="unidad" className={labelClass}>Unidad</label>
                <select id="unidad" name="unidad" value={form.unidad} onChange={handleInput} className={inputClass}>
                  <option value="" className="bg-slate-900">Selecciona unidad</option>
                  {unidades.map((u, idx) => (
                    <option key={idx} value={u.nombre} className="bg-slate-900">{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="consejero" className={labelClass}>Consejero</label>
                <select id="consejero" name="consejero" value={form.consejero} onChange={handleInput} className={inputClass}>
                  <option value="" className="bg-slate-900">Selecciona consejero</option>
                  {consejerosDisponibles.map((c) => (
                    <option key={c.nombre} value={c.nombre} className="bg-slate-900">{c.nombre}</option>
                  ))}
                </select>
                {consejerosDesdeRegistro.length === 0 ? (
                  <p className="text-xs text-amber-400/90">
                    No hay consejeros.{" "}
                    <Link href={rutaConClub("/admin/consejero", clubSlug)} className="font-semibold underline hover:text-amber-300">
                      Registrar consejero
                    </Link>
                  </p>
                ) : form.unidad && !hayConsejeroParaUnidad ? (
                  <p className="text-xs text-amber-400/90">
                    Ningún consejero asesora «{form.unidad}».{" "}
                    <Link href={rutaConClub("/admin/consejero", clubSlug)} className="font-semibold underline">
                      Asignar en consejeros
                    </Link>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="clase" className={labelClass}>Clase *</label>
                <select id="clase" name="clase" value={form.clase} onChange={handleInput} required className={inputClass}>
                  <option value="" className="bg-slate-900">Selecciona clase</option>
                  {clasesOficiales.map((c, idx) => (
                    <option key={idx} value={c} className="bg-slate-900">{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:flex-wrap md:items-center md:justify-end">
                {editMode && form.pin && (
                  <p className="w-full rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                    PIN: <code className="font-mono text-base font-black text-white">{form.pin}</code>
                    {" — "}
                    <Link href={rutaConClub("/admin/configuracion", clubSlug)} className="font-bold underline">
                      Configuración → Resetear PIN
                    </Link>
                  </p>
                )}
                {editMode && form.pin && form.whatsapp && whatsappUrlFromRegistro(form) && (
                  <a
                    href={whatsappUrlFromRegistro(form)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 md:w-auto"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                )}
                {editMode && (
                  <Button type="button" variant="outline" onClick={cancelarEdicion} className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 md:w-auto">
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-linear-to-r from-red-600 via-rose-600 to-orange-600 font-bold text-white hover:opacity-90 md:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : editMode ? (
                    "Guardar cambios"
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Registrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/4 p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black">Lista del club</h3>
                <p className="text-sm text-white/50">Busca por nombre, unidad, consejero o WhatsApp.</p>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/60">
                <Loader2 className="h-10 w-10 animate-spin text-red-400" />
                <p className="text-sm font-semibold">Cargando conquistadores…</p>
              </div>
            ) : conquis.length === 0 ? (
              <Alert className="border-white/10 bg-white/5 text-white">
                <AlertTitle>Sin registros aún</AlertTitle>
                <AlertDescription className="text-white/60">
                  Usa el formulario de arriba para registrar el primer conquistador.
                </AlertDescription>
              </Alert>
            ) : filteredConquis.length === 0 ? (
              <Alert className="border-white/10 bg-white/5 text-white">
                <AlertTitle>Sin resultados</AlertTitle>
                <AlertDescription className="text-white/60">Prueba con otro término de búsqueda.</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/8">
                <Table className="text-xs md:text-sm">
                  <TableHeader>
                    <TableRow className="border-white/10 bg-red-500/10 hover:bg-red-500/10">
                      <TableHead className="font-bold text-white/90">Nombre</TableHead>
                      <TableHead className="font-bold text-white/90">Unidad</TableHead>
                      <TableHead className="font-bold text-white/90">Consejero</TableHead>
                      <TableHead className="font-bold text-white/90">WhatsApp</TableHead>
                      <TableHead className="font-bold text-white/90">PIN</TableHead>
                      <TableHead className="font-bold text-white/90">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConquis.map((m) => {
                      const waUrl = whatsappUrlFromRegistro(m);
                      return (
                        <TableRow key={m.id} className="border-white/8 hover:bg-white/5">
                          <TableCell className="font-semibold text-white">
                            {[m.nombre, m.apellido].filter(Boolean).join(" ")}
                          </TableCell>
                          <TableCell className="text-white/70">{m.unidad}</TableCell>
                          <TableCell className="text-white/70">{m.consejero}</TableCell>
                          <TableCell className="text-white/70">
                            {m.whatsapp ? m.whatsapp : <span className="italic text-white/35">Sin número</span>}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-orange-300">{m.pin}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {waUrl ? (
                                <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-500" asChild>
                                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="mr-1 h-4 w-4" />
                                    PIN
                                  </a>
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled className="rounded-xl border-white/15 text-white/40">
                                  PIN
                                </Button>
                              )}
                              <Button size="sm" variant="secondary" onClick={() => iniciarEdicion(m)} className="rounded-xl bg-white/10 text-white hover:bg-white/15">
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Editar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => solicitarEliminacion(m)} className="rounded-xl">
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-white/10 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar registro</DialogTitle>
            <DialogDescription className="text-white/60">
              Esta acción no se puede deshacer. Los datos se eliminarán de Firestore.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-white/80">
            {selectedForDelete ? (
              <p>
                ¿Eliminar a <strong className="text-white">{selectedForDelete.nombre}</strong> ({selectedForDelete.unidad})?
              </p>
            ) : (
              <p>Selecciona un registro.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/15 text-white">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminacion}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
