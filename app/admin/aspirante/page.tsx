"use client";
import React, { useState, useEffect } from "react";
import { db, formatFechaDDMMYYYY } from "../../../src/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { tarjetaGuiaMayor } from "@/src/data/tarjetaGuiaMayor";
import { TarjetaGuiaMayor } from "@/src/types";
import FirmaDigital from "@/src/components/FirmaDigital";
import { guardarFirma } from "@/src/lib/guardarFirma";
import { ArrowLeft } from "lucide-react";

// Eliminado menú, ahora es un solo formulario

const AspirantePage = () => {
    // Detectar combinación *611 para redirigir
    useEffect(() => {
      let buffer = "";
      const handleKeyDown = (e: KeyboardEvent) => {
        buffer += e.key;
        if (buffer.includes("*611")) {
          window.location.href = "/admin/evaluar-guia-mayor";
          buffer = "";
        }
        if (buffer.length > 5) buffer = "";
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    // ...existing code...

    // Estados necesarios
    const [aspiranteId, setAspiranteId] = useState<string>("");
    const [actividades, setActividades] = useState<Array<{nombre:string,completado:boolean,evaluador:string,fecha:string,hora:string,firma:string}>>([]);
    const [firmaIndex, setFirmaIndex] = useState<number | null>(null);
    const [evaluador, setEvaluador] = useState<string>("");
    let tarjetaDoc: TarjetaGuiaMayor | null;
      const seleccionarAspirante = async (aspirante:any) => {
        setAspiranteId(aspirante.id);
        setEvaluador(aspirante.evaluador || "");
        const ref = doc(db, "tarjetaGuiaMayor", aspirante.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const actividadesIniciales = tarjetaGuiaMayor.flatMap(grupo =>
            grupo.actividades.map(act => ({
              nombre: act,
              completado: false,
              evaluador: "",
              fecha: "",
              hora: "",
              firma: ""
            }))
          );
          await setDoc(ref, {
            aspiranteId: aspirante.id,
            aspiranteNombre: aspirante.nombre,
            fechaInicio: new Date().toLocaleDateString(),
            actividades: actividadesIniciales
          });
          setActividades(actividadesIniciales);
        } else {
          tarjetaDoc = { id: snap.id, ...(snap.data() as Omit<TarjetaGuiaMayor, "id">) };
          setActividades((snap.data() as any).actividades);
        }
      };
     const actualizarActividad = async (index:number, estado:boolean) => {
       if (!aspiranteId) return;
       const nuevas = [...actividades];
       nuevas[index].completado = estado;
       nuevas[index].evaluador = evaluador;
       nuevas[index].fecha = new Date().toLocaleDateString();
       nuevas[index].hora = new Date().toLocaleTimeString();
       setActividades(nuevas);
       const ref = doc(db, "tarjetaGuiaMayor", aspiranteId);
       await updateDoc(ref, {
         actividades: nuevas
       });
     };
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    nacimiento: "",
    sexo: "",
    direccion: "",
    telefono: "",
    email: "",
    iglesia: "",
    distrito: "",
    asociacion: "",
    pastor: "",
    director: "",
    club: "",
    anioIngreso: "",
    cargoActual: "",
    unidad: "",
    aniosClub: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aspirantes, setAspirantes] = useState<any[]>([]);
  // Generar PIN aleatorio
  const generarPin = () => Math.floor(1000 + Math.random() * 9000).toString();

  // Cargar aspirantes en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "aspirantesGuiaMayor"), snap => {
      setAspirantes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "aspirantesGuiaMayor", editId), {
          ...form
        });
        alert("Aspirante actualizado correctamente.");
        setEditId(null);
      } else {
        const pin = generarPin();
        // Registrar aspirante
        const aspiranteDoc = await addDoc(collection(db, "aspirantesGuiaMayor"), {
          ...form,
          pin,
          fechaRegistro: formatFechaDDMMYYYY(new Date())
        });
        // Crear tarjetaGuiaMayor
          await setDoc(doc(db, "tarjetaGuiaMayor", aspiranteDoc.id), {
            aspiranteId: aspiranteDoc.id,
            aspiranteNombre: form.nombre,
            fechaInicio: new Date().toLocaleDateString(),
            actividades: tarjetaGuiaMayor.flatMap(grupo =>
              grupo.actividades.map(act => ({
                nombre: act,
                completado: false,
                evaluador: "",
                fecha: "",
                hora: "",
                firma: ""
              }))
            )
          });
        alert("Aspirante registrado correctamente. PIN: " + pin);
      }
      setForm({
        nombre: "",
        edad: "",
        nacimiento: "",
        sexo: "",
        direccion: "",
        telefono: "",
        email: "",
        iglesia: "",
        distrito: "",
        asociacion: "",
        pastor: "",
        director: "",
        club: "",
        anioIngreso: "",
        cargoActual: "",
        unidad: "",
        aniosClub: ""
      });
    } catch (err) {
      alert("Error al guardar datos.");
    }
    setLoading(false);
  };

  const handleEdit = (a: any) => {
    setForm({
      nombre: a.nombre,
      edad: a.edad,
      nacimiento: a.nacimiento,
      sexo: a.sexo,
      direccion: a.direccion,
      telefono: a.telefono,
      email: a.email,
      iglesia: a.iglesia,
      distrito: a.distrito,
      asociacion: a.asociacion,
      pastor: a.pastor,
      director: a.director,
      club: a.club,
      anioIngreso: a.anioIngreso,
      cargoActual: a.cargoActual,
      unidad: a.unidad,
      aniosClub: a.aniosClub
    });
    setEditId(a.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este aspirante?")) return;
    await deleteDoc(doc(db, "aspirantesGuiaMayor", id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto mt-10">
        <div className="flex justify-between mb-6">
          <button
            onClick={() => window.location.href = '/admin/registros'}
            className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-indigo-800 transition-all"
          >
            <ArrowLeft className="inline mr-2" /> Retornar a Admin
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-red-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-red-800 transition-all"
          >
            Cerrar sesión
          </button>
        </div>
        <section className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700">Registrar Aspirante a Guía Mayor</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre completo" className="border p-2 rounded-xl" />
            <input name="edad" value={form.edad} onChange={handleChange} placeholder="Edad" className="border p-2 rounded-xl" type="number" />
            <input name="nacimiento" value={form.nacimiento} onChange={handleChange} placeholder="Fecha de nacimiento" className="border p-2 rounded-xl" type="date" />
            <input name="sexo" value={form.sexo} onChange={handleChange} placeholder="Sexo" className="border p-2 rounded-xl" />
            <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className="border p-2 rounded-xl" />
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="border p-2 rounded-xl" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="border p-2 rounded-xl" type="email" />
            <input name="iglesia" value={form.iglesia} onChange={handleChange} placeholder="Iglesia local" className="border p-2 rounded-xl" />
            <input name="distrito" value={form.distrito} onChange={handleChange} placeholder="Distrito" className="border p-2 rounded-xl" />
            <input name="asociacion" value={form.asociacion} onChange={handleChange} placeholder="Asociación / Misión" className="border p-2 rounded-xl" />
            <input name="pastor" value={form.pastor} onChange={handleChange} placeholder="Pastor" className="border p-2 rounded-xl" />
            <input name="director" value={form.director} onChange={handleChange} placeholder="Director de conquistadores" className="border p-2 rounded-xl" />
            <input name="club" value={form.club} onChange={handleChange} placeholder="Club" className="border p-2 rounded-xl" />
            <input name="anioIngreso" value={form.anioIngreso} onChange={handleChange} placeholder="Año de ingreso" className="border p-2 rounded-xl" type="number" />
            <select name="cargoActual" value={form.cargoActual} onChange={handleChange} className="border p-2 rounded-xl">
              <option value="">Cargo actual</option>
              <option value="Conquistador">Conquistador</option>
              <option value="Consejero">Consejero</option>
              <option value="Instructor">Instructor</option>
            </select>
            <input name="unidad" value={form.unidad} onChange={handleChange} placeholder="Unidad" className="border p-2 rounded-xl" />
            <input name="aniosClub" value={form.aniosClub} onChange={handleChange} placeholder="Años en el club" className="border p-2 rounded-xl" type="number" />
          </form>
          <button
            onClick={handleSave}
            className="bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-900 transition-all"
            disabled={loading}
          >
            {editId ? "Actualizar Aspirante" : "Guardar Aspirante"}
          </button>
          {/* Lista de aspirantes registrados */}
          <div className="mt-10">
            <h2 className="font-bold mb-4 text-indigo-700">Aspirantes Registrados</h2>
            <ul className="space-y-3">
              {aspirantes.map(a => (
                <li key={a.id} className="bg-indigo-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 border border-indigo-200">
                  <div className="flex-1">
                    <span className="font-bold text-indigo-800">{a.nombre}</span><br />
                    <span className="text-xs text-slate-400">Edad: {a.edad}</span><br />
                    <span className="text-xs text-slate-400">Club: {a.club}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-mono">PIN: {a.pin}</span>
                    <a
                      href={`https://wa.me/${a.telefono}?text=Hola%20${encodeURIComponent(a.nombre)}%2C%20tu%20PIN%20de%20acceso%20es%20${a.pin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-800 transition-all"
                    >
                      Enviar PIN por WhatsApp
                    </a>
                    <button
                      onClick={() => handleEdit(a)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-yellow-700 transition-all"
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-800 transition-all"
                    >Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      {/* Render de actividades agrupadas por sección */}
      {actividades && actividades.length > 0 && (
        <div className="mt-8">
          {/* Calcular progreso */}
          <h3 className="font-bold text-indigo-700 mb-4">Actividades Guía Mayor</h3>
          {/* Progreso visual */}
          <div className="mb-4">
            {/* Progreso solo de la sección actual (Desarrollo Espiritual) */}
            {(() => {
              // Buscar primer grupo (Desarrollo Espiritual)
              const primerGrupo = tarjetaGuiaMayor[0];
              const actividadesSeccion = primerGrupo.actividades.map(act => {
                const index = actividades.findIndex(a => a.nombre === act);
                return actividades[index];
              });
              const completadas = actividadesSeccion.filter(a => a && a.completado).length;
              return (
                <span className="font-bold text-green-700">Progreso: {completadas} / {actividadesSeccion.length} requisitos</span>
              );
            })()}
          </div>
          {tarjetaGuiaMayor.map((grupo, idxGrupo) => {
            // Filtrar actividades por sección
            const actividadesSeccion = grupo.actividades.map(act => {
              // Buscar la actividad en el array plano
              const index = actividades.findIndex(a => a.nombre === act);
              return { ...actividades[index], index };
            });
            // Calcular progreso de la sección
            const completadas = actividadesSeccion.filter(a => a && a.completado).length;
            return (
              <div key={idxGrupo} className="mb-6">
                <h4 className="text-lg font-semibold text-indigo-600 mb-2">{grupo.seccion}</h4>
                <div className="mb-2">
                  <span className="font-bold text-green-700">Progreso: {completadas} / {actividadesSeccion.length} requisitos</span>
                </div>
                {actividadesSeccion.map((a, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <input
                      type="checkbox"
                      checked={a.completado}
                      onChange={e => {
                        if (e.target.checked && !a.firma) {
                          setFirmaIndex(a.index);
                        } else {
                          actualizarActividad(a.index, e.target.checked);
                        }
                      }}
                    />
                    <span>{a.nombre}</span>
                    {a.completado && (
                      <span className="text-xs text-gray-500 ml-2">
                        ✔ {a.fecha} - {a.evaluador}
                        {a.firma ? (
                          <a href={a.firma} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Ver firma</a>
                        ) : null}
                      </span>
                    )}
                    {firmaIndex === a.index && (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-sm text-indigo-700 font-semibold">Firma digital: usa tu dedo o mouse para firmar y validar la actividad.</span>
                        <FirmaDigital
                          onSave={async (firmaBase64: string) => {
                            const urlFirma = await guardarFirma(firmaBase64, aspiranteId, a.index);
                            const nuevas = [...actividades];
                            nuevas[a.index] = {
                              ...nuevas[a.index],
                              completado: true,
                              evaluador: evaluador,
                              fecha: new Date().toLocaleDateString(),
                              hora: new Date().toLocaleTimeString(),
                              firma: urlFirma
                            };
                            setFirmaIndex(null);
                            setActividades(nuevas);
                            const ref = doc(db, "tarjetaGuiaMayor", aspiranteId);
                            await updateDoc(ref, {
                              actividades: nuevas
                            });
                          }}
                        />
                      </div>
                    )}
                    {a.firma && (
                      <img src={a.firma} width={120} className="mt-2" />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
 );
};

export default AspirantePage;
