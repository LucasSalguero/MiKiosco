"use client";

import type { ReactElement } from "react";

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
  return (
    <div className="space-y-2">
      {productos.map((producto) => (
        <div
          key={producto.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
        >
          <button
            type="button"
            onClick={() => onSeleccionar(producto)}
            className="flex min-h-[44px] flex-1 items-center justify-between text-left"
          >
            <span>{producto.nombre}</span>
            <span className="font-medium">${producto.precio.toFixed(2)}</span>
          </button>
          {onDesactivar ? (
            <Boton variant="peligro" onClick={() => {
              if (window.confirm(`¿Desactivar ${producto.nombre}? Ya no aparecerá para vender.`)) onDesactivar(producto.id);
            }} className="px-3 py-2 text-sm">
              Desactivar
            </Boton>
          ) : null}
        </div>
      ))}
    </div>
  );
}
