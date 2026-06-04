"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../src/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getCategoriasEnHistorial, toNumberPuntos } from "@/src/lib/categoriasPuntos";

type RegistroHistorial = {
  fecha?: string;
  puntos?: Record<string, unknown>;
  tipo?: string;
  motivo?: string;
  motivoTexto?: string;
  catalogoNombre?: string;
};

type HistorialSemanalProps = {
  pin?: string;
};

export default function HistorialSemanal({ pin: pinProp }: HistorialSemanalProps) {
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
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
      const lista = snap.docs.map((d) => d.data() as RegistroHistorial);
      lista.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
      setHistorial(lista);
    };
    fetchHistorial();
  }, [pin]);

  const columnas = getCategoriasEnHistorial(historial);

  if (!pin) return null;

  if (historial.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8">
        <h3 className="text-lg font-bold mb-2">Historial de puntos</h3>
        <p className="text-slate-400 text-sm">Sin movimientos registrados.</p>
      </div>
    );
  }

  if (columnas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-8">
        <h3 className="text-lg font-bold mb-2">Historial de puntos</h3>
        <p className="text-slate-400 text-sm">Hay registros pero sin puntos en categorías.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 mt-8">
      <h3 className="text-lg font-bold mb-2">Historial de puntos</h3>
      <div className="overflow-x-auto">
        <table className="min-w-[400px] w-full border text-xs md:text-sm">
          <thead>
            <tr>
              <th className="border p-2">Fecha</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Motivo</th>
              {columnas.map((cat) => (
                <th key={cat.id} className="border p-2">
                  {cat.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {historial.map((reg, idx) => {
              const esResta = reg.tipo === "resta";
              const motivo =
                reg.motivoTexto ||
                (reg.motivo ? reg.motivo : "") ||
                (esResta ? "" : reg.catalogoNombre || "Suma");
              return (
                <tr key={idx} className={esResta ? "bg-red-50/80" : ""}>
                  <td className="border p-2">{reg.fecha}</td>
                  <td
                    className={`border p-2 font-semibold ${
                      esResta ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {esResta ? "Resta" : "Suma"}
                  </td>
                  <td className="border p-2 max-w-[140px] text-xs text-slate-600">
                    {motivo || "—"}
                  </td>
                  {columnas.map((cat) => {
                    const val = toNumberPuntos(reg.puntos?.[cat.id]);
                    if (!val) {
                      return (
                        <td key={cat.id} className="border p-2" />
                      );
                    }
                    return (
                      <td
                        key={cat.id}
                        className={`border p-2 font-bold ${
                          esResta ? "text-red-700" : "text-slate-800"
                        }`}
                      >
                        {esResta ? `−${val}` : `+${val}`}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
