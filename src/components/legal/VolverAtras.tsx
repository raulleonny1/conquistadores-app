"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type VolverAtrasProps = {
  etiqueta?: string;
  fallback?: string;
};

export default function VolverAtras({
  etiqueta = "Volver",
  fallback = "/",
}: VolverAtrasProps) {
  const params = useSearchParams();
  const destino = params.get("volver") || fallback;
  const seguro = destino.startsWith("/") && !destino.startsWith("//") ? destino : fallback;

  return (
    <Link
      href={seguro}
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {etiqueta}
    </Link>
  );
}
