"use client";

import type { ReactElement } from "react";

import { Boton } from "@/shared/ui/Boton";
import type { ItemNuevaVenta } from "@/shared/types/venta";
import { formatearPesos } from "@/shared/lib/moneda";

export function CarritoVenta({
  items,
  total,
  onCambiarCantidad,
  onQuitar,
  onCobrar,
}: {
  items: ItemNuevaVenta[];
  total: number;
  onCambiarCantidad: (productoId: number, cantidad: number) => void;
  onQuitar: (productoId: number) => void;
  onCobrar: () => void;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Carrito</h3>
        <span className="text-sm text-slate-600">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay productos en el carrito.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productoId} className="flex items-center gap-2 rounded-xl bg-white p-2">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{item.productoNombre}</p>
                <p className="text-sm text-slate-500">{formatearPesos(item.precioUnitario)} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCambiarCantidad(item.productoId, item.cantidad - 1)}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 bg-slate-100 text-lg"
                >
                  -
                </button>
                <span className="min-w-[24px] text-center font-medium">{item.cantidad}</span>
                <button
                  type="button"
                  onClick={() => onCambiarCantidad(item.productoId, item.cantidad + 1)}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 bg-slate-100 text-lg"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => onQuitar(item.productoId)}
                className="min-h-[44px] rounded-lg border border-red-200 px-3 text-sm text-red-700"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="text-lg font-semibold text-slate-800">Total</span>
        <span className="text-xl font-bold text-slate-900">{formatearPesos(total)}</span>
      </div>

      <Boton onClick={onCobrar} className="mt-4 w-full">
        Cobrar {formatearPesos(total)}
      </Boton>
    </div>
  );
}
