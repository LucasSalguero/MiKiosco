"use client";

import { useMemo, useState, type ReactElement } from "react";
import { categoriasPresentes, filtrarProductos } from "@/features/sales/lib/filtrar-productos";
import { formatearPesos } from "@/shared/lib/moneda";
import type { CategoriaProducto, Producto } from "@/shared/types/producto";

export function GrillaProductos({
  productos,
  onSeleccionar,
}: {
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
}): ReactElement {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<CategoriaProducto | null>(null);
  const categorias = useMemo(() => categoriasPresentes(productos), [productos]);
  const visibles = useMemo(
    () => filtrarProductos(productos, { categoria, busqueda }),
    [busqueda, categoria, productos],
  );
  return (
    <section aria-labelledby="productos-titulo">
      <div className="encabezado-productos">
        <div>
          <h2 id="productos-titulo">Productos</h2>
          <p>Ordenados alfabéticamente</p>
        </div>
        <label className="buscador">
          <span className="sr-only">Buscar producto por nombre o marca</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre o marca"
          />
        </label>
      </div>
      {categorias.length > 1 ? (
        <div className="chips-categorias" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className="chip-categoria"
            aria-pressed={categoria === null}
            onClick={() => setCategoria(null)}
          >
            Todas
          </button>
          {categorias.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className="chip-categoria"
              aria-pressed={categoria === opcion.valor}
              onClick={() => setCategoria(categoria === opcion.valor ? null : opcion.valor)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      ) : null}
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
              {producto.marca ? <small className="producto-marca">{producto.marca}</small> : null}
              <strong>{formatearPesos(producto.precio)}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
