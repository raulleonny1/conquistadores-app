"use client";
import ConsejeroDashboard from "../dashboard";
import { useParams } from "next/navigation";

export default function ConsejeroIdPage() {
  const params = useParams();
  const consejeroId = params?.consejeroId as string | undefined;

  if (!consejeroId) {
    return <div className="text-center mt-10 text-lg text-red-700">No se proporcionó ID de consejero.</div>;
  }

  return <ConsejeroDashboard consejeroId={consejeroId} />;
}
