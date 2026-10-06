import assert from "node:assert/strict";
import test from "node:test";

import { calcularSaldo } from "@/features/fiados/lib/calcular-saldo";

test("calcularSaldo suma créditos no anulados y resta pagos activos con precisión de centavos", () => {
  assert.equal(
    calcularSaldo(
      [
        { total: 10.1, estadoPago: "A_COBRAR_HOY", anulada: false },
        { total: 20.25, estadoPago: "FIADA", anulada: false },
        { total: 99, estadoPago: "FIADA", anulada: true },
        { total: 50, estadoPago: "PAGADA", anulada: false },
      ],
      [
        { monto: 5.15, anulado: false },
        { monto: 10, anulado: true },
      ],
    ),
    25.2,
  );
});
