"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db } from '../../../src/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { handleError } from '@/src/lib/errorHandler';

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
  const [form, setForm] = useState({
    nombre: '',
    unidades: [] as string[],
    consejeroAsociado: '',
  });
  const [unidadesRegistradas, setUnidadesRegistradas] = useState<string[]>(initialUnidadesRegistradas ?? []);
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
      await addDoc(collection(db, 'consejeros'), {
        nombre: form.nombre,
        unidades: form.unidades,
        consejeroAsociado: form.consejeroAsociado
      });
      toast.success('Consejero registrado en Firebase');
      setForm({ nombre: '', unidades: [], consejeroAsociado: '' });
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
          name="consejeroAsociado"
          value={form.consejeroAsociado}
          onChange={handleChange}
          placeholder="Consejero asociado"
          className="w-full p-2 rounded border"
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
        <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-green-900 transition">
          Guardar
        </button>
      </form>

      <div className="mt-8 w-full">
        <h3 className="text-xl font-bold text-green-700 mb-4">Consejeros Registrados</h3>
        <ConsejerosList refresh={refresh} unidadesRegistradas={unidadesRegistradas} />
      </div>
    </div>
  );
}

type Consejero = { id?: string; nombre: string; unidades: string[]; consejeroAsociado?: string; pin?: string };

function ConsejerosList({ refresh, unidadesRegistradas }: { refresh: number; unidadesRegistradas: string[] }) {
  const [consejeros, setConsejeros] = useState<Consejero[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; unidades: string[]; consejeroAsociado: string }>({ nombre: '', unidades: [], consejeroAsociado: '' });

  useEffect(() => {
    const fetchConsejeros = async () => {
      const querySnapshot = await getDocs(collection(db, 'consejeros'));
      setConsejeros(querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
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
    setEditForm({ nombre: c.nombre, unidades: c.unidades, consejeroAsociado: c.consejeroAsociado || '' });
  };

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

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await import('firebase/firestore').then(({ doc, updateDoc }) =>
        updateDoc(doc(db, 'consejeros', editId), {
          nombre: editForm.nombre,
          unidades: editForm.unidades,
          consejeroAsociado: editForm.consejeroAsociado
        })
      );
      setEditId(null);
      setEditForm({ nombre: '', unidades: [], consejeroAsociado: '' });
      // Refrescar lista
      setConsejeros(consejeros.map(c => c.id === editId ? { ...c, ...editForm } : c));
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
                name="consejeroAsociado"
                value={editForm.consejeroAsociado}
                onChange={handleEditChange}
                placeholder="Consejero asociado"
                className="w-full p-2 rounded border"
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
              {/* Mostrar el PIN si existe */}
              {c.pin && (
                <div className="mt-2 text-green-900 text-xs font-mono">PIN: {c.pin}</div>
              )}
              <div className="mt-2 flex gap-2">
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
