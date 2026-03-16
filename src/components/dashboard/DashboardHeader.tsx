import React from "react";

export type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export default function DashboardHeader({
  title,
  subtitle,
  actions,
  icon,
  className = "",
}: DashboardHeaderProps) {
  return (
    <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/60 shadow-sm">{icon}</div>}
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-slate-600 mt-1">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
