import fs from "fs";

const p = "app/admin/especialidades-en-curso/page.tsx";
const lines = fs.readFileSync(p, "utf8").split("\n");

const start = lines.findIndex((l) => l.includes("{miembrosUnidad.length} con especialidad"));
const end = lines.findIndex((l, i) => i > start && l.trim() === "</section>" && lines[i + 1]?.includes(");"));

if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `                            <p className="text-xs text-slate-500">
                              {espsUnidad.length} especialidad
                              {espsUnidad.length === 1 ? "" : "es"} en curso
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                          {espsUnidad.length}
                        </span>
                      </button>

                      {abierta && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                          <div className="space-y-3">
                            {espsUnidad.map((esp) => {
                              const clave = claveEspecialidad(esp);
                              const { estado: estadoUnidad, mixta: estadoMixto } =
                                estadoComunUnidadEsp(miembrosUnidad, clave);
                              const busyUnidad = guardandoUnidad.has(\`\${unidad}::\${clave}\`);
                              return (
                                <div
                                  key={clave}
                                  className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3"
                                >
                                  <p className="mb-1 text-sm font-bold text-indigo-900">
                                    {esp.especialidad}
                                  </p>
                                  <ResumenEspecialidad esp={esp} />
                                  <p className="mb-2 mt-2 text-xs font-semibold text-indigo-800">
                                    Estado de avance
                                  </p>
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <SelectEstado
                                      value={estadoUnidad}
                                      disabled={busyUnidad}
                                      className="sm:min-w-[220px]"
                                      onChange={(estado) =>
                                        guardarEstadoUnidad(unidad, clave, estado)
                                      }
                                    />
                                    {busyUnidad ? (
                                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-500" />
                                    ) : null}
                                  </div>
                                  {estadoMixto ? (
                                    <p className="mt-2 text-xs text-amber-700">
                                      Hay estados distintos entre miembros. Elige uno para unificar.
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Miembros
                          </p>
                          <ul className="grid gap-2 sm:grid-cols-2">
                            {miembrosVisibles.map((c) => (
                              <li
                                key={c.id}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                              >
                                <p className="font-bold text-slate-800">
                                  {[c.nombre, c.apellido].filter(Boolean).join(" ")}
                                </p>
                                <p className="text-xs text-slate-500">{c.clase || "Sin clase"}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {c.especialidadesEnCurso.map((e) => (
                                    <BadgeEstado key={claveEspecialidad(e)} estado={e.estado} />
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>`.split("\n");

const newLines = [...lines.slice(0, start), ...replacement, ...lines.slice(end + 1)];
fs.writeFileSync(p, newLines.join("\n"), "utf8");
console.log("patched", start, end);
