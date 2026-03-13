import { useMiembros } from "@/src/hooks/useMiembros";
import { useEventos } from "@/src/hooks/useEventos";
import { useUnidades } from "@/src/hooks/useUnidades";
import { LogOut, Users, Calendar, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DirectorDashboard() {
  const { miembros } = useMiembros();
  const { eventos } = useEventos();
  const { unidades } = useUnidades();
  const router = useRouter();
  const [info, setInfo] = useState<string | null>(null);

  const handleLogout = () => {
    router.push("/");
  };

  const handleInfo = (type: string) => {
    if (type === "miembros") {
      setInfo(`Total miembros: ${miembros.length}\n\n` + miembros.map(m => `${m.nombre || m.nombres || m.displayName || "Sin nombre"}${m.edad ? " (Edad: " + m.edad + ")" : ""}`).join("\n"));
    } else if (type === "unidades") {
      setInfo(`Total unidades: ${unidades.length}\n\n` + unidades.map(u => `${u.nombre || u.displayName || "Sin nombre"}`).join("\n"));
    } else if (type === "eventos") {
      setInfo(`Total eventos: ${eventos.length}\n\n` + eventos.map(e => `${e.nombre || e.titulo || "Sin nombre"}${e.fecha ? " (Fecha: " + e.fecha + ")" : ""}${e.lugar ? " (Lugar: " + e.lugar + ")" : ""}`).join("\n"));
    } else {
      setInfo(null);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 min-h-screen bg-linear-to-br from-fuchsia-100 via-white to-indigo-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-fuchsia-700 text-center sm:text-left">Panel del Director</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-fuchsia-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-fuchsia-900 transition-all"
        >
          <LogOut className="w-5 h-5" /> Cerrar sesión
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        <div
          className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center border border-fuchsia-200 cursor-pointer hover:bg-fuchsia-50 transition-all min-w-0 w-full"
          onClick={() => handleInfo("miembros")}
        >
          <Users className="w-8 sm:w-10 h-8 sm:h-10 text-fuchsia-700 mb-2" />
          <h2 className="text-base sm:text-lg font-semibold text-fuchsia-700">Miembros</h2>
          <p className="text-2xl sm:text-4xl font-bold text-fuchsia-900 mt-2">{miembros.length}</p>
        </div>
        <div
          className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center border border-indigo-200 cursor-pointer hover:bg-indigo-50 transition-all min-w-0 w-full"
          onClick={() => handleInfo("unidades")}
        >
          <Layers className="w-8 sm:w-10 h-8 sm:h-10 text-indigo-700 mb-2" />
          <h2 className="text-base sm:text-lg font-semibold text-indigo-700">Unidades</h2>
          <p className="text-2xl sm:text-4xl font-bold text-indigo-900 mt-2">{unidades.length}</p>
        </div>
        <div
          className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center border border-blue-200 cursor-pointer hover:bg-blue-50 transition-all min-w-0 w-full"
          onClick={() => handleInfo("eventos")}
        >
          <Calendar className="w-8 sm:w-10 h-8 sm:h-10 text-blue-700 mb-2" />
          <h2 className="text-base sm:text-lg font-semibold text-blue-700">Eventos</h2>
          <p className="text-2xl sm:text-4xl font-bold text-blue-900 mt-2">{eventos.length}</p>
        </div>
      </div>
      {info && (
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-8 border border-fuchsia-100 overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-4">
            <h3 className="text-lg sm:text-xl font-bold text-fuchsia-700">Información Detallada</h3>
            <button
              onClick={() => setInfo(null)}
              className="bg-fuchsia-700 text-white px-3 py-1 rounded font-bold hover:bg-fuchsia-900 transition-all"
            >Cerrar</button>
          </div>
          <pre className="text-slate-700 whitespace-pre-wrap text-xs sm:text-sm md:text-base">{info}</pre>
        </div>
      )}
    </div>
  );
}
