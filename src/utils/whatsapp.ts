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

export function mensajePinAventurero(data: {
  nombre: string;
  apellido?: string;
  pin: string;
  clase?: string;
  club?: string;
}): string {
  const nombreCompleto = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
  const lineas = [`Hola ${nombreCompleto}, tu PIN de Aventureros es ${data.pin}.`];
  if (data.clase) lineas.push(`Clase: ${data.clase}.`);
  if (data.club) lineas.push(`Club: ${data.club}.`);
  lineas.push("Los padres pueden ver tu avance en el portal /padres con este PIN.");
  return lineas.join(" ");
}

export function mensajePinJA(data: {
  nombre: string;
  apellido?: string;
  pin: string;
  clase?: string;
  grupo?: string;
}): string {
  const nombreCompleto = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
  const lineas = [`Hola ${nombreCompleto}, tu PIN de Jóvenes Adventistas es ${data.pin}.`];
  if (data.clase) lineas.push(`Clase: ${data.clase}.`);
  if (data.grupo) lineas.push(`Grupo: ${data.grupo}.`);
  lineas.push("Los padres pueden ver tu avance en el portal /padres con este PIN.");
  return lineas.join(" ");
}

export function mensajePinAspirante(data: {
  nombre: string;
  apellido?: string;
  pin: string;
  asociacion?: string;
  cargo?: string;
}): string {
  const nombreCompleto = [data.nombre, data.apellido].filter(Boolean).join(" ").trim();
  const lineas = [
    `Hola ${nombreCompleto}, tu PIN de acceso como aspirante a Guía Mayor es ${data.pin}.`,
  ];
  if (data.asociacion) lineas.push(`Asociación / Misión: ${data.asociacion}.`);
  if (data.cargo) lineas.push(`Cargo: ${data.cargo}.`);
  lineas.push("Guarda este PIN para ingresar a la app del club.");
  return lineas.join(" ");
}
