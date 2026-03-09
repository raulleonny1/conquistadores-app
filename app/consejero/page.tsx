"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ConsejeroPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const consejeroId = searchParams.get("consejeroId");

  useEffect(() => {
    if (consejeroId) {
      router.replace(`/consejero/${consejeroId}`);
    }
  }, [consejeroId, router]);

  return null;
}
