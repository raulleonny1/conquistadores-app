"use client";
import { useRouter } from "next/navigation";

export default function RegistrosPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto bg-white border-l-4 border-teal-500 rounded-xl shadow p-8 flex flex-col items-center mb-4">
        <h2 className="text-2xl font-bold text-teal-700 mb-6">Registros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
          <button onClick={() => router.push('/admin/RegistroConquis')} className="bg-blue-50 border border-blue-500 text-blue-600 rounded-xl p-6 font-bold shadow hover:bg-blue-100 transition-all text-lg">Registro Conquis</button>
          <button onClick={() => router.push('/admin/aventureros')} className="bg-amber-50 border border-amber-500 text-amber-700 rounded-xl p-6 font-bold shadow hover:bg-amber-100 transition-all text-lg">Registro Aventureros</button>
          <button onClick={() => router.push('/admin/ja')} className="bg-violet-50 border border-violet-500 text-violet-700 rounded-xl p-6 font-bold shadow hover:bg-violet-100 transition-all text-lg">Registro Jóvenes Adventistas</button>
          <button onClick={() => router.push('/admin/aspirante')} className="bg-orange-50 border border-orange-500 text-orange-600 rounded-xl p-6 font-bold shadow hover:bg-orange-100 transition-all text-lg">Aspirante a Guía Mayor</button>
          <button onClick={() => router.push('/admin/unidades')} className="bg-purple-50 border border-purple-500 text-purple-600 rounded-xl p-6 font-bold shadow hover:bg-purple-100 transition-all text-lg">Unidades</button>
          <button onClick={() => router.push('/admin/especialidades')} className="bg-amber-50 border border-amber-500 text-amber-600 rounded-xl p-6 font-bold shadow hover:bg-amber-100 transition-all text-lg">Registro de Especialidades</button>
          <button onClick={() => router.push('/admin/consejero')} className="bg-green-50 border border-green-500 text-green-600 rounded-xl p-6 font-bold shadow hover:bg-green-100 transition-all text-lg">Consejeros</button>
          <button
            onClick={() => router.push('/admin/registros/actividades-conquistadores')}
            className="bg-cyan-50 border border-cyan-500 text-cyan-700 rounded-xl p-6 font-bold shadow hover:bg-cyan-100 transition-all text-lg text-left"
          >
            Puntos actividades — Conquistadores
            <span className="mt-2 block text-sm font-normal text-cyan-800/90">
              Por persona o por unidad (toda la unidad de una vez)
            </span>
          </button>
          <button
            onClick={() => router.push('/admin/registros/actividades-aspirantes')}
            className="bg-rose-50 border border-rose-500 text-rose-700 rounded-xl p-6 font-bold shadow hover:bg-rose-100 transition-all text-lg text-left"
          >
            Puntos actividades — Aspirantes
            <span className="mt-2 block text-sm font-normal text-rose-800/90">
              Por persona o por asociación / misión (grupo completo)
            </span>
          </button>
          <button
            onClick={() => router.push('/admin/registros/actividades-consejeros')}
            className="bg-emerald-50 border border-emerald-600 text-emerald-800 rounded-xl p-6 font-bold shadow hover:bg-emerald-100 transition-all text-lg md:col-span-2"
          >
            Registro puntos consejeros y asociados
          </button>
          <button
            onClick={() => router.push('/admin/registros/actividades-aventureros')}
            className="bg-amber-50 border border-amber-500 text-amber-800 rounded-xl p-6 font-bold shadow hover:bg-amber-100 transition-all text-lg"
          >
            Puntos actividades — Aventureros
          </button>
          <button
            onClick={() => router.push('/admin/registros/actividades-ja')}
            className="bg-violet-50 border border-violet-500 text-violet-800 rounded-xl p-6 font-bold shadow hover:bg-violet-100 transition-all text-lg"
          >
            Puntos actividades — JA
          </button>
          <button
            onClick={() => router.push('/admin/rankin-aventureros')}
            className="bg-amber-50 border border-amber-600 text-amber-900 rounded-xl p-6 font-bold shadow hover:bg-amber-100 transition-all text-lg"
          >
            Ranking — Aventureros
          </button>
          <button
            onClick={() => router.push('/admin/rankin-ja')}
            className="bg-violet-50 border border-violet-600 text-violet-900 rounded-xl p-6 font-bold shadow hover:bg-violet-100 transition-all text-lg"
          >
            Ranking — JA
          </button>
          <button
            onClick={() => router.push('/admin/notificaciones-padres')}
            className="bg-sky-50 border border-sky-500 text-sky-800 rounded-xl p-6 font-bold shadow hover:bg-sky-100 transition-all text-lg md:col-span-2"
          >
            Notificaciones WhatsApp a padres
          </button>
        </div>
        <button onClick={() => router.push('/admin')} className="mt-4 bg-teal-600 text-white px-6 py-2 rounded font-bold shadow hover:bg-teal-800 transition">Regresar al menú</button>
      </div>
    </div>
  );
}
