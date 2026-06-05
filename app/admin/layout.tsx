import { Suspense } from "react";
import ClubGuard from "@/src/components/club/ClubGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          Cargando panel…
        </div>
      }
    >
      <ClubGuard loginHref="/login/club">{children}</ClubGuard>
    </Suspense>
  );
}
