"use client";
import { useRouter } from 'next/navigation';
import RegistroConquistador from '../../../src/RegistroConquistador';

const MiembrosPage = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12">
      <button
        onClick={() => router.push('/admin')}
        className="mb-8 px-6 py-2 rounded-full bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition"
        style={{ alignSelf: 'flex-start' }}
      >
        ← Regresar al menú
      </button>
      <RegistroConquistador />
    </div>
  );
};

export default MiembrosPage;
