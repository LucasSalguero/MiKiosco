import assert from "node:assert/strict";
import test from "node:test";

import {
  arqueoAPesos,
  calcularArqueo,
  type MovimientoArqueo,
  type PagoArqueo,
  type VentaArqueo,
} from "@/features/cash-register/lib/calcular-arqueo";
import { calcularDiferencia } from "@/features/cash-register/lib/calcular-diferencia";

const pagada = (
  totalCentavos: number,
  medioPago: VentaArqueo["medioPago"],
  anulada = false,
): VentaArqueo => ({ totalCentavos, estadoPago: "PAGADA", medioPago, anulada });

test("día sin ventas: todo en cero y el esperado es el fondo inicial", () => {
  const arqueo = calcularArqueo({
    ventas: [],
    pagos: [],
    movimientos: [],
    fondoInicialCentavos: 5000,
  });

  assert.deepEqual(arqueo, {
    vendido: 0,
    cobrado: 0,
    cobradoEfectivo: 0,
    cobradoTransferencia: 0,
    cobradoDesconocido: 0,
    fiadoNuevo: 0,
    ingresos: 0,
    egresos: 0,
    retiros: 0,
    fondoInicial: 5000,
    efectivoEsperado: 5000,
    cantidadVentas: 0,
    cantidadAnuladas: 0,
    ticketPromedio: 0,
  });
});

test("separa lo cobrado por medio y suma los pagos de fiados del día", () => {
  const ventas: VentaArqueo[] = [
    pagada(10_000, "EFECTIVO"),
    pagada(2_550, "TRANSFERENCIA"),
    pagada(700, "DESCONOCIDO"),
    pagada(300, null),
    { totalCentavos: 4_000, estadoPago: "FIADA", medioPago: null, anulada: false },
    { totalCentavos: 1_000, estadoPago: "A_COBRAR_HOY", medioPago: null, anulada: false },
  ];
  const pagos: PagoArqueo[] = [
    { montoCentavos: 1_500, medio: "EFECTIVO", anulado: false },
    { montoCentavos: 2_000, medio: "TRANSFERENCIA", anulado: false },
    { montoCentavos: 999, medio: "EFECTIVO", anulado: true },
  ];

  const arqueo = calcularArqueo({ ventas, pagos, movimientos: [], fondoInicialCentavos: 0 });

  assert.equal(arqueo.cobradoEfectivo, 11_500);
  assert.equal(arqueo.cobradoTransferencia, 4_550);
  assert.equal(arqueo.cobradoDesconocido, 1_000, "DESCONOCIDO y medio nulo van a desconocido");
  assert.equal(arqueo.cobrado, 17_050);
  assert.equal(arqueo.fiadoNuevo, 5_000);
  assert.equal(arqueo.vendido, 18_550);
  assert.equal(arqueo.cantidadVentas, 6);
  assert.equal(arqueo.efectivoEsperado, 11_500, "lo desconocido no entra al efectivo esperado");
});

test("excluye ventas anuladas pero las cuenta aparte", () => {
  const arqueo = calcularArqueo({
    ventas: [pagada(1_000, "EFECTIVO"), pagada(50_000, "EFECTIVO", true)],
    pagos: [],
    movimientos: [],
    fondoInicialCentavos: 0,
  });

  assert.equal(arqueo.vendido, 1_000);
  assert.equal(arqueo.cobradoEfectivo, 1_000);
  assert.equal(arqueo.cantidadVentas, 1);
  assert.equal(arqueo.cantidadAnuladas, 1);
});

test("efectivo esperado: fondo + efectivo + ingresos − egresos − retiros, sin anulados", () => {
  const movimientos: MovimientoArqueo[] = [
    { tipo: "INGRESO", montoCentavos: 2_000, anulado: false },
    { tipo: "EGRESO", montoCentavos: 3_000, anulado: false },
    { tipo: "RETIRO", montoCentavos: 5_000, anulado: false },
    { tipo: "EGRESO", montoCentavos: 99_999, anulado: true },
    { tipo: "INGRESO", montoCentavos: 77_777, anulado: true },
  ];
  const arqueo = calcularArqueo({
    ventas: [pagada(20_000, "EFECTIVO"), pagada(9_000, "TRANSFERENCIA")],
    pagos: [{ montoCentavos: 1_000, medio: "EFECTIVO", anulado: false }],
    movimientos,
    fondoInicialCentavos: 10_000,
  });

  assert.equal(arqueo.ingresos, 2_000);
  assert.equal(arqueo.egresos, 3_000);
  assert.equal(arqueo.retiros, 5_000);
  assert.equal(arqueo.efectivoEsperado, 10_000 + 20_000 + 1_000 + 2_000 - 3_000 - 5_000);
});

test("ticket promedio redondea al centavo y los importes pasan a pesos sin error", () => {
  const arqueo = calcularArqueo({
    ventas: [pagada(1_000, "EFECTIVO"), pagada(1_000, "EFECTIVO"), pagada(1_001, "EFECTIVO")],
    pagos: [],
    movimientos: [],
    fondoInicialCentavos: 0,
  });
  // 3001 / 3 = 1000,33… → 1000
  assert.equal(arqueo.ticketPromedio, 1_000);

  const mitad = calcularArqueo({
    ventas: [pagada(1, "EFECTIVO"), pagada(2, "EFECTIVO")],
    pagos: [],
    movimientos: [],
    fondoInicialCentavos: 0,
  });
  // 3 / 2 = 1,5 → 2 (mitades hacia arriba)
  assert.equal(mitad.ticketPromedio, 2);

  const decimales = calcularArqueo({
    ventas: [pagada(10, "EFECTIVO"), pagada(20, "EFECTIVO")],
    pagos: [],
    movimientos: [],
    fondoInicialCentavos: 0,
  });
  const enPesos = arqueoAPesos(decimales);
  assert.equal(enPesos.cobradoEfectivo, 0.3);
  assert.equal(enPesos.cantidadVentas, 2);
});

test("calcularDiferencia distingue exacto, faltante y sobrante", () => {
  assert.deepEqual(calcularDiferencia(10_000, 10_000), { diferencia: 0, estado: "exacto" });
  assert.deepEqual(calcularDiferencia(9_950, 10_000), { diferencia: -50, estado: "faltante" });
  assert.deepEqual(calcularDiferencia(10_100, 10_000), { diferencia: 100, estado: "sobrante" });
});
