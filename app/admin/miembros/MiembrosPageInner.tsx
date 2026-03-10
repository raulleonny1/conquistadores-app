"use client";

import { useSearchParams } from "next/navigation";
import MiembroDashboard from "./dashboard";

export default function MiembrosPageInner() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";

  // Siempre mostrar el dashboard con un PIN fijo para admin
  const adminPin = pin || "1844"; // PIN por defecto para admin

  return <MiembroDashboard miembroId={adminPin} />;
}
