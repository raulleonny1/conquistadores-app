export const dynamic = "force-dynamic";

import { Suspense } from "react";
import JADashboard from "./JADashboard";

export default function JaDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-violet-950 text-violet-100">
          Cargando…
        </div>
      }
    >
      <JADashboard />
    </Suspense>
  );
}
