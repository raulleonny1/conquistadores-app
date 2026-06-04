"use client";

import React, { useCallback, useEffect, useState } from "react";
import { db } from "@/src/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { MinusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  aplicarRestaPuntos,
  type OrigenMovimientoPuntos,
} from "@/src/lib/actividadesCalificacion";
import { sumarPuntos } from "@/src/lib/categoriasPuntos";
import { MOTIVOS_RESTA_PUNTOS } from "@/src/lib/motivosRestaPuntos";

type QuitarPuntosPanelProps = {
  pin: string;
  nombre: string;
  origen: OrigenMovimientoPuntos;
  aplicadoPor?: string;
  onRestado?: () => void;
  className?: string;
};

function fechaHoyInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function QuitarPuntosPanel({
  pin,
  nombre,
  origen,
  aplicadoPor,
  onRestado,
  className = "",
}: QuitarPuntosPanelProps) {
  const [puntos, setPuntos] = useState<Record<string, unknown>>({});
  const [etiquetas, setEtiquetas] = useState<Record<string, string>>({});
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(fechaHoyInput);
  const [motivo, setMotivo] = useState("");
  const [motivoDetalle, setMotivoDetalle] = useState("");
  const [guardando, setGuardando] = useState(false);

  const recargar = useCallback(() => {
    if (!pin.trim()) return;
    const ref = doc(db, "calificacionesConquis", pin.trim());
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setPuntos({});
        setEtiquetas({});
        return;
      }
      const data = snap.data();
      setPuntos((data.puntos as Record<string, unknown>) || {});
      setEtiquetas((data.etiquetasActividades as Record<string, string>) || {});
    });
  }, [pin]);

  useEffect(() => {
    const unsub = recargar();
    return () => unsub?.();
  }, [recargar]);

  const totalActual = sumarPuntos(puntos, etiquetas);

  const handleQuitar = async () => {
    if (!pin.trim()) {
      toast.error("Selecciona una persona primero.");
      return;
    }
    const qty = parseInt(cantidad, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Indica cuántos puntos quitar.");
      return;
    }
    if (!motivo) {
      toast.error("Selecciona un motivo.");
      return;
    }
    if (
      !window.confirm(
        `¿Quitar ${qty} pts del total de ${nombre || "esta persona"}?\n\nTotal actual: ${totalActual} pts.\nMotivo: ${MOTIVOS_RESTA_PUNTOS.find((m) => m.id === motivo)?.label ?? motivo}`
      )
    ) {
      return;
    }

    setGuardando(true);
    try {
      const res = await aplicarRestaPuntos({
        pin: pin.trim(),
        nombre: nombre.trim() || "Sin nombre",
        cantidad: qty,
        fecha,
        motivo,
        motivoDetalle: motivoDetalle.trim() || undefined,
        origen,
        aplicadoPor,
      });
      if (!res.ok) {
        toast.error(res.mensaje);
        return;
      }
      toast.success(
        `Se quitaron ${qty} pts. Nuevo total: ${res.totalPuntos} pts.`
      );
      setCantidad("");
      setMotivoDetalle("");
      onRestado?.();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la resta en Firebase.");
    } finally {
      setGuardando(false);
    }
  };

  if (!pin.trim()) return null;

  return (
    <div
      className={`rounded-2xl border border-red-200 bg-red-50/60 p-4 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <MinusCircle className="h-5 w-5 text-red-600" />
        <h3 className="font-bold text-red-900">Quitar puntos</h3>
      </div>
      <p className="mb-3 text-xs text-red-800/90">
        Se resta del total general (las categorías no se modifican). Queda registrado en
        Firebase con motivo; ranking y dashboard se actualizan al instante.
      </p>

      {totalActual <= 0 ? (
        <p className="text-sm text-slate-600">Esta persona no tiene puntos en el total aún.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Total actual:{" "}
            <span className="text-indigo-700">{totalActual} pts</span>
          </p>
          <label className="text-sm font-semibold text-slate-700">
            Puntos a quitar
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              placeholder="Cantidad"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Fecha
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Motivo
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="">— Seleccionar —</option>
              {MOTIVOS_RESTA_PUNTOS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {(motivo === "otro" || motivo) && (
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Detalle {motivo === "otro" ? "(obligatorio)" : "(opcional)"}
              <textarea
                value={motivoDetalle}
                onChange={(e) => setMotivoDetalle(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Breve explicación..."
              />
            </label>
          )}
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={guardando}
              onClick={handleQuitar}
              className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Confirmar resta de puntos"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
