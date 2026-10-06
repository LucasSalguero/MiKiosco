import assert from "node:assert/strict";
import test from "node:test";

import { calcularIngresosDelDia } from "@/features/daily-summary/lib/calcular-ingresos";

test("calcularIngresosDelDia excluye fiados hasta que se registra un pago", () => {
  const ventas = [
    { total: 100, estadoPago: "PAGADA" as const },
    { total: 75.5, estadoPago: "FIADA" as const },
    { total: 20, estadoPago: "A_COBRAR_HOY" as const },
  ];

  assert.equal(calcularIngresosDelDia(ventas, []), 100);
  assert.equal(calcularIngresosDelDia(ventas, [25.25]), 125.25);
});
