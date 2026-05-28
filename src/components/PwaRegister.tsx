"use client";

import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { esDispositivoIos } from "@/src/lib/navegacion";

function esIosSinInstalar(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone);
  return ios && !standalone;
}

export default function PwaRegister() {
  const [mostrarAyudaIos, setMostrarAyudaIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone);

    // En Safari iPhone sin instalar, el SW a veces deja la app en blanco o sin red; solo en PWA instalada.
    const registrarSw = "serviceWorker" in navigator && (!esDispositivoIos() || standalone);
    if (registrarSw) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* SW opcional en dev sin HTTPS */
        });
    }

    setMostrarAyudaIos(esIosSinInstalar());
  }, []);

  if (!mostrarAyudaIos) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-white/20 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md sm:left-auto sm:right-4"
      role="status"
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-bold">
        <Share size={18} className="shrink-0 text-indigo-300" />
        Instalar en tu iPhone
      </p>
      <p className="text-xs leading-relaxed text-slate-300">
        Toca <span className="font-semibold text-white">Compartir</span> y luego{" "}
        <span className="font-semibold text-white">Añadir a pantalla de inicio</span>. El icono
        será el logo del club.
      </p>
      <button
        type="button"
        onClick={() => setMostrarAyudaIos(false)}
        className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold hover:bg-white/20"
      >
        Entendido
      </button>
    </div>
  );
}
