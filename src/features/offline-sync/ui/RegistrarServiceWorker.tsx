"use client";

import { useEffect } from "react";

export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      console.error("offline-sync.registrarServiceWorker", error);
    });
  }, []);

  return null;
}
