/** Navegación fiable en iPhone/Safari y PWA (router.push a veces no redirige). */
export function irARuta(url: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(url);
}

export function esDispositivoIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
