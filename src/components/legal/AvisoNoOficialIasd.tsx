import Link from "next/link";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AvisoNoOficialIasdProps = {
  variant?: "bar" | "card" | "inline";
  className?: string;
  /** Ruta a la que regresa el lector desde /aviso-legal */
  volverHref?: string;
};

const TEXTO_CORTO =
  "ConquisApp no es un sitio oficial de la Iglesia Adventista del Séptimo Día (IASD).";

const TEXTO_LARGO =
  "Esta plataforma es una herramienta independiente, creada por particulares para apoyar la gestión de clubes del ministerio joven. No está afiliada, avalada ni administrada por la IASD ni por ninguna de sus divisiones, uniones o asociaciones. Los emblemas del ministerio joven se muestran con fines informativos; son propiedad de sus titulares oficiales.";

export default function AvisoNoOficialIasd({
  variant = "bar",
  className,
  volverHref = "/",
}: AvisoNoOficialIasdProps) {
  if (variant === "bar") {
    return (
      <div
        role="note"
        aria-label="Aviso legal: sitio no oficial de la IASD"
        className={cn(
          "border-b border-amber-500/30 bg-amber-950/90 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-100/90 backdrop-blur-sm",
          className
        )}
      >
        <p className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-1.5 gap-y-1 font-medium">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
          <span>
            <strong className="font-bold text-amber-200">Aviso importante:</strong>{" "}
            {TEXTO_CORTO} Herramienta independiente para clubes del ministerio joven.
          </span>
          <Link
            href={`/aviso-legal?volver=${encodeURIComponent(volverHref)}`}
            className="font-bold text-amber-300 underline underline-offset-2 hover:text-amber-100"
          >
            Leer más
          </Link>
        </p>
      </div>
    );
  }

  if (variant === "card") {
    const href = `/aviso-legal?volver=${encodeURIComponent(volverHref)}`;
    return (
      <Link
        href={href}
        role="note"
        aria-label="Aviso legal: sitio no oficial de la IASD"
        className={cn(
          "group flex items-center justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-4 backdrop-blur-sm transition-colors hover:border-amber-400/50 hover:bg-amber-500/15",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Info className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <p className="text-sm font-black text-amber-200">
            No es un sitio oficial de la IASD
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-300/80 group-hover:text-amber-200">
          Leer aviso
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <p
      role="note"
      className={cn("text-xs leading-relaxed text-amber-200/70", className)}
    >
      {TEXTO_CORTO} {TEXTO_LARGO}
    </p>
  );
}
