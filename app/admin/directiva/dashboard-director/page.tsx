"use client";
import DashboardDirector from '../dashboard-director';
import { Suspense } from 'react';

export default function DashboardDirectorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DashboardDirector />
    </Suspense>
  );
}
