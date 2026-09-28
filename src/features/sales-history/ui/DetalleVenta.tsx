import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { Venta } from "@/shared/types/venta";

export function DetalleVenta({ venta }: { venta: Venta }): ReactElement {
  return (
    <div className="detalle-venta">
      <div className="detalle-venta__cabecera">
        <h3>Detalle de venta</h3>
        <span>{venta.sincronizada ? "Sincronizada" : "Pendiente"}</span>
      </div>

      <div className="detalle-venta__items">
        {venta.items.map((item) => (
          <div key={item.id} className="detalle-venta__item">
            <span>
              {item.cantidad}x {item.productoNombre}
            </span>
            <span>{formatearPesos(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="detalle-venta__total">{formatearPesos(venta.total)}</div>
    </div>
  );
}
