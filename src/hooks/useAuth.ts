import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí iría la lógica de autenticación (ejemplo: Firebase Auth)
    // setUser(usuario);
    setLoading(false);
  }, []);

  return { user, loading };
}
