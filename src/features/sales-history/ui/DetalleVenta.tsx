import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import { Boton } from "@/shared/ui/Boton";
import type { Venta } from "@/shared/types/venta";

export function DetalleVenta({
  venta,
  onAnular,
}: {
  venta: Venta;
  onAnular?: () => void;
}): ReactElement {
  return (
    <div className={`detalle-venta${venta.anulada ? " detalle-venta--anulada" : ""}`}>
      <div className="detalle-venta__cabecera">
        <h3>Detalle de venta</h3>
        <span>{venta.sincronizada ? "Sincronizada" : "Pendiente"}</span>
      </div>
      {venta.tipoPago === "FIADO" ? (
        <p className="etiqueta-pendiente">
          {venta.clienteNombre ? `Fiado de ${venta.clienteNombre}` : "Fiado"} · pendiente{" "}
          {formatearPesos(venta.saldoPendiente)}
        </p>
      ) : null}

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
      {onAnular && !venta.anulada ? (
        <Boton variant="peligro" onClick={onAnular}>
          Anular venta
        </Boton>
      ) : null}
    </div>
  );
}
