export const dynamic = "force-dynamic";

import { Suspense } from "react";
import PadresDashboard from "./PadresDashboard";

export default function PadresDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sky-950 text-sky-100">
          Cargando…
        </div>
      }
    >
      <PadresDashboard />
    </Suspense>
  );
}
