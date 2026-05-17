"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  CATEGORIAS_PUNTOS,
  getCategoriasEnHistorial,
  toNumberPuntos,
} from "@/src/lib/categoriasPuntos";

type HistorialSemanalProps = {
  pin?: string;
};

export default function HistorialSemanal({ pin: pinProp }: HistorialSemanalProps) {
  const [historial, setHistorial] = useState<{ fecha?: string; puntos?: Record<string, unknown> }[]>([]);
  const [pin, setPin] = useState(pinProp || "");

  useEffect(() => {
    if (pinProp) {
      setPin(pinProp);
      return;
    }
    if (typeof window !== "undefined") {
      setPin(new URLSearchParams(window.location.search).get("pin") || "");
    }
  }, [pinProp]);

  useEffect(() => {
    if (!pin) return;
    const fetchHistorial = async () => {
      const q = query(collection(db, "calificacionesSemanal"), where("pin", "==", pin));
      const snap = await getDocs(q);
      setHistorial(snap.docs.map((d) => d.data()));
    };
    fetchHistorial();
  }, [pin]);

  const columnas = getCategoriasEnHistorial(historial);

  if (!pin) return null;

  if (historial.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8">
        <h3 className="text-lg font-bold mb-2">Historial semanal</h3>
        <p className="text-slate-400 text-sm">Sin movimientos de puntos registrados.</p>
      </div>
    );
  }

  if (columnas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8">
        <h3 className="text-lg font-bold mb-2">Historial semanal</h3>
        <p className="text-slate-400 text-sm">Hay registros pero sin puntos en categorías.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 mt-8">
      <h3 className="text-lg font-bold mb-2">Historial semanal</h3>
      <div className="overflow-x-auto">
        <table className="min-w-[400px] w-full border text-xs md:text-sm">
          <thead>
            <tr>
              <th className="border p-2">Fecha</th>
              {columnas.map((cat) => (
                <th key={cat.id} className="border p-2">
                  {cat.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historial.map((reg, idx) => (
              <tr key={idx}>
                <td className="border p-2">{reg.fecha}</td>
                {columnas.map((cat) => (
                  <td key={cat.id} className="border p-2">
                    {toNumberPuntos(reg.puntos?.[cat.id]) || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
