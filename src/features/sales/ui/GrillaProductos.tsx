"use client";

import { useMemo, useState, type ReactElement } from "react";
import { formatearPesos } from "@/shared/lib/moneda";
import type { Producto } from "@/shared/types/producto";

export function GrillaProductos({
  productos,
  onSeleccionar,
}: {
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
}): ReactElement {
  const [busqueda, setBusqueda] = useState("");
  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-AR");
    const filtrados = termino
      ? productos.filter((producto) => producto.nombre.toLocaleLowerCase("es-AR").includes(termino))
      : productos;
    return [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));
  }, [busqueda, productos]);
  return (
    <section aria-labelledby="productos-titulo">
      <div className="encabezado-productos">
        <div>
          <h2 id="productos-titulo">Productos</h2>
          <p>Ordenados alfabéticamente</p>
        </div>
        <label className="buscador">
          <span className="sr-only">Buscar producto</span>
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar"
          />
        </label>
      </div>
      {visibles.length === 0 ? (
        <p className="estado-vacio">No encontramos ese producto. Probá con otro nombre.</p>
      ) : (
        <div className="grilla-productos">
          {visibles.map((producto) => (
            <button
              key={producto.id}
              type="button"
              onClick={() => onSeleccionar(producto)}
              className="tarjeta-producto"
            >
              <span className="producto-icono" aria-hidden="true">
                □
              </span>
              <span className="producto-nombre">{producto.nombre}</span>
              <strong>{formatearPesos(producto.precio)}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
