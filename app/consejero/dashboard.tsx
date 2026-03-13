"use client";
import React, { useEffect, useState } from "react";
import EventosSidebar from './EventosSidebar';
import { db } from "../../src/firebase";
import { collection, getDocs, query, where, onSnapshot, addDoc } from "firebase/firestore";
import {
  Users,
  Award,
  Calendar,
  ChevronRight,
  UserCircle,
  Bell,
  LayoutDashboard,
  LogOut
} from "lucide-react";

export default function ConsejeroDashboard({ consejeroId }: { consejeroId: string }) {
  const [consejero, setConsejero] = useState<{ nombre: string; consejeroAsociado?: string } | null>(null);
  const [unidades, setUnidades] = useState<string[]>([]);
  const [miembrosPorUnidad, setMiembrosPorUnidad] = useState<Record<string, string[]>>({});
  const [calificaciones, setCalificaciones] = useState<string[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showUnidadModal, setShowUnidadModal] = useState<string|null>(null);
  const [detallesMiembros, setDetallesMiembros] = useState<Record<string, any[]>>({});
  const [retosEspeciales, setRetosEspeciales] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      const { getDoc, doc } = await import("firebase/firestore");
      const docSnap = await getDoc(doc(db, "consejeros", consejeroId));
      const cData = docSnap.exists() ? docSnap.data() : undefined;
      if (!isMounted) return;
      setConsejero({
        nombre: cData?.nombre || "",
        consejeroAsociado: cData?.consejeroAsociado || undefined
      });
      // Unidades directamente del documento del consejero
      const unidadesArr = Array.isArray(cData?.unidades) ? cData.unidades : [];
      setUnidades(unidadesArr);
      // Buscar miembros de cada unidad
      if (unidadesArr.length > 0) {
        const miembrosUnidad: Record<string, string[]> = {};
        const detallesPorUnidad: Record<string, any[]> = {};
        const promises = unidadesArr.map(async (unidad: string) => {
          const q = query(collection(db, "RegistroConquis"), where("unidad", "==", unidad));
          const snap = await getDocs(q);
          const miembros = snap.docs.map(doc => doc.data().nombre || "");
          miembrosUnidad[unidad] = miembros;
          detallesPorUnidad[unidad] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
        await Promise.all(promises);
        setMiembrosPorUnidad(miembrosUnidad);
        setDetallesMiembros(detallesPorUnidad);
      } else {
        setMiembrosPorUnidad({});
        setDetallesMiembros({});
      }
      // Calificaciones
      const califQuery = await getDocs(query(collection(db, "calificaciones"), where("consejeroId", "==", consejeroId)));
      if (!isMounted) return;
      setCalificaciones(califQuery.docs.map(doc => {
        const data = doc.data();
        return `${data.unidad || ""}: ${data.nota || ""}`;
      }));
      // Actividades
      const eventosQuery = await getDocs(collection(db, "eventos"));
      if (!isMounted) return;
      setActividades(eventosQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    if (consejeroId) fetchData();
    // Suscripción en tiempo real a retosEspeciales
    const retosQuery = query(collection(db, "retosEspeciales"), where("consejeroId", "==", consejeroId));
    const unsubscribeRetos = onSnapshot(retosQuery, snap => {
      setRetosEspeciales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      isMounted = false;
      unsubscribeRetos();
    };
  }, [consejeroId]);

  if (loading) return <div className="text-center mt-10 text-lg text-blue-700">Cargando datos reales...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-100 to-sky-200 font-sans text-slate-800">
      {/* Navbar Superior */}
      <nav className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Users className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-emerald-900 hidden sm:block">
                Club Caleb
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-emerald-100 rounded-full transition-colors">
                <Bell size={20} />
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700">{consejero?.nombre}</p>
                  <p className="text-xs text-slate-500">Miembro Activo</p>
                </div>
                <div className="relative">
                  <button
                    className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm focus:outline-none"
                    onClick={() => setShowMenu((v) => !v)}
                    aria-label="Abrir menú de usuario"
                  >
                    <UserCircle className="text-emerald-700" size={28} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border z-50 animate-in fade-in slide-in-from-top-2">
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-emerald-50 rounded-xl font-semibold flex items-center gap-2"
                        onClick={() => {
                          window.location.href = '/';
                        }}
                      >
                        <LogOut size={18} /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Encabezado de Bienvenida */}
        <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
            ¡Hola, <span className="text-emerald-600">{consejero?.nombre?.split(' ')[0]}</span>! 👋
          </h1>
          <div className="flex items-center gap-2 bg-white/50 w-fit px-4 py-2 rounded-full border border-white/40 shadow-sm">
            <span className="text-sm font-medium text-slate-600">Consejero asociado:</span>
            <span className="text-sm font-bold text-emerald-700">
              {consejero?.consejeroAsociado || "Sin asignar"}
            </span>
          </div>
        </section>

        {/* Rejilla de Secciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta: Reto Especial */}
          <div className="group bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 rounded-3xl p-6 shadow-xl border border-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white shadow-lg transition-all">
                <Award className="w-6 h-6" />
              </div>
              <button className="p-2 text-slate-300 group-hover:text-slate-500 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <h3 className="text-xl font-bold mb-1 text-purple-700">Reto Especial</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Envía retos a tus conquistadores por unidad.</p>
            {/* Formulario editable para cada unidad */}
            {unidades.map(unidad => (
              <div key={unidad} className="mb-4">
                <div className="font-bold text-purple-700">Unidad: {unidad}</div>
                <form
                  className="bg-white rounded-xl p-3 border border-purple-200 mt-2 flex flex-col gap-2"
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const titulo = (form.elements.namedItem("titulo") as HTMLInputElement).value;
                    const descripcion = (form.elements.namedItem("descripcion") as HTMLInputElement).value;
                    const puntos = parseInt((form.elements.namedItem("puntos") as HTMLInputElement).value, 10);
                    const fecha = new Date().toISOString().split("T")[0];
                    try {
                      await addDoc(collection(db, "retosEspeciales"), {
                        titulo,
                        descripcion,
                        puntos,
                        unidad,
                        consejeroId,
                        fecha
                      });
                      alert("Reto creado y enviado a los conquistadores de la unidad " + unidad);
                    } catch (err) {
                      let errorMsg = "";
                      if (err instanceof Error) {
                        errorMsg = err.message;
                      } else {
                        errorMsg = typeof err === "string" ? err : JSON.stringify(err);
                      }
                      alert("Error al crear reto: " + errorMsg);
                    }
                  }}
                >
                  <input name="titulo" placeholder="Título del reto" className="border p-2 rounded-xl" required />
                  <input name="descripcion" placeholder="Descripción" className="border p-2 rounded-xl" required />
                  <input name="puntos" placeholder="Puntos" type="number" className="border p-2 rounded-xl" required />
                  <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-800 transition-all text-sm">
                    Enviar reto a conquistadores
                  </button>
                </form>
                {/* Mostrar retos especiales de la unidad en tiempo real */}
                {retosEspeciales.filter(r => r.unidad === unidad).length > 0 && (
                  <div className="mt-2">
                    <div className="font-semibold text-purple-600 mb-1">Retos enviados:</div>
                    <ul className="space-y-2">
                      {retosEspeciales.filter(r => r.unidad === unidad).map(r => (
                        <li key={r.id} className="bg-purple-50 border border-purple-200 rounded-xl p-2">
                          <div className="font-bold text-purple-700">{r.titulo}</div>
                          <div className="text-xs text-purple-500">{r.descripcion}</div>
                          <div className="text-xs text-purple-400">Puntos: {r.puntos} | Fecha: {r.fecha}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Tarjeta: Unidades */}
          <SectionCard
            title="Tus Unidades"
            description="Gestiona tus equipos y compañeros."
            icon={<Users className="w-6 h-6" />}
            items={unidades.map(unidad => {
              const miembros = miembrosPorUnidad[unidad] || [];
              return (
                <div key={unidad}>
                  <div className="font-bold text-emerald-700">{unidad}</div>
                  {miembros.length > 0 ? (
                    <ul className="text-xs text-slate-600 mt-1 list-disc list-inside">
                      {miembros.map((m, idx) => <li key={idx}>{m}</li>)}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-400 italic">Sin miembros</div>
                  )}
                  <button
                    className="mt-2 px-3 py-1 rounded-lg border border-emerald-400 text-emerald-700 text-xs font-bold hover:bg-emerald-50"
                    onClick={() => setShowUnidadModal(unidad)}
                  >
                    Ver Detalles
                  </button>
                </div>
              );
            })}
            emptyMessage="Aún no tienes unidades asignadas."
            color="emerald"
          />
                {/* Modal de detalles de miembros de la unidad */}
                {showUnidadModal && detallesMiembros[showUnidadModal] && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative animate-in fade-in slide-in-from-top-4 overflow-y-auto max-h-[90vh]">
                      <button
                        className="absolute top-4 right-4 text-emerald-500 hover:text-emerald-700 text-xl font-bold"
                        onClick={() => setShowUnidadModal(null)}
                        aria-label="Cerrar"
                      >
                        ×
                      </button>
                      <h2 className="text-2xl font-bold text-emerald-700 mb-4">Miembros de {showUnidadModal}</h2>
                      {detallesMiembros[showUnidadModal].length === 0 ? (
                        <div className="text-slate-400 italic">No hay miembros registrados en esta unidad.</div>
                      ) : (
                        <div className="space-y-4">
                          {detallesMiembros[showUnidadModal].map((miembro: any, idx: number) => (
                            <div key={miembro.id || idx} className="border rounded-xl p-4 bg-emerald-50/30">
                              <div className="font-bold text-emerald-800 text-lg">{miembro.nombre}</div>
                              <div className="text-xs text-slate-600 mb-1">Edad: {miembro.edad || 'N/A'}</div>
                              <div className="text-xs text-slate-600 mb-1">Clase: {miembro.clase || 'N/A'}</div>
                              <div className="text-xs text-slate-600 mb-1">PIN: {miembro.pin || 'N/A'}</div>
                              <div className="text-xs text-slate-600 mb-1">Especialidades: {Array.isArray(miembro.especialidades) ? miembro.especialidades.join(', ') : (miembro.especialidades || 'N/A')}</div>
                              <div className="text-xs text-slate-600 mb-1">Unidad: {miembro.unidad || 'N/A'}</div>
                              {/* Agrega aquí más campos si los hay */}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
          {/* Tarjeta: Calificaciones */}
          <SectionCard
            title="Calificaciones"
            description="Califica el desempeño o actividades de tu unidad."
            icon={<Award className="w-6 h-6" />}
            items={calificaciones}
            emptyMessage="No hay calificaciones registradas."
            color="blue"
          />
          {/* Tarjeta: Actividades conectada a eventos reales */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-rose-500 hover:bg-rose-600  ESTtext-white shadow-lg transition-all">
                <Calendar className="w-6 h-6" />
              </div>
              <button className="p-2 text-slate-300 group-hover:text-slate-500 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <h3 className="text-xl font-bold mb-1 text-rose-700">Actividades</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Próximos eventos y tareas.</p>
            <div className="space-y-3">
              {actividades.length > 0 ? (
                actividades.map((evento: any) => (
                  <div key={evento.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-rose-700 mb-1">{evento.nombre}</div>
                    <div className="text-xs text-slate-600 mb-1">Fecha: {(() => {
                      const { formatFechaDDMMYYYY } = require("../../src/firebase");
                      return formatFechaDDMMYYYY(evento.fecha);
                    })()}</div>
                    <div className="text-xs text-slate-600 mb-1">Lugar: {evento.lugar}</div>
                    <div className="text-xs text-slate-400">{evento.observacion}</div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                  <LayoutDashboard className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 text-center italic">No hay actividades pendientes.</p>
                </div>
              )}
            </div>
            <button
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm transition-all border-2 border-transparent group-hover:border-current text-rose-700 bg-slate-50 hover:bg-white"
              onClick={() => {
                if (actividades.length > 0) {
                  setEventoSeleccionado(actividades[0]);
                  setShowModal(true);
                }
              }}
            >
              Ver Detalles
            </button>
          </div>

          {/* Modal flotante para detalles de actividad */}
          {showModal && eventoSeleccionado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-in fade-in slide-in-from-top-4">
                <button
                  className="absolute top-4 right-4 text-rose-500 hover:text-rose-700 text-xl font-bold"
                  onClick={() => setShowModal(false)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold text-rose-700 mb-4">Detalles de Actividad</h2>
                <div className="mb-2">
                  <span className="font-semibold text-slate-700">Nombre:</span> {eventoSeleccionado.nombre}
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-slate-700">Fecha:</span> {eventoSeleccionado.fecha}
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-slate-700">Lugar:</span> {eventoSeleccionado.lugar}
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-slate-700">Observación:</span> {eventoSeleccionado.observacion}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Informativo o Acceso Rápido */}
        <footer className="mt-12 p-6 rounded-3xl bg-emerald-900 text-emerald-50 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">¿Necesitas ayuda con algo?</h3>
            <p className="text-emerald-200/80 mb-4 max-w-md">Contacta a tu consejero o revisa la guía de usuario del club para resolver tus dudas.</p>
            <button className="bg-white text-emerald-900 px-6 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-all transform hover:scale-105">
              Contactar Soporte
            </button>
          </div>
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-emerald-700/30 rounded-full blur-3xl"></div>
        </footer>
      </main>
    </div>
  );
}

// Sub-componente para las tarjetas de sección
function SectionCard({ title, description, icon, items, emptyMessage, color, onDetalles }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: any[];
  emptyMessage: string;
  color: "emerald" | "blue" | "rose";
  onDetalles?: (unidad: string) => void;
}) {
  const colors: any = {
    emerald: "bg-emerald-500 hover:bg-emerald-600 ring-emerald-100",
    blue: "bg-blue-500 hover:bg-blue-600 ring-blue-100",
    rose: "bg-rose-500 hover:bg-rose-600 ring-rose-100"
  };
  const textColors: any = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    rose: "text-rose-700"
  };
  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} text-white shadow-lg transition-all`}>
          {icon}
        </div>
        <button className="p-2 text-slate-300 group-hover:text-slate-500 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
      <h3 className={`text-xl font-bold mb-1 ${textColors[color]}`}>{title}</h3>
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              {item}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
            <LayoutDashboard className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-400 text-center italic">{emptyMessage}</p>
          </div>
        )}
      </div>
      {/* El botón de detalles ahora está dentro de cada unidad, así que este bloque global se eliminó */}
    </div>
  );
}
