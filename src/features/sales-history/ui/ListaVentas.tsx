import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { Venta } from "@/shared/types/venta";

export function ListaVentas({ ventas }: { ventas: Venta[] }): ReactElement {
  return (
    <div className="lista-ventas">
      {ventas.length === 0 ? (
        <p className="estado-vacio">No hay ventas para este día.</p>
      ) : (
        ventas.map((venta) => (
          <div key={venta.id} className="fila-venta">
            <div className="fila-venta__cabecera">
              <span className="fila-venta__fecha">
                {new Date(venta.fecha).toLocaleString("es-AR")}
              </span>
              <span className="fila-venta__total">{formatearPesos(venta.total)}</span>
            </div>
            <div className="fila-venta__items">
              {venta.items.map((item) => (
                <div key={item.id} className="fila-venta__item">
                  <span>
                    {item.cantidad}x {item.productoNombre}
                  </span>
                  <span>{formatearPesos(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
