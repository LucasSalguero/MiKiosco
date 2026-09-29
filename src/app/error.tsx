"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app.errorBoundary", error);
  }, [error]);

  return (
    <main className="punto-venta">
      <section className="pantalla-estado pantalla-error" role="alert">
        <h1>No se pudo cargar Mi Kiosco</h1>
        <p>No pudimos cargar esta pantalla. Probá de nuevo.</p>
        <button className="boton boton--primario" type="button" onClick={reset}>
          Reintentar
        </button>
      </section>
    </main>
  );
}
