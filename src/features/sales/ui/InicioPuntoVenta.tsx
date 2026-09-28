"use client";

import { useEffect, useState, type ReactElement } from "react";

import { CabeceraPuntoVenta } from "@/features/daily-summary/ui/CabeceraPuntoVenta";
import { cargarProductos } from "@/features/products/lib/cargar-productos";
import { VentaRapida } from "@/features/sales/ui/VentaRapida";
import type { Producto } from "@/shared/types/producto";

export function InicioPuntoVenta(): ReactElement {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [desdeCache, setDesdeCache] = useState(false);

  useEffect(() => {
    let activo = true;

    void cargarProductos()
      .then((resultado) => {
        if (!activo) return;
        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }
        setProductos(resultado.data.productos);
        setDesdeCache(resultado.data.origen === "cache");
      })
      .catch((cargaError: unknown) => {
        console.error("sales.InicioPuntoVenta", cargaError);
        if (activo) setError("No se pudieron cargar los productos.");
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <main className="punto-venta">
      <CabeceraPuntoVenta />
      {productos ? (
        <>
          {desdeCache ? <p className="aviso-cache">Catálogo guardado en este dispositivo</p> : null}
          <VentaRapida productos={productos} />
        </>
      ) : error ? (
        <section className="pantalla-estado pantalla-error" role="alert">
          {error}
        </section>
      ) : (
        <section className="pantalla-estado" role="status">
          Cargando productos…
        </section>
      )}
    </main>
  );
}
