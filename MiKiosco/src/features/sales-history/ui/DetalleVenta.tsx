import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { Venta } from "@/shared/types/venta";

export function DetalleVenta({ venta }: { venta: Venta }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Detalle de venta</h3>
        <span className="text-sm text-slate-500">{venta.sincronizada ? "Sincronizada" : "Pendiente"}</span>
      </div>

      <div className="space-y-2">
        {venta.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span>
              {item.cantidad}x {item.productoNombre}
            </span>
            <span>{formatearPesos(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 text-right text-lg font-bold">
        {formatearPesos(venta.total)}
      </div>
    </div>
  );
}
