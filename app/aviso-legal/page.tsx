import { Suspense } from "react";
import { AlertTriangle, Info } from "lucide-react";
import VolverAtras from "@/src/components/legal/VolverAtras";

export const metadata = {
  title: "Aviso legal — ConquisApp",
  description:
    "ConquisApp no es un sitio oficial de la Iglesia Adventista del Séptimo Día (IASD).",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-[#07060f] text-white">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Suspense fallback={null}>
          <VolverAtras etiqueta="Volver" />
        </Suspense>

        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/20 p-3">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">
              No es un sitio oficial de la IASD
            </h1>
            <p className="mt-1 text-sm text-white/50">Aviso legal</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-white/75">
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <p>
                <strong className="text-amber-200">ConquisApp</strong> no es un sitio
                oficial de la Iglesia Adventista del Séptimo Día (IASD).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">¿Qué es esta plataforma?</h2>
            <p className="mt-3">
              Es una herramienta <strong>independiente</strong>, creada por particulares
              para apoyar la gestión de clubes del ministerio joven (Conquistadores,
              Aventureros, Jóvenes Adventistas y programas afines).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Sin afiliación oficial</h2>
            <p className="mt-3">
              No está afiliada, avalada ni administrada por la IASD ni por ninguna de sus
              divisiones, uniones, asociaciones, misiones o iglesias locales. El uso de
              esta plataforma no implica respaldo institucional de la iglesia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Emblemas y marcas</h2>
            <p className="mt-3">
              Los emblemas del ministerio joven que se muestran en la interfaz tienen
              fines <strong>informativos y de identificación</strong> de los programas.
              Son propiedad de sus titulares oficiales (por ejemplo, División
              Interamericana / Mundo J.A.). Esta app no los comercializa ni los modifica
              con fines distintos a la orientación del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Responsabilidad del usuario</h2>
            <p className="mt-3">
              Cada club que se registra es responsable de cómo usa la plataforma, de los
              datos que ingresa y del cumplimiento de las normas de su campo eclesiástico
              y de las leyes de su país.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
