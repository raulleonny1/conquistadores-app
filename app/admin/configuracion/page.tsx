
"use client";
import React, { useState } from 'react';
import { db } from "../../../src/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import {
  Settings, Users, ShieldCheck, RefreshCcw, ArrowLeft, Search, UserCog, ChevronRight, History
} from 'lucide-react';

const ConfigSection = ({ title, subtitle, icon: Icon, colorClass, children, actionLabel, onAction }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 transition-all hover:shadow-md">
    <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {actionLabel && (
        <button 
          onClick={onAction}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${colorClass.replace('bg-', 'border-').replace('600', '200')} ${colorClass.replace('bg-', 'text-')} hover:bg-slate-50`}
        >
          <RefreshCcw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
    <div className="p-0">
      {children}
    </div>
  </div>
);

const UserTable = ({ users, typeLabel, onReset }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50">
          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del {typeLabel}</th>
          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">PIN Actual</th>
          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {user.nombre.charAt(0)}
                </div>
                <span className="font-medium text-slate-700">{user.nombre}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-center">
              <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-slate-600">
                {user.pin}
              </code>
            </td>
            <td className="px-6 py-4 text-right">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center gap-1 group"
                onClick={() => onReset(user.id, user.nombre)}
              >
                Resetear PIN
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function ConfiguracionAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [consejeros, setConsejeros] = useState([]);
  const [conquistadores, setConquistadores] = useState([]);
  const [loadingConsejeros, setLoadingConsejeros] = useState(false);
  const [loadingConquistadores, setLoadingConquistadores] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar consejeros
  React.useEffect(() => {
    async function fetchConsejeros() {
      setLoadingConsejeros(true);
      const snapshot = await getDocs(collection(db, "consejeros"));
      setConsejeros(snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
      setLoadingConsejeros(false);
    }
    fetchConsejeros();
  }, []);

  // Cargar conquistadores
  React.useEffect(() => {
    async function fetchConquistadores() {
      setLoadingConquistadores(true);
      const snapshot = await getDocs(collection(db, "RegistroConquis"));
      setConquistadores(snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
      setLoadingConquistadores(false);
    }
    fetchConquistadores();
  }, []);

  // Resetear todos los pines de consejeros
  const handleResetPinsConsejeros = async () => {
    setError('');
    setSuccess('');
    setLoadingConsejeros(true);
    try {
      const snapshot = await getDocs(collection(db, "consejeros"));
      for (const docSnap of snapshot.docs) {
        const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
        await updateDoc(doc(db, "consejeros", docSnap.id), { pin: nuevoPin });
      }
      setSuccess('¡PINs de consejeros reseteados correctamente!');
      const refreshed = await getDocs(collection(db, "consejeros"));
      setConsejeros(refreshed.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
    } catch (err) {
      setError('Error al resetear los PINs de consejeros. Intenta de nuevo.');
    }
    setLoadingConsejeros(false);
  };

  // Resetear pin individual de consejero
  const handleResetPinIndividualConsejero = async (id, nombre) => {
    setError('');
    setSuccess('');
    setLoadingConsejeros(true);
    try {
      const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(db, "consejeros", id), { pin: nuevoPin });
      setSuccess(`PIN de consejero ${nombre} reseteado correctamente`);
      const refreshed = await getDocs(collection(db, "consejeros"));
      setConsejeros(refreshed.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
    } catch (err) {
      setError('Error al resetear el PIN de consejero. Intenta de nuevo.');
    }
    setLoadingConsejeros(false);
  };

  // Resetear todos los pines de conquistadores
  const handleResetPinsConquistadores = async () => {
    setError('');
    setSuccess('');
    setLoadingConquistadores(true);
    try {
      const snapshot = await getDocs(collection(db, "RegistroConquis"));
      for (const docSnap of snapshot.docs) {
        const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
        await updateDoc(doc(db, "RegistroConquis", docSnap.id), { pin: nuevoPin });
      }
      setSuccess('¡PINs de conquistadores reseteados correctamente!');
      const refreshed = await getDocs(collection(db, "RegistroConquis"));
      setConquistadores(refreshed.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
    } catch (err) {
      setError('Error al resetear los PINs de conquistadores. Intenta de nuevo.');
    }
    setLoadingConquistadores(false);
  };

  // Resetear pin individual de conquistador
  const handleResetPinIndividualConquistador = async (id, nombre) => {
    setError('');
    setSuccess('');
    setLoadingConquistadores(true);
    try {
      const nuevoPin = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(db, "RegistroConquis", id), { pin: nuevoPin });
      setSuccess(`PIN de conquistador ${nombre} reseteado correctamente`);
      const refreshed = await getDocs(collection(db, "RegistroConquis"));
      setConquistadores(refreshed.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.id,
        pin: docSnap.data().pin || ""
      })));
    } catch (err) {
      setError('Error al resetear el PIN de conquistador. Intenta de nuevo.');
    }
    setLoadingConquistadores(false);
  };

  // Filtrado
  const filteredConsejeros = consejeros.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredConquistadores = conquistadores.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header de Navegación */}
        <div className="flex items-center justify-between mb-8">
          <button className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium" onClick={() => window.location.href = '/admin'}>
            <div className="p-2 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Volver al Menú Principal
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Panel de Administración
          </div>
        </div>

        {/* Título Principal */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 justify-center md:justify-start">
            <Settings className="w-8 h-8 text-indigo-600" />
            Configuración
          </h1>
          <p className="text-slate-500 mt-2">
            Gestiona la seguridad y los parámetros generales del Club de Conquistadores.
          </p>
        </div>

        {/* Buscador Rápido */}
        <div className="relative mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar consejero o conquistador..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sección Consejeros */}
        <ConfigSection 
          title="Gestión de Consejeros"
          subtitle="Genera nuevos PINs aleatorios o resetea accesos individuales."
          icon={UserCog}
          colorClass="bg-pink-600"
          actionLabel={loadingConsejeros ? 'Reseteando...' : 'Resetear TODOS los PINs'}
          onAction={handleResetPinsConsejeros}
        >
          <UserTable users={filteredConsejeros} typeLabel="Consejero" onReset={handleResetPinIndividualConsejero} />
        </ConfigSection>

        {/* Sección Conquistadores */}
        <ConfigSection 
          title="Gestión de Conquistadores"
          subtitle="Administra los códigos de acceso para los miembros del club."
          icon={Users}
          colorClass="bg-emerald-600"
          actionLabel={loadingConquistadores ? 'Reseteando...' : 'Resetear TODOS los PINs'}
          onAction={handleResetPinsConquistadores}
        >
          <UserTable users={filteredConquistadores} typeLabel="Conquistador" onReset={handleResetPinIndividualConquistador} />
        </ConfigSection>

        {/* Footer Informativo */}
        <div className="mt-12 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
          <History className="w-6 h-6 text-indigo-500 mt-1" />
          <div>
            <h4 className="font-bold text-indigo-900">Historial de Cambios</h4>
            <p className="text-sm text-indigo-700/80 leading-relaxed">
              Todos los cambios de PIN quedan registrados en la bitácora de auditoría. 
              Asegúrate de comunicar los nuevos códigos de forma segura a cada usuario.
            </p>
          </div>
        </div>
        {error && <div className="text-red-600 font-bold mt-4">{error}</div>}
        {success && <div className="text-green-600 font-bold mt-4">{success}</div>}
      </div>
    </div>
  );
}
