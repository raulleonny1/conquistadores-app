"use client";

import React from "react";
import { Camera, FileUp, FileText } from "lucide-react";

const ACCEPT_ARCHIVOS =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

type FichaMedicaUploadProps = {
  archivoSeleccionado: File | null;
  onArchivoChange: (file: File | null) => void;
  urlActual?: string;
  nombreActual?: string;
};

export default function FichaMedicaUpload({
  archivoSeleccionado,
  onArchivoChange,
  urlActual,
  nombreActual,
}: FichaMedicaUploadProps) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onArchivoChange(file);
    e.target.value = "";
  };

  return (
    <div className="md:col-span-2 flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <label className="text-sm font-semibold text-slate-700">
        Ficha médica <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-slate-500">
        PDF, Word o imagen. Puedes elegir un archivo o tomar foto con la cámara del celular.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-50">
          <FileUp size={18} />
          Subir archivo
          <input
            type="file"
            className="hidden"
            accept={ACCEPT_ARCHIVOS}
            onChange={handleFile}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-50">
          <Camera size={18} />
          Tomar foto
          <input
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
          />
        </label>
      </div>
      {archivoSeleccionado && (
        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
          <FileText size={16} />
          Listo para subir: {archivoSeleccionado.name}
        </p>
      )}
      {!archivoSeleccionado && urlActual && (
        <a
          href={urlActual}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 underline font-medium"
        >
          Ver ficha actual{nombreActual ? `: ${nombreActual}` : ""}
        </a>
      )}
    </div>
  );
}
