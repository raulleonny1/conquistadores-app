"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsappUrl } from "@/src/utils/whatsapp";

type BotonNotificarPadresProps = {
  whatsapp: string;
  mensaje: string;
  label?: string;
  className?: string;
  compacto?: boolean;
};

export default function BotonNotificarPadres({
  whatsapp,
  mensaje,
  label = "Notificar padres",
  className = "",
  compacto = false,
}: BotonNotificarPadresProps) {
  const url = buildWhatsappUrl(whatsapp, mensaje);
  if (!url) return null;

  if (compacto) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        className={`inline-flex rounded-lg p-2 text-green-600 hover:bg-green-50 ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
