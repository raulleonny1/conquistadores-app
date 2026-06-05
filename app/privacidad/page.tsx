import { Suspense } from "react";
import { Globe, Lock, Shield } from "lucide-react";
import VolverAtras from "@/src/components/legal/VolverAtras";

export const metadata = {
  title: "Política de privacidad — ConquisApp",
  description:
    "Cómo ConquisApp trata los datos de clubes y miembros del ministerio joven en todo el mundo.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#07060f] text-white">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <Suspense fallback={null}>
          <VolverAtras etiqueta="Volver" />
        </Suspense>

        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-2xl bg-sky-500/20 p-3">
            <Shield className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Política de privacidad</h1>
            <p className="mt-1 text-sm text-white/50">
              Última actualización: {new Date().toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-white/75">
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-bold text-amber-200">Aviso previo</p>
            <p className="mt-2">
              ConquisApp <strong>no es un sitio oficial</strong> de la Iglesia
              Adventista del Séptimo Día (IASD). Es una herramienta independiente
              operada por particulares.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Globe className="h-5 w-5 text-sky-400" />
              Alcance internacional
            </h2>
            <p className="mt-3">
              Esta aplicación está disponible para <strong>cualquier club del
              ministerio joven en el mundo</strong> que desee registrarse y
              utilizarla. No limitamos el acceso por país. Cada club es
              responsable de cumplir las leyes de protección de datos que apliquen
              en su jurisdicción (por ejemplo, consentimiento parental para
              menores, derechos de acceso o eliminación de datos, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Qué datos recopilamos</h2>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                <strong>Datos del club:</strong> nombre, ciudad, país, responsable,
                correo, WhatsApp, programas habilitados y PIN de administrador.
              </li>
              <li>
                <strong>Datos de miembros y líderes:</strong> nombres, edad, fecha
                de nacimiento, unidad, clase, contactos, PIN de acceso, calificaciones
                y actividades.
              </li>
              <li>
                <strong>Archivos subidos:</strong> fichas médicas, firmas digitales
                u otros documentos que el club o sus miembros carguen voluntariamente.
              </li>
              <li>
                <strong>Datos técnicos:</strong> información básica del navegador,
                almacenamiento local (por ejemplo, identificador del club en sesión)
                y registros necesarios para el funcionamiento del servicio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Lock className="h-5 w-5 text-violet-400" />
              Cómo usamos y almacenamos los datos
            </h2>
            <p className="mt-3">
              Los datos se almacenan en servicios en la nube de{" "}
              <strong>Google Firebase</strong>, que pueden procesar información en
              servidores ubicados fuera de tu país. Usamos la información únicamente
              para operar la plataforma: registro de clubes, acceso por PIN,
              calificaciones, calendarios, rankings y funciones similares.
            </p>
            <p className="mt-3">
              <strong>No vendemos ni alquilamos</strong> datos personales a terceros
              con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Responsabilidad de cada club</h2>
            <p className="mt-3">
              Cada club registrado actúa como responsable de los datos que ingresa
              sobre sus miembros. Debes obtener los consentimientos necesarios
              (especialmente para menores), informar a padres y consejeros, y usar
              la plataforma de forma ética y conforme a la ley local.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Seguridad</h2>
            <p className="mt-3">
              El acceso actual se basa en <strong>PIN numérico</strong> y no
              reemplaza autenticación avanzada. No ingreses información
              extremadamente sensible si tu club no ha evaluado los riesgos. Protege
              los PIN de administrador y de los miembros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Tus derechos</h2>
            <p className="mt-3">
              Según tu país, puedes tener derecho a acceder, corregir o solicitar la
              eliminación de tus datos. Contacta primero al{" "}
              <strong>administrador de tu club</strong>; también puedes escribir al
              correo de contacto indicado al registrar el club.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Menores de edad</h2>
            <p className="mt-3">
              La plataforma está pensada para ministerios juveniles que incluyen
              niños y adolescentes. Los clubes deben contar con autorización parental
              o del representante legal cuando la ley lo exija, y limitar la
              publicación de datos personales al mínimo necesario.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black text-white">Cambios a esta política</h2>
            <p className="mt-3">
              Podemos actualizar esta política para reflejar cambios en la
              plataforma. La fecha de actualización aparecerá al inicio de esta
              página. El uso continuado del servicio implica la aceptación de la
              versión vigente.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs text-white/50">
              Al registrarte o usar ConquisApp, confirmas que has leído esta
              política y que tu club asume la responsabilidad del tratamiento de
              datos de sus miembros conforme a la legislación aplicable.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
