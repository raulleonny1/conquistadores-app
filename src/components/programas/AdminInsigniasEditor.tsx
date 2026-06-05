"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import { Award, ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";
import BotonNotificarPadres from "@/src/components/padres/BotonNotificarPadres";
import { mensajePadresPromocion } from "@/src/utils/mensajesPadres";

type InsigniaItem = {
  id: string;
  nombre: string;
  area: string;
  completada: boolean;
};

type AdminInsigniasEditorProps = {
  coleccion: "aventureros" | "jovenesJA";
  miembroId: string;
  nombreMiembro: string;
  clase: string;
  insignias: Record<string, boolean>;
  insigniasLista: InsigniaItem[];
  puedePromover: boolean;
  siguienteClase: string | null;
  onPromover: (nuevaClase: string) => Promise<void>;
  onUpdated: () => void;
  tema?: "amber" | "violet";
  whatsapp?: string;
  clubNombre?: string;
  clubSlug?: string;
  miembroPin?: string;
};

export default function AdminInsigniasEditor({
  coleccion,
  miembroId,
  nombreMiembro,
  clase,
  insignias,
  insigniasLista,
  puedePromover,
  siguienteClase,
  onPromover,
  onUpdated,
  tema = "amber",
  whatsapp = "",
  clubNombre = "",
  clubSlug = "",
  miembroPin = "",
}: AdminInsigniasEditorProps) {
  const [clasePromovida, setClasePromovida] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, boolean>>(insignias);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setLocal(insignias);
  }, [insignias, miembroId]);

  const toggle = (id: string) => {
    setLocal((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const promover = async (nuevaClase: string) => {
    await onPromover(nuevaClase);
    setClasePromovida(nuevaClase);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, coleccion, miembroId), { insignias: local });
      toast.success("Insignias actualizadas.");
      onUpdated();
    } catch {
      toast.error("No se pudieron guardar las insignias.");
    }
    setGuardando(false);
  };

  const colorBtn = tema === "violet" ? "bg-violet-600 hover:bg-violet-700" : "bg-amber-600 hover:bg-amber-700";

  return (
    <div className={`rounded-2xl border p-5 ${tema === "violet" ? "border-violet-200 bg-violet-50/50" : "border-amber-200 bg-amber-50/50"}`}>
      <h3 className="mb-1 flex items-center gap-2 font-bold text-slate-800">
        <Award className="h-5 w-5" />
        Insignias — {nombreMiembro}
      </h3>
      <p className="mb-4 text-sm text-slate-500">Clase: {clase}</p>

      {insigniasLista.length === 0 ? (
        <p className="text-sm text-slate-500">Sin catálogo para esta clase.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {insigniasLista.map((ins) => (
            <li key={ins.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={local[ins.id] === true}
                  onChange={() => toggle(ins.id)}
                  className="h-4 w-4 rounded accent-amber-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{ins.nombre}</p>
                  <p className="text-xs text-slate-500">{ins.area}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${colorBtn}`}
        >
          {guardando ? "Guardando…" : "Guardar insignias"}
        </button>
        {puedePromover && siguienteClase && (
          <button
            type="button"
            onClick={() => promover(siguienteClase)}
            className="flex items-center gap-1 rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
          >
            <ChevronUp className="h-4 w-4" />
            Promover a {siguienteClase}
          </button>
        )}
      </div>

      {clasePromovida && whatsapp && clubSlug && (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="mb-2 text-sm text-sky-900">¿Notificar a los padres por WhatsApp?</p>
          <BotonNotificarPadres
            whatsapp={whatsapp}
            mensaje={mensajePadresPromocion({
              nombreHijo: nombreMiembro,
              clubNombre: clubNombre || clubSlug,
              claseAnterior: clase,
              claseNueva: clasePromovida,
              clubSlug,
              pin: miembroPin,
            })}
            label="Avisar promoción por WhatsApp"
          />
        </div>
      )}
    </div>
  );
}
