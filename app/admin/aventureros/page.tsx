"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db, formatFechaDDMMYYYY } from "@/src/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ArrowLeft, Award, MessageCircle, Mountain, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { generarPinUnicoClub } from "@/src/lib/pinUnico";
import { useClubActivo } from "@/src/hooks/useClubActivo";
import { datosConClub, queryColeccionClub } from "@/src/lib/clubScope";
import { mensajeErrorFirestore, prepararEscrituraClub } from "@/src/lib/escrituraFirestore";
import { COLECCION_POR_PROGRAMA } from "@/src/constants/categoriasPrograma";
import { indexarTotalesPorPin } from "@/src/lib/categoriasPuntos";
import { CLASES_AVENTUREROS } from "@/src/constants/aventureros";
import { buildWhatsappUrl, mensajePinAventurero } from "@/src/utils/whatsapp";
import BotonNotificarPadres from "@/src/components/padres/BotonNotificarPadres";
import { mensajePadresResumenAvance } from "@/src/utils/mensajesPadres";
import { rutaConClub } from "@/src/lib/rutasClub";
import AdminInsigniasEditor from "@/src/components/programas/AdminInsigniasEditor";
import {
  getSiguienteClaseAventurero,
  normalizarInsignias,
  puedePromoverClase,
  progresoInsigniasClase,
} from "@/src/lib/progresoAventurero";

type AventureroDoc = {
  id: string;
  nombre: string;
  apellido: string;
  edad: string;
  fechaNacimiento: string;
  clase: string;
  club: string;
  whatsapp: string;
  pin: string;
  insignias?: Record<string, boolean>;
  fechaRegistro?: string;
};

const formInicial: {
  nombre: string;
  apellido: string;
  edad: string;
  fechaNacimiento: string;
  clase: string;
  club: string;
  whatsapp: string;
} = {
  nombre: "",
  apellido: "",
  edad: "",
  fechaNacimiento: "",
  clase: CLASES_AVENTUREROS[0].nombre,
  club: "",
  whatsapp: "",
};

function calcularEdad(fechaNacimiento: string): string {
  if (!fechaNacimiento) return "";
  const birth = new Date(fechaNacimiento);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
  return String(years);
}

export default function AdminAventurerosPage() {
  const { clubId, clubSlug, clubNombre } = useClubActivo();
  const [form, setForm] = useState(formInicial);
  const [editId, setEditId] = useState<string | null>(null);
  const [insigniasEditId, setInsigniasEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [miembros, setMiembros] = useState<AventureroDoc[]>([]);
  const [totalesPin, setTotalesPin] = useState<Record<string, number>>({});

  useEffect(() => {
    const q = queryColeccionClub("aventureros", clubId);
    if (!q) return;
    const unsub = onSnapshot(q, (snap) => {
      setMiembros(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AventureroDoc, "id">) }))
          .sort((a, b) =>
            `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, "es")
          )
      );
    });
    return () => unsub();
  }, [clubId]);

  useEffect(() => {
    if (!clubId || miembros.length === 0) {
      setTotalesPin({});
      return;
    }
    const pinsClub = new Set(miembros.map((m) => m.pin.trim()));
    const unsub = onSnapshot(collection(db, COLECCION_POR_PROGRAMA.aventureros), (snap) => {
      const docs = snap.docs
        .filter((d) => pinsClub.has(d.id) || pinsClub.has(String(d.data().pin ?? "")))
        .map((d) => ({ id: d.id, data: () => d.data() as Record<string, unknown> }));
      setTotalesPin(indexarTotalesPorPin(docs));
    });
    return () => unsub();
  }, [clubId, miembros]);

  const miembroInsignias = useMemo(
    () => miembros.find((m) => m.id === insigniasEditId) ?? null,
    [miembros, insigniasEditId]
  );

  const progresoInsignias = useMemo(() => {
    if (!miembroInsignias) return null;
    const ins = normalizarInsignias(miembroInsignias.insignias);
    return progresoInsigniasClase(miembroInsignias.clase, ins);
  }, [miembroInsignias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "fechaNacimiento") {
      setForm((prev) => ({
        ...prev,
        fechaNacimiento: value,
        edad: calcularEdad(value),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(formInicial);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      toast.error("Nombre y apellido son obligatorios.");
      return;
    }
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        edad: form.edad,
        fechaNacimiento: form.fechaNacimiento,
        clase: form.clase,
        club: form.club.trim(),
        whatsapp: form.whatsapp.trim(),
      };

      if (editId) {
        await updateDoc(doc(db, "aventureros", editId), payload);
        toast.success("Aventurero actualizado.");
        resetForm();
      } else {
        const pin = await generarPinUnicoClub();
        await addDoc(
          collection(db, "aventureros"),
          datosConClub(
            { ...payload, pin, insignias: {}, fechaRegistro: formatFechaDDMMYYYY(new Date()) },
            clubId
          )
        );
        toast.success(`Aventurero registrado. PIN: ${pin}`);
        resetForm();
      }
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
    }
    setLoading(false);
  };

  const handleEdit = (m: AventureroDoc) => {
    setInsigniasEditId(null);
    setForm({
      nombre: m.nombre,
      apellido: m.apellido,
      edad: m.edad,
      fechaNacimiento: m.fechaNacimiento,
      clase: m.clase,
      club: m.club,
      whatsapp: m.whatsapp,
    });
    setEditId(m.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este aventurero?")) return;
    const prep = await prepararEscrituraClub(clubId);
    if (!prep.ok) {
      toast.error(prep.mensaje);
      return;
    }
    try {
      await deleteDoc(doc(db, "aventureros", id));
      if (insigniasEditId === id) setInsigniasEditId(null);
      toast.success("Registro eliminado.");
    } catch (err) {
      toast.error(mensajeErrorFirestore(err));
    }
  };

  const handlePromover = async (nuevaClase: string) => {
    if (!miembroInsignias) return;
    await updateDoc(doc(db, "aventureros", miembroInsignias.id), { clase: nuevaClase });
    toast.success(`¡${miembroInsignias.nombre} promovido a ${nuevaClase}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
      <div className="border-b border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-6 py-8">
        <Link
          href={rutaConClub("/admin/registros", clubSlug)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Registros
        </Link>
        <div className="flex items-center gap-3">
          <Mountain className="h-10 w-10 text-amber-600" />
          <div>
            <h1 className="text-3xl font-black text-amber-950">Aventureros</h1>
            <p className="text-sm text-amber-800/80">Registro, insignias y avance de clase</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-900">
              <Plus className="h-5 w-5" />
              {editId ? "Editar aventurero" : "Nuevo aventurero"}
            </h2>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre *"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-amber-400"
                />
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Apellido *"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-amber-400"
                />
              </div>
              <input
                name="fechaNacimiento"
                type="date"
                value={form.fechaNacimiento}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-amber-400"
              />
              <select
                name="clase"
                value={form.clase}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-amber-400"
              >
                {CLASES_AVENTUREROS.map((c) => (
                  <option key={c.nombre} value={c.nombre}>
                    {c.nombre} ({c.edad} años)
                  </option>
                ))}
              </select>
              <input
                name="club"
                value={form.club}
                onChange={handleChange}
                placeholder="Club / manada local (ej. Manada Leones)"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-amber-400"
              />
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="WhatsApp"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-amber-400"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-xl bg-amber-600 py-2.5 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? "Guardando…" : editId ? "Actualizar" : "Registrar"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {miembroInsignias && progresoInsignias && (
            <AdminInsigniasEditor
              coleccion="aventureros"
              miembroId={miembroInsignias.id}
              nombreMiembro={`${miembroInsignias.nombre} ${miembroInsignias.apellido}`}
              clase={miembroInsignias.clase}
              insignias={normalizarInsignias(miembroInsignias.insignias)}
              insigniasLista={progresoInsignias.insignias}
              puedePromover={puedePromoverClase(
                miembroInsignias.clase,
                normalizarInsignias(miembroInsignias.insignias)
              )}
              siguienteClase={getSiguienteClaseAventurero(miembroInsignias.clase)}
              onPromover={handlePromover}
              onUpdated={() => {}}
              tema="amber"
              whatsapp={miembroInsignias.whatsapp}
              clubNombre={clubNombre}
              clubSlug={clubSlug}
              miembroPin={miembroInsignias.pin}
            />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Miembros registrados ({miembros.length})
          </h2>
          {miembros.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay aventureros en este club.</p>
          ) : (
            <ul className="max-h-[40rem] space-y-3 overflow-y-auto">
              {miembros.map((m) => {
                const ins = normalizarInsignias(m.insignias);
                const prog = progresoInsigniasClase(m.clase, ins);
                return (
                  <li
                    key={m.id}
                    className={`rounded-xl border p-4 ${
                      insigniasEditId === m.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">
                          {m.nombre} {m.apellido}
                        </p>
                        <p className="text-sm text-slate-500">
                          {m.clase}
                          {m.club ? ` · ${m.club}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-amber-700">
                          Insignias: {prog.completadas}/{prog.total} · PIN {m.pin}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1">
                    {m.whatsapp && (
                      <>
                        <a
                          href={buildWhatsappUrl(
                            m.whatsapp,
                            mensajePinAventurero({
                              nombre: m.nombre,
                              apellido: m.apellido,
                              pin: m.pin,
                              clase: m.clase,
                              club: m.club,
                            })
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                          title="Enviar PIN por WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <BotonNotificarPadres
                          whatsapp={m.whatsapp}
                          mensaje={mensajePadresResumenAvance({
                            nombreHijo: `${m.nombre} ${m.apellido}`.trim(),
                            programa: "aventureros",
                            clubNombre: clubNombre || clubSlug,
                            clubSlug,
                            pin: m.pin,
                            totalPuntos: totalesPin[m.pin] ?? 0,
                            clase: m.clase,
                            insigniasCompletadas: progresoInsigniasClase(m.clase, normalizarInsignias(m.insignias)).completadas,
                            insigniasTotal: progresoInsigniasClase(m.clase, normalizarInsignias(m.insignias)).total,
                          })}
                          compacto
                        />
                      </>
                    )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditId(null);
                            setForm(formInicial);
                            setInsigniasEditId(m.id);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                        >
                          <Award className="h-3 w-3" />
                          Insignias
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(m)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
