"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/src/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Firestore collection reference
const unidadesRef = collection(db, 'unidades');

function UnidadesPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', banderin: '' });
  const [unidades, setUnidades] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  // Cargar unidades desde Firestore
  const cargarUnidades = async () => {
    const querySnapshot = await getDocs(unidadesRef);
    const lista = querySnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      banderin: doc.data().banderin || ''
    }));
    setUnidades(lista);
  };

  useEffect(() => {
    cargarUnidades();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editId) {
      // Actualizar unidad
      await updateDoc(doc(unidadesRef, editId), {
        nombre: form.nombre,
        banderin: form.banderin
      });
      setEditId(null);
    } else {
      // Agregar nueva unidad
      await addDoc(unidadesRef, {
        nombre: form.nombre,
        banderin: form.banderin
      });
    }
    setForm({ nombre: '', banderin: '' });
    cargarUnidades();
  };

  const handleEdit = (unidad: { id: string; nombre: string; banderin: string }) => {
    setForm({ nombre: unidad.nombre, banderin: unidad.banderin });
    setEditId(unidad.id);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(unidadesRef, id));
    setUnidades(unidades.filter(u => u.id !== id));
    if (editId === id) {
      setEditId(null);
      setForm({ nombre: '', banderin: '' });
    }
    cargarUnidades();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12">
      <div className="w-full max-w-2xl flex justify-end mb-4">
        <button
          onClick={() => router.push('/admin')}
          className="bg-slate-200 hover:bg-purple-100 text-purple-700 font-semibold px-6 py-2 rounded-full shadow transition"
        >
          Regresar al menú
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center mb-8">
        <h2 className="text-3xl font-bold text-purple-700 mb-6">Registrar Unidad</h2>
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre de la unidad" className="w-full p-2 rounded border" required />
          <input name="banderin" value={form.banderin} onChange={handleChange} placeholder="Banderín (URL o descripción)" className="w-full p-2 rounded border" />
          <button type="submit" className="bg-purple-700 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-purple-900 transition">
            {editId ? 'Actualizar' : 'Guardar'}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl flex flex-col items-center">
        <h3 className="text-2xl font-bold text-purple-700 mb-4">Unidades Registradas</h3>
        <ul className="w-full divide-y divide-gray-200">
          {unidades.map((unidad) => (
            <li key={unidad.id} className="py-3 px-2 flex flex-col md:flex-row md:items-center md:justify-between">
              <span className="font-semibold text-purple-800">{unidad.nombre}</span>
              <span className="text-gray-600">Banderín: {unidad.banderin}</span>
              <div className="flex gap-2 mt-2 md:mt-0">
                <button onClick={() => handleEdit(unidad)} className="bg-yellow-400 text-white px-3 py-1 rounded-full font-semibold shadow hover:bg-yellow-600 transition">Editar</button>
                <button onClick={() => handleDelete(unidad.id)} className="bg-red-500 text-white px-3 py-1 rounded-full font-semibold shadow hover:bg-red-700 transition">Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UnidadesPage;
