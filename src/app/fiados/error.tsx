"use client";

export default function FiadosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="pantalla-estado pantalla-error" role="alert">
      <h1>No se pudieron cargar los fiados</h1>
      <p>Revisá la conexión e intentá de nuevo.</p>
      <button className="boton boton--primario" type="button" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
