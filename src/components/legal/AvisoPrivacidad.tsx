import Link from "next/link";
import { ArrowRight, Globe, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type AvisoPrivacidadProps = {
  variant?: "bar" | "card" | "inline";
  className?: string;
  showLink?: boolean;
  volverHref?: string;
};

const TEXTO_CORTO =
  "Plataforma abierta a clubes de todo el mundo. Al usarla, aceptas el tratamiento de datos descrito en nuestra política de privacidad.";

const TEXTO_LARGO =
  "ConquisApp está disponible para cualquier club del ministerio joven que desee registrarse, sin importar el país. Los datos del club y de sus miembros (nombres, contactos, PIN de acceso, calificaciones, fichas médicas y archivos que subas) se almacenan en servicios en la nube (Firebase/Google). Cada club es responsable de la información que registra sobre sus miembros, especialmente menores de edad, y debe contar con el consentimiento que exija la ley de su país. No vendemos tus datos. El acceso por PIN no sustituye medidas de seguridad avanzadas: usa la plataforma con responsabilidad.";

export default function AvisoPrivacidad({
  variant = "bar",
  className,
  showLink = true,
  volverHref = "/",
}: AvisoPrivacidadProps) {
  const enlace = showLink ? (
    <Link
      href={`/privacidad?volver=${encodeURIComponent(volverHref)}`}
      className="font-bold underline underline-offset-2 hover:opacity-80"
    >
      Leer más
    </Link>
  ) : (
    <span className="font-bold">Leer más</span>
  );

  if (variant === "bar") {
    return (
      <div
        role="note"
        aria-label="Aviso de privacidad"
        className={cn(
          "border-b border-sky-500/25 bg-sky-950/90 px-4 py-2.5 text-center text-xs leading-relaxed text-sky-100/90 backdrop-blur-sm",
          className
        )}
      >
        <p className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-1.5 font-medium">
          <Globe className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden />
          <span>
            <strong className="font-bold text-sky-200">Privacidad:</strong> Abierta a
            clubes de todo el mundo. {enlace}
          </span>
        </p>
      </div>
    );
  }

  if (variant === "card") {
    const href = `/privacidad?volver=${encodeURIComponent(volverHref)}`;
    return (
      <Link
        href={href}
        role="note"
        aria-label="Aviso de privacidad"
        className={cn(
          "group flex items-center justify-between gap-3 rounded-2xl border border-sky-500/35 bg-sky-500/10 px-5 py-4 backdrop-blur-sm transition-colors hover:border-sky-400/50 hover:bg-sky-500/15",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-sky-400" aria-hidden />
          <p className="text-sm font-black text-sky-200">
            Privacidad y uso internacional
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-sky-300/80 group-hover:text-sky-200">
          Leer política
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <p
      role="note"
      className={cn("text-xs leading-relaxed text-sky-200/70", className)}
    >
      {TEXTO_CORTO} {TEXTO_LARGO}
    </p>
  );
}
