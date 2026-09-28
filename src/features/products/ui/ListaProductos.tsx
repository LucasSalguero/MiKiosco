"use client";

import { useState, type ReactElement } from "react";

import { Boton } from "@/shared/ui/Boton";
import type { Producto } from "@/shared/types/producto";

export function ListaProductos({
  productos,
  onSeleccionar,
  onDesactivar,
}: {
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
  onDesactivar?: (id: number) => void;
}): ReactElement {
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  return (
    <div className="lista-productos">
      {productos.map((producto) => (
        <div key={producto.id} className="producto-administrable">
          <button
            type="button"
            onClick={() => onSeleccionar(producto)}
            className="producto-administrable__seleccion"
          >
            <span>{producto.nombre}</span>
            <span className="producto-administrable__precio">${producto.precio.toFixed(2)}</span>
          </button>
          {onDesactivar ? (
            confirmandoId === producto.id ? (
              <div
                className="confirmacion-desactivar"
                role="group"
                aria-label={`Desactivar ${producto.nombre}`}
              >
                <span>¿Desactivar?</span>
                <Boton
                  variant="peligro"
                  onClick={() => {
                    onDesactivar(producto.id);
                    setConfirmandoId(null);
                  }}
                >
                  Confirmar
                </Boton>
                <Boton variant="secundario" onClick={() => setConfirmandoId(null)}>
                  Cancelar
                </Boton>
              </div>
            ) : (
              <Boton variant="peligro" onClick={() => setConfirmandoId(producto.id)}>
                Desactivar
              </Boton>
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}
