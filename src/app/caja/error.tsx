"use client";

export default function CajaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="pantalla-estado pantalla-error" role="alert">
      <h1>No se pudo cargar la caja</h1>
      <p>Revisá la conexión e intentá de nuevo.</p>
      <button className="boton boton--primario" type="button" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
