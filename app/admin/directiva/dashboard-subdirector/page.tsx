"use client";
import SubdirectorDashboard from "../dashboard-subdirector";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SubdirectorDashboard />
    </Suspense>
  );
}
