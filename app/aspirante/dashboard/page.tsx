import React, { Suspense } from "react";
import AspiranteDashboard from "../dashboard";

export const dynamic = "force-dynamic";

export default function AspiranteDashboardPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>}>
      <AspiranteDashboard />
    </Suspense>
  );
}
