/** Solo `true` explícito permite al consejero sumar puntos / calificar. Admin siempre puede. */
export function consejeroPuedeCalificar(
  data: { puedeCalificar?: boolean } | null | undefined
): boolean {
  return data?.puedeCalificar === true;
}
