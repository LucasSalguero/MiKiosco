"use client";

import { useEffect, useState } from "react";

export function useEstadoConexion(): { enLinea: boolean } {
  const [enLinea, setEnLinea] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const manejarOnline = () => setEnLinea(true);
    const manejarOffline = () => setEnLinea(false);

    window.addEventListener("online", manejarOnline);
    window.addEventListener("offline", manejarOffline);

    return () => {
      window.removeEventListener("online", manejarOnline);
      window.removeEventListener("offline", manejarOffline);
    };
  }, []);

  return { enLinea };
}
