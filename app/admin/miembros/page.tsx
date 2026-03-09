export const dynamic = "force-dynamic";

import { Suspense } from "react";
import MiembrosPageInner from "./MiembrosPageInner";

export default function MiembrosPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MiembrosPageInner />
    </Suspense>
  );
}