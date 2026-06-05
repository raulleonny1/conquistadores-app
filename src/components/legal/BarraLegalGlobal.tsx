"use client";

import { usePathname } from "next/navigation";
import AvisoNoOficialIasd from "@/src/components/legal/AvisoNoOficialIasd";
import AvisoPrivacidad from "@/src/components/legal/AvisoPrivacidad";

/** Barras legales visibles en todas las páginas (con enlace a leer más). */
export default function BarraLegalGlobal() {
  const pathname = usePathname();
  const volver = pathname || "/";

  return (
    <div className="shrink-0">
      <AvisoNoOficialIasd variant="bar" volverHref={volver} />
      <AvisoPrivacidad variant="bar" volverHref={volver} />
    </div>
  );
}
