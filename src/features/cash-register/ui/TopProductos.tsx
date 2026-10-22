import type { ReactElement } from "react";

import { formatearCantidad, formatearPesos } from "@/shared/lib/moneda";
import type { ProductoVendido } from "@/shared/types/caja";

export function TopProductos({ productos }: { productos: ProductoVendido[] }): ReactElement {
  return (
    <section className="seccion-caja" aria-labelledby="top-productos-titulo">
      <h2 id="top-productos-titulo">Más vendidos</h2>
      {productos.length === 0 ? (
        <p className="estado-vacio">Todavía no hay ventas este día.</p>
      ) : (
        <ol className="top-productos">
          {productos.map((producto) => (
            <li key={producto.clave}>
              <span className="top-productos__nombre">{producto.nombre}</span>
              <span className="top-productos__cantidad">
                {formatearCantidad(producto.cantidad)} u.
              </span>
              <strong>{formatearPesos(producto.importe)}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
