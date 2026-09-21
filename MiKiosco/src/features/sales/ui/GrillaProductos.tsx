"use client";

import type { ReactElement } from "react";

import { Boton } from "@/shared/ui/Boton";
import type { Producto } from "@/shared/types/producto";

export function GrillaProductos({
  productos,
  onSeleccionar,
}: {
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {productos.map((producto) => (
        <Boton
          key={producto.id}
          variant="secundario"
          onClick={() => onSeleccionar(producto)}
          className="flex h-full min-h-[72px] flex-col items-start justify-between text-left"
        >
          <span className="text-base font-semibold">{producto.nombre}</span>
          <span className="text-sm">${producto.precio.toFixed(2)}</span>
        </Boton>
      ))}
    </div>
  );
}
