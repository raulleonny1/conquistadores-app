"use client";
import ConsejeroDashboard from "./dashboard";
import { useSearchParams } from "next/navigation";

export default function ConsejeroPage() {
  const searchParams = useSearchParams();
  const consejeroId = searchParams.get("consejeroId");

  if (!consejeroId) {
    return <div className="text-center mt-10 text-lg text-red-700">No se proporcionó ID de consejero.</div>;
  }

  return <ConsejeroDashboard consejeroId={consejeroId} />;
}
