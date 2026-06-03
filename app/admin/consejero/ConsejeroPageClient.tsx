"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db } from '../../../src/firebase';
import { collection, addDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { handleError } from '@/src/lib/errorHandler';
import {
  cargarPinsOcupadosClub,
  crearPinEnSet,
  generarPinUnicoClub,
} from '@/src/lib/pinUnico';

type ConsejeroPageClientProps = {
  initialUnidadesRegistradas?: string[];
};

const clasesOficiales = [
  { nombre: "Amigo", edad: "10" },
  { nombre: "Compañero", edad: "11" },
  { nombre: "Explorador", edad: "12" },
  { nombre: "Pionero", edad: "13" },
  { nombre: "Excursionista", edad: "14" },
  { nombre: "Guía", edad: "15" }
];

export default function ConsejeroPage({ initialUnidadesRegistradas }: ConsejeroPageClientProps) {
  const [editarDocIdDesdeUrl, setEditarDocIdDesdeUrl] = useState<string | null>(null);
  const [editarAsociadoDesdeUrl, setEditarAsociadoDesdeUrl] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    nacimiento: '',
    unidades: [] as string[],
    consejeroAsociado: '',
    asociadoNacimiento: '',
  });
  const [unidadesRegistradas, setUnidadesRegistradas] = useState<string[]>(initialUnidadesRegistradas ?? []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditarDocIdDesdeUrl(params.get("editar"));
    setEditarAsociadoDesdeUrl(params.get("asociado") === "1");
  }, []);

  useEffect(() => {
    if (initialUnidadesRegistradas) return;
    import('firebase/firestore').then(({ getDocs, collection }) => {
      getDocs(collection(db, 'unidades')).then(snapshot => {
        setUnidadesRegistradas(snapshot.docs.map(doc => doc.data().nombre));
      });
    });
  }, [initialUnidadesRegistradas]);
  const [refresh, setRefresh] = useState(0);

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
    try {
      const pin = await generarPinUnicoClub();
      await addDoc(collection(db, 'consejeros'), {
        nombre: form.nombre.trim(),
        nacimiento: form.nacimiento.trim(),
        unidades: form.unidades,
        consejeroAsociado: form.consejeroAsociado.trim(),
        asociadoNacimiento: form.asociadoNacimiento.trim(),
        pin,
        puedeCalificar: false,
      });
      toast.success(`Consejero registrado. PIN de acceso: ${pin}`);
      setForm({ nombre: '', nacimiento: '', unidades: [], consejeroAsociado: '', asociadoNacimiento: '' });
      setRefresh(r => r + 1);
    } catch (error) {
      handleError(error, 'Error al registrar en Firebase');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center mx-auto mt-12">
      <button
        onClick={() => window.location.href = '/admin/registros'}
        className="mb-4 bg-green-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-green-900 transition self-start"
      >
        Regresar al menú principal
      </button>
      <h2 className="text-3xl font-bold text-green-700 mb-6">Registro de Consejero</h2>
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre del consejero"
          className="w-full p-2 rounded border"
          required
        />
        <input
          id="campo-nacimiento"
          name="nacimiento"
          type="date"
          value={form.nacimiento}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          title="Fecha de nacimiento del consejero"
        />
        <input
          name="consejeroAsociado"
          value={form.consejeroAsociado}
          onChange={handleChange}
          placeholder="Consejero asociado"
          className="w-full p-2 rounded border"
        />
        <input
          id="campo-nacimiento-asociado"
          name="asociadoNacimiento"
          type="date"
          value={form.asociadoNacimiento}
          onChange={handleChange}
          className="w-full p-2 rounded border"
          title="Fecha de nacimiento del consejero asociado"
        />
        <div className="mb-4">
          <label className="block font-semibold mb-2 text-green-700">Unidades que puede asesorar:</label>
          <div className="flex flex-wrap gap-2">
            {unidadesRegistradas.map((unidad) => (
              <label key={unidad} className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.unidades.includes(unidad)}
                  onChange={() => handleUnidadToggle(unidad)}
                  className="accent-green-600"
                />
                <span className="text-green-700 font-medium">{unidad}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="text-xs text-green-800">
          El PIN de 4 dígitos se genera automáticamente al guardar (inicio de sesión en la página principal).
        </p>
        <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-green-900 transition">
          Guardar
        </button>
      </form>

      <div className="mt-8 w-full">
        <h3 className="text-xl font-bold text-green-700 mb-4">Consejeros Registrados</h3>
        <ConsejerosList
          refresh={refresh}
          unidadesRegistradas={unidadesRegistradas}
          editarDocIdDesdeUrl={editarDocIdDesdeUrl}
          editarAsociadoDesdeUrl={editarAsociadoDesdeUrl}
        />
      </div>
    </div>
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
  const [consejeros, setConsejeros] = useState<Consejero[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const editarDesdeUrlAplicado = React.useRef(false);
  const [editForm, setEditForm] = useState<{
    nombre: string;
    nacimiento: string;
    unidades: string[];
    consejeroAsociado: string;
    asociadoNacimiento: string;
  }>({ nombre: '', nacimiento: '', unidades: [], consejeroAsociado: '', asociadoNacimiento: '' });

  useEffect(() => {
    const fetchConsejeros = async () => {
      const querySnapshot = await getDocs(collection(db, 'consejeros'));
      const pinsOcupados = await cargarPinsOcupadosClub();
      const lista: Consejero[] = [];
      let pinsAsignados = 0;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Omit<Consejero, 'id'>;
        let pin = String(data.pin ?? '').trim();
        if (!pin) {
          pin = crearPinEnSet(pinsOcupados);
          pinsOcupados.add(pin);
          await updateDoc(doc(db, 'consejeros', docSnap.id), { pin });
          pinsAsignados++;
        } else if (pinsOcupados.has(pin)) {
          pin = crearPinEnSet(pinsOcupados);
          pinsOcupados.add(pin);
          await updateDoc(doc(db, 'consejeros', docSnap.id), { pin });
          pinsAsignados++;
        } else {
          pinsOcupados.add(pin);
        }
        lista.push({ id: docSnap.id, ...data, pin });
      }

      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setConsejeros(lista);
      if (pinsAsignados > 0) {
        toast.success(
          `PIN único asignado o corregido en ${pinsAsignados} consejero(s) (sin duplicados en el club).`
        );
      }
    };
    fetchConsejeros();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este consejero?')) return;
    try {
      await import('firebase/firestore').then(({ doc, deleteDoc }) =>
        deleteDoc(doc(db, 'consejeros', id))
      );
      setConsejeros(consejeros.filter(c => c.id !== id));
      toast.success('Consejero eliminado');
    } catch (error) {
      handleError(error, 'Error al eliminar');
    }
  };

  const handleEdit = (c: Consejero) => {
    setEditId(c.id || null);
    setEditForm({
      nombre: c.nombre,
      nacimiento: c.nacimiento || '',
      unidades: c.unidades,
      consejeroAsociado: c.consejeroAsociado || '',
      asociadoNacimiento: c.asociadoNacimiento || '',
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
    const activar = c.puedeCalificar !== true;
    try {
      await updateDoc(doc(db, 'consejeros', c.id), { puedeCalificar: activar });
      setConsejeros((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, puedeCalificar: activar } : x))
      );
      toast.success(
        activar
          ? `${c.nombre} puede calificar conquistadores y aspirantes.`
          : `Calificación desactivada para ${c.nombre}. Solo admin asigna puntos.`
      );
    } catch (error) {
      handleError(error, 'No se pudo actualizar el permiso de calificar');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await updateDoc(doc(db, 'consejeros', editId), {
        nombre: editForm.nombre.trim(),
        nacimiento: editForm.nacimiento.trim(),
        unidades: editForm.unidades,
        consejeroAsociado: editForm.consejeroAsociado.trim(),
        asociadoNacimiento: editForm.asociadoNacimiento.trim(),
      });
      setEditId(null);
      setEditForm({
        nombre: '',
        nacimiento: '',
        unidades: [],
        consejeroAsociado: '',
        asociadoNacimiento: '',
      });
      setConsejeros(
        consejeros.map((c) =>
          c.id === editId ? { ...c, ...editForm, pin: c.pin } : c
        )
      );
      toast.success('Consejero actualizado.');
    } catch (error) {
      handleError(error, 'Error al editar');
    }
  };

  if (consejeros.length === 0) return <div className="text-gray-500">No hay consejeros registrados.</div>;

  return (
    <ul className="space-y-3">
      {consejeros.map((c) => (
        <li key={c.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
          {editId === c.id ? (
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <input
                name="nombre"
                value={editForm.nombre}
                onChange={handleEditChange}
                className="w-full p-2 rounded border"
                required
              />
              <input
                id="campo-nacimiento"
                name="nacimiento"
                type="date"
                value={editForm.nacimiento}
                onChange={handleEditChange}
                className="w-full p-2 rounded border"
              />
              <input
                name="consejeroAsociado"
                value={editForm.consejeroAsociado}
                onChange={handleEditChange}
                placeholder="Consejero asociado"
                className="w-full p-2 rounded border"
              />
              <input
                id="campo-nacimiento-asociado"
                name="asociadoNacimiento"
                type="date"
                value={editForm.asociadoNacimiento}
                onChange={handleEditChange}
                className="w-full p-2 rounded border"
                title="Nacimiento del asociado"
              />
              <div>
                <label className="block font-semibold mb-2 text-green-700">Unidades:</label>
                <div className="flex flex-wrap gap-2">
                  {unidadesRegistradas.map((unidad) => (
                    <label key={unidad} className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.unidades.includes(unidad)}
                        onChange={() => handleEditUnidadToggle(unidad)}
                        className="accent-green-600"
                      />
                      <span className="text-green-700 font-medium">{unidad}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-700 text-white px-4 py-1 rounded-full font-semibold shadow hover:bg-green-900 transition">Guardar</button>
                <button type="button" onClick={() => setEditId(null)} className="bg-gray-400 text-white px-4 py-1 rounded-full font-semibold shadow hover:bg-gray-600 transition">Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <div className="font-bold text-green-700">{c.nombre}</div>
              <div className="mt-2 text-green-800 text-sm">Unidades: {Array.isArray(c.unidades) ? c.unidades.join(', ') : ''}</div>
              <div className="mt-2 text-green-800 text-sm">Consejero asociado: {c.consejeroAsociado || 'Sin asignar'}</div>
              <div className="mt-2 rounded-lg bg-green-100 px-2 py-1 text-sm font-mono font-bold text-green-900">
                PIN: {c.pin || '…'}
              </div>
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3">
                <p className="mb-2 text-xs font-semibold text-blue-900">
                  Permiso para calificar (puntos a conquistadores y aspirantes)
                </p>
                <button
                  type="button"
                  onClick={() => togglePuedeCalificar(c)}
                  className={`w-full rounded-full px-4 py-2 text-sm font-bold shadow transition ${
                    c.puedeCalificar === true
                      ? 'bg-blue-700 text-white hover:bg-blue-800'
                      : 'bg-white text-blue-800 ring-2 ring-blue-300 hover:bg-blue-100'
                  }`}
                >
                  {c.puedeCalificar === true
                    ? 'Calificar: ACTIVADO — clic para desactivar'
                    : 'Calificar: desactivado — clic para autorizar'}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => handleEdit(c)} className="bg-yellow-500 text-white px-3 py-1 rounded-full font-semibold shadow hover:bg-yellow-700 transition">Editar</button>
                <button onClick={() => handleDelete(c.id!)} className="bg-red-600 text-white px-3 py-1 rounded-full font-semibold shadow hover:bg-red-800 transition">Eliminar</button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
