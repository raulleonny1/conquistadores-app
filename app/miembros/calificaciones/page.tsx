import React, { Suspense } from "react";
import CalificacionesClient from "./CalificacionesClient";

export default function CalificacionesPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>}>
      <CalificacionesClient />
    </Suspense>
  );
}
