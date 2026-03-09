"use client";
import { useSearchParams } from "next/navigation";
import MiembroDashboard from "./dashboard";

export default function MiembrosPage() {
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  if (!pin) {
    return <div className="text-center mt-10 text-lg text-red-700">No se proporcionó PIN.</div>;
  }
  return <MiembroDashboard miembroId={pin} />;
}
