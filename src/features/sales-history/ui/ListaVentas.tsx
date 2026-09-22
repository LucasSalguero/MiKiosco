import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { Venta } from "@/shared/types/venta";

export function ListaVentas({ ventas }: { ventas: Venta[] }): ReactElement {
  return (
    <div className="space-y-3">
      {ventas.length === 0 ? (
        <p className="text-sm text-slate-500">No hay ventas para este día.</p>
      ) : (
        ventas.map((venta) => (
          <div key={venta.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{new Date(venta.fecha).toLocaleString("es-AR")}</span>
              <span className="font-semibold">{formatearPesos(venta.total)}</span>
            </div>
            <div className="mt-2 space-y-1">
              {venta.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-slate-600">
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
