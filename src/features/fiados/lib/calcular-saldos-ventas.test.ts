import assert from "node:assert/strict";
import test from "node:test";

import { calcularSaldosVentas } from "@/features/fiados/lib/calcular-saldos-ventas";

test("asigna pagos generales a las ventas más antiguas sin duplicar pagos asociados", () => {
  const saldos = calcularSaldosVentas(
    [
      {
        id: 2,
        fecha: "2026-05-02T12:00:00.000Z",
        total: "8.00",
        pagosAsociados: [],
      },
      {
        id: 1,
        fecha: "2026-05-01T12:00:00.000Z",
        total: "10.00",
        pagosAsociados: ["2.50"],
      },
    ],
    ["5.50"],
  );

  assert.equal(saldos.get(1), 2);
  assert.equal(saldos.get(2), 8);
});

test("un pago general puede dejar una venta de hoy sin saldo pendiente", () => {
  const saldos = calcularSaldosVentas(
    [
      {
        id: 4,
        fecha: "2026-05-02T12:00:00.000Z",
        total: "12.75",
        pagosAsociados: [],
      },
    ],
    ["12.75"],
  );

  assert.equal(saldos.get(4), 0);
});
