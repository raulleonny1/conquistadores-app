"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MiembroDashboard from "./dashboard";

function MiembrosPageInner() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  if (!pin) {
    return <div className="text-center mt-10 text-lg text-red-700">No se proporcionó PIN.</div>;
  }
  return <MiembroDashboard />;
}

export default function MiembrosPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
      <MiembrosPageInner />
    </Suspense>
  );
}
