import React from "react";
import DashboardHeader, { DashboardHeaderProps } from "./DashboardHeader";

export type DashboardLayoutProps = {
  header: Omit<DashboardHeaderProps, "className">;
  children: React.ReactNode;
  className?: string;
};

export default function DashboardLayout({ header, children, className = "" }: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 px-4 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <DashboardHeader {...header} />
        <main className="mt-10">{children}</main>
      </div>
    </div>
  );
}
