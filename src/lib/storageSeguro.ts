/** localStorage falla en modo privado de Safari/iOS; no debe romper el login. */
export function storageSeguroSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    /* ignorar */
  }
}

export function storageSeguroGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
