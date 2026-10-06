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
        <span>{venta.sincronizada ? "En el servidor" : "Pendiente de sincronizar"}</span>
      </div>
      <p className="etiqueta-pendiente">
        {venta.estadoPago === "PAGADA"
          ? "Cobrada"
          : venta.saldoPendiente <= 0
            ? "Fiado cobrado"
            : venta.estadoPago === "A_COBRAR_HOY"
              ? `A cobrar hoy · saldo ${formatearPesos(venta.saldoPendiente)}`
              : `Cuenta mensual · saldo ${formatearPesos(venta.saldoPendiente)}`}
        {venta.estadoPago !== "PAGADA" && venta.clienteNombre ? ` · ${venta.clienteNombre}` : ""}
      </p>
      {venta.autorizadaPor ? <p>Autorizó: {venta.autorizadaPor}</p> : null}

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
