"use client";

import { useSyncExternalStore } from "react";

function suscribirseConexion(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function obtenerEstadoConexion(): boolean {
  return navigator.onLine;
}

function obtenerEstadoConexionServidor(): boolean {
  return true;
}

export function useEstadoConexion(): { enLinea: boolean } {
  const enLinea = useSyncExternalStore(
    suscribirseConexion,
    obtenerEstadoConexion,
    obtenerEstadoConexionServidor,
  );
  return { enLinea };
}
