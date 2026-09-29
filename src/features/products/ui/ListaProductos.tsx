"use client";

import { useState, type ReactElement } from "react";

import { Boton } from "@/shared/ui/Boton";
import { ConfirmarAccion } from "@/shared/ui/ConfirmarAccion";
import type { Producto } from "@/shared/types/producto";

export function ListaProductos({
  productos,
  onSeleccionar,
  onDesactivar,
  onReactivar,
}: {
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
  onDesactivar?: (id: number) => Promise<void> | void;
  onReactivar?: (id: number) => void;
}): ReactElement {
  const [productoPorDesactivar, setProductoPorDesactivar] = useState<Producto | null>(null);
  const [desactivando, setDesactivando] = useState(false);

  const confirmarDesactivacion = async () => {
    if (!productoPorDesactivar || !onDesactivar) return;
    setDesactivando(true);
    await onDesactivar(productoPorDesactivar.id);
    setDesactivando(false);
    setProductoPorDesactivar(null);
  };

  return (
    <>
      <div className="lista-productos">
        {productos.map((producto) => (
          <div key={producto.id} className="producto-administrable">
            <button
              type="button"
              onClick={() => onSeleccionar(producto)}
              className="producto-administrable__seleccion"
              aria-label={`Editar ${producto.nombre}`}
            >
              <span>{producto.nombre}</span>
              <span className="producto-administrable__precio">${producto.precio.toFixed(2)}</span>
            </button>
            {producto.activo && onDesactivar ? (
              <Boton variant="peligro" onClick={() => setProductoPorDesactivar(producto)}>
                Desactivar
              </Boton>
            ) : null}
            {!producto.activo && onReactivar ? (
              <Boton variant="secundario" onClick={() => onReactivar(producto.id)}>
                Reactivar
              </Boton>
            ) : null}
          </div>
        ))}
      </div>
      <ConfirmarAccion
        abierto={Boolean(productoPorDesactivar)}
        titulo="Desactivar producto"
        mensaje={
          productoPorDesactivar
            ? `¿Querés desactivar ${productoPorDesactivar.nombre}? No aparecerá en la pantalla de venta.`
            : ""
        }
        textoConfirmar="Desactivar"
        confirmando={desactivando}
        alConfirmar={() => void confirmarDesactivacion()}
        alCancelar={() => setProductoPorDesactivar(null)}
      />
    </>
  );
}
