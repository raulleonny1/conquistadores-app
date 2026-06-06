export const dynamic = "force-dynamic";

import { Suspense } from "react";
import RegistroConquisPageInner from "./RegistroConquisPageInner";

export default function RegistroConquisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07060f] text-white">
          Cargando…
        </div>
      }
    >
      <RegistroConquisPageInner />
    </Suspense>
  );
}
