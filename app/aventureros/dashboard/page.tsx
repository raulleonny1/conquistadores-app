export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AventurerosDashboard from "./AventurerosDashboard";

export default function AventurerosDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-amber-950 text-amber-100">
          Cargando…
        </div>
      }
    >
      <AventurerosDashboard />
    </Suspense>
  );
}
