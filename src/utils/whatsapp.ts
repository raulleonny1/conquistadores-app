/** Número internacional sin "+" para wa.me (Ecuador: 09… → 593…) */
export function formatWhatsapp(num: string): string {
  if (!num) return "";
  let n = num.replace(/\D/g, "");
  if (n.startsWith("09")) {
    return "593" + n.slice(1);
  }
  if (n.startsWith("593")) {
    return n;
  }
  if (n.startsWith("0") && n.length > 1) {
    return "593" + n.slice(1);
  }
  return n;
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const formatted = formatWhatsapp(phone);
  if (!formatted) return "";
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}

export function mensajePinConquistador(data: {
  nombre: string;
  apellido?: string;
  pin: string;
  unidad?: string;
  consejero?: string;
  clase?: string;
}): string {
  const nombreCompleto = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
  const lineas = [`Hola ${nombreCompleto}, tu PIN de acceso es ${data.pin}.`];
  if (data.unidad) lineas.push(`Unidad: ${data.unidad}.`);
  if (data.consejero) lineas.push(`Consejero: ${data.consejero}.`);
  if (data.clase) lineas.push(`Clase: ${data.clase}.`);
  return lineas.join(" ");
}
