import assert from "node:assert/strict";
import test from "node:test";

import {
  esClaveOperacion,
  resolverMovimientoIdempotente,
  validarCierreCaja,
  validarMovimientoCaja,
} from "@/features/cash-register/lib/validar-caja";

test("validarMovimientoCaja acepta importes con hasta 2 decimales y limpia el motivo", () => {
  assert.deepEqual(validarMovimientoCaja("EGRESO", 1234.5, "  Pago  a proveedor "), {
    ok: true,
    data: { tipo: "EGRESO", montoCentavos: 123_450, motivo: "Pago a proveedor" },
  });
  assert.equal(validarMovimientoCaja("RETIRO", 0.1, "x").ok, true);
});

test("validarMovimientoCaja rechaza tipo, monto o motivo inválidos", () => {
  const casos: Array<[unknown, unknown, unknown]> = [
    ["GASTO", 10, "x"],
    ["EGRESO", 0, "x"],
    ["EGRESO", -5, "x"],
    ["EGRESO", 10.005, "x"],
    ["EGRESO", Number.NaN, "x"],
    ["EGRESO", "10", "x"],
    ["EGRESO", 10_000_000_000, "x"],
    ["EGRESO", 10, "   "],
    ["EGRESO", 10, "a".repeat(161)],
  ];
  for (const [tipo, monto, motivo] of casos) {
    assert.equal(
      validarMovimientoCaja(tipo, monto, motivo).ok,
      false,
      JSON.stringify([tipo, monto]),
    );
  }
});

test("validarCierreCaja exige fecha válida no futura e importes no negativos", () => {
  assert.deepEqual(
    validarCierreCaja(
      { fecha: "2026-10-02", fondoInicial: 0, efectivoContado: 1500.25, observaciones: " ok " },
      "2026-10-02",
    ),
    {
      ok: true,
      data: {
        fecha: "2026-10-02",
        fondoInicialCentavos: 0,
        efectivoContadoCentavos: 150_025,
        observaciones: "ok",
      },
    },
  );

  const casos: unknown[] = [
    null,
    { fecha: "2026-10-03", fondoInicial: 0, efectivoContado: 0 },
    { fecha: "2026-02-30", fondoInicial: 0, efectivoContado: 0 },
    { fecha: "2026-10-02", fondoInicial: -1, efectivoContado: 0 },
    { fecha: "2026-10-02", fondoInicial: 0, efectivoContado: 1.001 },
    { fecha: "2026-10-02", fondoInicial: 0, efectivoContado: 0, observaciones: "a".repeat(501) },
  ];
  for (const datos of casos) {
    assert.equal(validarCierreCaja(datos, "2026-10-02").ok, false, JSON.stringify(datos));
  }
});

test("resolverMovimientoIdempotente detecta reintentos y claves reutilizadas", () => {
  const movimiento = { tipo: "RETIRO" as const, montoCentavos: 5_000, motivo: "Dueño" };
  assert.equal(resolverMovimientoIdempotente(movimiento, { ...movimiento }), "repetido");
  assert.equal(
    resolverMovimientoIdempotente(movimiento, { ...movimiento, montoCentavos: 5_001 }),
    "conflicto",
  );
  assert.equal(
    resolverMovimientoIdempotente(movimiento, { ...movimiento, tipo: "EGRESO" }),
    "conflicto",
  );
  assert.equal(esClaveOperacion("0b0f8f5e-3a7c-4b8e-9b1a-2f3c4d5e6f70"), true);
  assert.equal(esClaveOperacion("no-es-uuid"), false);
});
