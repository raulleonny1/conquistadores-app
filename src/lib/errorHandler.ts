export function handleError(error: unknown, userMessage?: string) {
  console.error("Error del sistema:", error);

  // Si estamos en el cliente, mostrar una notificación toast para el usuario.
  if (typeof window !== "undefined") {
    import("react-hot-toast").then(({ toast }) => {
      toast.error(userMessage ?? "Ocurrió un error. Revisa la consola para más detalles.");
    });
  }
}
