export const dynamic = "force-dynamic";

import { Suspense } from "react";
import RegistroConquisPageInner from "./RegistroConquisPageInner";

export default function RegistroConquisPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegistroConquisPageInner />
    </Suspense>
  );
}
