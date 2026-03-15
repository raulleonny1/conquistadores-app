"use client";

import CompletarRegistroAspirante from '../../../src/components/CompletarRegistroAspirante';

export default function CompletarRegistroAspirantePage() {
  // Obtener el pin de la URL
  let pin = "";
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    pin = params.get("pin") || "";
  }
  // Renderizar el componente compartido
  return <CompletarRegistroAspirante pin={pin} />;
}
