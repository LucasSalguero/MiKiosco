"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";

import { CabeceraPuntoVenta } from "@/features/daily-summary/ui/CabeceraPuntoVenta";
import { cargarProductos } from "@/features/products/lib/cargar-productos";
import { VentaRapida } from "@/features/sales/ui/VentaRapida";
import { Boton } from "@/shared/ui/Boton";
import type { Producto } from "@/shared/types/producto";

export function InicioPuntoVenta(): ReactElement {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [desdeCache, setDesdeCache] = useState(false);
  const [intento, setIntento] = useState(0);

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
  }, [intento]);

  return (
    <main className="punto-venta">
      <CabeceraPuntoVenta />
      {productos ? (
        <>
          {desdeCache ? <p className="aviso-cache">Catálogo guardado en este dispositivo</p> : null}
          <VentaRapida productos={productos} />
          {!productos.length ? (
            <section className="estado-vacio-productos">
              <h2>Cargá tu primer producto</h2>
              <p>Agregá productos para empezar a registrar ventas.</p>
              <Link href="/productos" className="boton boton--primario enlace-boton">
                Ir a Productos
              </Link>
            </section>
          ) : null}
        </>
      ) : error ? (
        <section className="pantalla-estado pantalla-error" role="alert">
          <p>{error}</p>
          <Boton
            onClick={() => {
              setError(null);
              setProductos(null);
              setIntento((actual) => actual + 1);
            }}
          >
            Reintentar
          </Boton>
        </section>
      ) : (
        <section className="pantalla-estado" role="status">
          Cargando productos…
        </section>
      )}
    </main>
  );
}
