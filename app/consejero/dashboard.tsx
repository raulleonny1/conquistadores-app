"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { db } from "../../src/firebase";
import { collection, doc, getDocs, query, where, onSnapshot } from "firebase/firestore";
import {
  pinCalificacionesAsociado,
  pinCalificacionesConsejero,
} from "@/src/lib/actividadesCalificacion";
import { consejeroPuedeCalificar } from "@/src/lib/consejeroPermisos";
import { storageSeguroSet } from "@/src/lib/storageSeguro";
import { getCategoriasConPuntos, sumarPuntos } from "@/src/lib/categoriasPuntos";
import RetoEspecialConsejeroPanel from "@/src/components/RetoEspecialConsejeroPanel";
import ActividadesConsejeroCard from "@/src/components/ActividadesConsejeroCard";
import type { RetoEspecialDoc } from "@/src/lib/retosEspeciales";
import {
  Users,
  Award,
  BookOpen,
  ChevronRight,
  UserCircle,
  Bell,
  LayoutDashboard,
  LogOut,
  Trophy,
} from "lucide-react";

export default function ConsejeroDashboard({ consejeroId }: { consejeroId: string }) {
  const [consejero, setConsejero] = useState<{ nombre: string; consejeroAsociado?: string } | null>(null);
  const [unidades, setUnidades] = useState<string[]>([]);
  const [miembrosPorUnidad, setMiembrosPorUnidad] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showUnidadModal, setShowUnidadModal] = useState<string | null>(null);
  const [detallesMiembros, setDetallesMiembros] = useState<Record<string, any[]>>({});
  const [retosEspeciales, setRetosEspeciales] = useState<RetoEspecialDoc[]>([]);
  const [pinCalificaciones, setPinCalificaciones] = useState("");
  const [totalPuntos, setTotalPuntos] = useState(0);
  const [misPuntos, setMisPuntos] = useState<
    { id: string; materia: string; nota: string; icono: React.ReactNode }[]
  >([]);
  const [puntosAsociado, setPuntosAsociado] = useState<
    { id: string; materia: string; nota: string; icono: React.ReactNode }[]
  >([]);
  const [totalPuntosAsociado, setTotalPuntosAsociado] = useState(0);
  const [nombreAsociado, setNombreAsociado] = useState("");
  const [puedeCalificar, setPuedeCalificar] = useState(false);

  useEffect(() => {
    if (consejeroId) {
      storageSeguroSet("consejeroId", consejeroId);
    }
  }, [consejeroId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      const { getDoc, doc } = await import("firebase/firestore");
      const docSnap = await getDoc(doc(db, "consejeros", consejeroId));
      const cData = docSnap.exists() ? docSnap.data() : undefined;
      if (!isMounted) return;

      const asociadoNombre = (cData?.consejeroAsociado as string | undefined)?.trim() || "";
      setConsejero({
        nombre: cData?.nombre || "",
        consejeroAsociado: asociadoNombre || undefined,
      });
      setNombreAsociado(asociadoNombre);
      setPuedeCalificar(consejeroPuedeCalificar(cData));
      setPinCalificaciones(
        pinCalificacionesConsejero({
          id: consejeroId,
          pin: cData?.pin as string | undefined,
        })
      );

      const unidadesArr = Array.isArray(cData?.unidades) ? cData.unidades : [];
      setUnidades(unidadesArr);

      if (unidadesArr.length > 0) {
        const miembrosUnidad: Record<string, string[]> = {};
        const detallesPorUnidad: Record<string, any[]> = {};
        await Promise.all(
          unidadesArr.map(async (unidad: string) => {
            const q = query(collection(db, "RegistroConquis"), where("unidad", "==", unidad));
            const snap = await getDocs(q);
            miembrosUnidad[unidad] = snap.docs.map((d) => d.data().nombre || "");
            detallesPorUnidad[unidad] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          })
        );
        setMiembrosPorUnidad(miembrosUnidad);
        setDetallesMiembros(detallesPorUnidad);
      } else {
        setMiembrosPorUnidad({});
        setDetallesMiembros({});
      }

      setLoading(false);
    }

    if (consejeroId) fetchData();

    const retosQuery = query(collection(db, "retosEspeciales"), where("consejeroId", "==", consejeroId));
    const unsubscribeRetos = onSnapshot(retosQuery, (snap) => {
      setRetosEspeciales(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RetoEspecialDoc)));
    });

    return () => {
      isMounted = false;
      unsubscribeRetos();
    };
  }, [consejeroId]);

  useEffect(() => {
    if (!pinCalificaciones) return;
    const ref = doc(db, "calificacionesConquis", pinCalificaciones);
    const unsub = onSnapshot(ref, (snap) => {
      const puntos = snap.exists() ? snap.data().puntos || {} : {};
      const etiquetas =
        (snap.exists()
          ? (snap.data().etiquetasActividades as Record<string, string>)
          : undefined) || {};
      const categorias = getCategoriasConPuntos(puntos, etiquetas);
      setMisPuntos(
        categorias.map((cat) => ({
          id: cat.id,
          materia: cat.nombre,
          nota: `${cat.valor} pts`,
          icono:
            cat.id.startsWith("actividad_") ? (
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <Trophy size={20} />
              </div>
            ) : (
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <BookOpen size={20} />
              </div>
            ),
        }))
      );
      setTotalPuntos(sumarPuntos(puntos, etiquetas));
    });
    return () => unsub();
  }, [pinCalificaciones]);

  useEffect(() => {
    if (!consejeroId || !nombreAsociado) {
      setPuntosAsociado([]);
      setTotalPuntosAsociado(0);
      return;
    }
    const pinAsoc = pinCalificacionesAsociado(consejeroId);
    const ref = doc(db, "calificacionesConquis", pinAsoc);
    const unsub = onSnapshot(ref, (snap) => {
      const puntos = snap.exists() ? snap.data().puntos || {} : {};
      const etiquetas =
        (snap.exists()
          ? (snap.data().etiquetasActividades as Record<string, string>)
          : undefined) || {};
      const categorias = getCategoriasConPuntos(puntos, etiquetas);
      setPuntosAsociado(
        categorias.map((cat) => ({
          id: cat.id,
          materia: cat.nombre,
          nota: `${cat.valor} pts`,
          icono: (
            <div className="rounded-lg bg-teal-100 p-2 text-teal-700">
              <Trophy size={20} />
            </div>
          ),
        }))
      );
      setTotalPuntosAsociado(sumarPuntos(puntos, etiquetas));
    });
    return () => unsub();
  }, [consejeroId, nombreAsociado]);

  if (loading) {
    return <div className="text-center mt-10 text-lg text-blue-700">Cargando datos...</div>;
  }

  const primerNombre = consejero?.nombre?.split(" ")[0] || "Consejero";

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-100 to-sky-200 font-sans text-slate-800">
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 p-2">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-emerald-900 sm:block">Club Caleb</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-emerald-100"
            >
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-700">{consejero?.nombre}</p>
                <p className="text-xs text-slate-500">Consejero</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-200 shadow-sm"
                  onClick={() => setShowMenu((v) => !v)}
                  aria-label="Abrir menu de usuario"
                >
                  <UserCircle className="text-emerald-700" size={28} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border bg-white shadow-lg">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left font-semibold text-red-600 hover:bg-emerald-50"
                      onClick={() => {
                        window.location.href = "/";
                      }}
                    >
                      <LogOut size={18} /> Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-10">
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {"\u00a1"}Hola, <span className="text-emerald-600">{primerNombre}</span>!
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-2 shadow-sm">
              <span className="text-sm font-medium text-slate-600">Consejero asociado:</span>
              <span className="text-sm font-bold text-emerald-700">
                {consejero?.consejeroAsociado || "Sin asignar"}
              </span>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/90 px-4 py-2 shadow-sm">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-black text-amber-900">{totalPuntos} pts totales</span>
            </div>
          </div>
        </section>

        {(misPuntos.length > 0 || puntosAsociado.length > 0) && (
          <section className="mb-8 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Award className="text-emerald-600" size={22} />
              Puntos del consejero ({totalPuntos} pts)
            </h2>
            {misPuntos.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">Sin puntos registrados para el consejero.</p>
            ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {misPuntos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex items-center gap-3">
                    {item.icono}
                    <span className="font-semibold text-slate-800">{item.materia}</span>
                  </div>
                  <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {item.nota}
                  </span>
                </div>
              ))}
            </div>
            )}

            {nombreAsociado && (
              <>
                <h3 className="mb-3 mt-6 flex items-center gap-2 text-base font-bold text-teal-800">
                  Puntos del asociado: {nombreAsociado} ({totalPuntosAsociado} pts)
                </h3>
                {puntosAsociado.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin puntos registrados para el asociado.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {puntosAsociado.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          {item.icono}
                          <span className="font-semibold text-slate-800">{item.materia}</span>
                        </div>
                        <span className="rounded-xl bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                          {item.nota}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        <section className="mb-8">
          <RetoEspecialConsejeroPanel
            consejeroId={consejeroId}
            unidades={unidades}
            retosEspeciales={retosEspeciales}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SectionCard
            title="Tus Unidades"
            description="Gestiona tus equipos y companeros."
            icon={<Users className="h-6 w-6" />}
            items={unidades.map((unidad) => {
              const miembros = miembrosPorUnidad[unidad] || [];
              return (
                <div key={unidad}>
                  <div className="font-bold text-emerald-700">{unidad}</div>
                  {miembros.length > 0 ? (
                    <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                      {miembros.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs italic text-slate-400">Sin miembros</div>
                  )}
                  <button
                    type="button"
                    className="mt-2 rounded-lg border border-emerald-400 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setShowUnidadModal(unidad)}
                  >
                    Ver detalles
                  </button>
                </div>
              );
            })}
            emptyMessage="Aun no tienes unidades asignadas."
            color="emerald"
          />

          {showUnidadModal && detallesMiembros[showUnidadModal] && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
                <button
                  type="button"
                  className="absolute right-4 top-4 text-xl font-bold text-emerald-500 hover:text-emerald-700"
                  onClick={() => setShowUnidadModal(null)}
                  aria-label="Cerrar"
                >
                  {"\u00d7"}
                </button>
                <h2 className="mb-4 text-2xl font-bold text-emerald-700">Miembros de {showUnidadModal}</h2>
                {detallesMiembros[showUnidadModal].length === 0 ? (
                  <div className="italic text-slate-400">No hay miembros en esta unidad.</div>
                ) : (
                  <div className="space-y-4">
                    {detallesMiembros[showUnidadModal].map((miembro: any, idx: number) => (
                      <div key={miembro.id || idx} className="rounded-xl border bg-emerald-50/30 p-4">
                        <div className="text-lg font-bold text-emerald-800">{miembro.nombre}</div>
                        <div className="mb-1 text-xs text-slate-600">PIN: {miembro.pin || "N/A"}</div>
                        <div className="mb-1 text-xs text-slate-600">Clase: {miembro.clase || "N/A"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {puedeCalificar ? (
            <SectionCard
              title="Calificaciones"
              description="Califica el desempeno de tu unidad."
              icon={<Award className="h-6 w-6" />}
              items={Object.values(detallesMiembros)
                .flat()
                .map((miembro: any) => (
                  <div key={miembro.pin || miembro.id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-blue-700">{miembro.nombre}</div>
                      <div className="text-xs text-slate-600">PIN: {miembro.pin}</div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                      onClick={() =>
                        (window.location.href = `/consejero/calificaciones?conquistador=${miembro.pin}`)
                      }
                    >
                      Evaluar
                    </button>
                  </div>
                ))}
              emptyMessage="No hay miembros para calificar."
              color="blue"
              extra={
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="rounded-xl bg-green-600 px-6 py-2 text-sm font-bold text-white hover:bg-green-800"
                    onClick={() => {
                      const unidad = unidades[0] || "";
                      if (unidad) {
                        window.location.href = `/consejero/calificaciones-grupo?unidad=${encodeURIComponent(unidad)}&consejeroId=${consejeroId}`;
                      } else toast.error("No hay unidad para calificar en grupo.");
                    }}
                  >
                    Calificar en grupo
                  </button>
                </div>
              }
            />
          ) : (
            <div className="group rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-xl">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-2xl bg-amber-500 p-3 text-white shadow-lg">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900">Calificaciones</h3>
                  <p className="mt-1 text-sm text-amber-800/90">
                    Solo el administrador asigna puntos. Si la directiva te autoriza, el admin activará tu
                    permiso de calificar en tu registro de consejero.
                  </p>
                </div>
              </div>
            </div>
          )}

          <ActividadesConsejeroCard />
        </div>

        <footer className="relative mt-12 overflow-hidden rounded-3xl bg-emerald-900 p-6 text-emerald-50">
          <div className="relative z-10">
            <h3 className="mb-2 text-xl font-bold">{"\u00bf"}Necesitas ayuda?</h3>
            <p className="mb-4 max-w-md text-emerald-200/80">
              Contacta a la directiva del club si tienes dudas sobre calificaciones o actividades.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  items,
  emptyMessage,
  color,
  extra,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
  emptyMessage: string;
  color: "emerald" | "blue" | "rose";
  extra?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    rose: "bg-rose-500 hover:bg-rose-600",
  };
  const textColors: Record<string, string> = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    rose: "text-rose-700",
  };

  return (
    <div className="group rounded-3xl border border-white bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-2xl p-3 text-white shadow-lg ${colors[color]}`}>{icon}</div>
        <ChevronRight size={20} className="text-slate-300" />
      </div>
      <h3 className={`mb-1 text-xl font-bold ${textColors[color]}`}>{title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-slate-500">{description}</p>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              {item}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 px-4 py-8">
            <LayoutDashboard className="mb-2 h-8 w-8 text-slate-200" />
            <p className="text-center text-xs italic text-slate-400">{emptyMessage}</p>
          </div>
        )}
      </div>
      {extra}
    </div>
  );
}
