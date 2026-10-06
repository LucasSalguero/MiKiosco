import assert from "node:assert/strict";
import test from "node:test";

import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import type { ItemNuevaVenta } from "@/shared/types/venta";

test("calcularTotalVenta suma importes en centavos sin error binario", () => {
  const items: ItemNuevaVenta[] = [
    { productoId: 1, productoNombre: "Caramelo", cantidad: 3, precioUnitario: 0.1 },
    { productoId: 2, productoNombre: "Galletita", cantidad: 1, precioUnitario: 0.2 },
  ];

  assert.equal(calcularTotalVenta(items), 0.5);
});

test("calcularTotalVenta redondea cada precio a dos decimales", () => {
  const items: ItemNuevaVenta[] = [
    { productoId: 1, productoNombre: "Alfajor", cantidad: 3, precioUnitario: 10.235 },
  ];

  assert.equal(calcularTotalVenta(items), 30.72);
});
