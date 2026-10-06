import assert from "node:assert/strict";
import test from "node:test";

import { resolverPagoIdempotente } from "@/features/fiados/lib/resolver-pago-idempotente";

test("registrarPago resuelve un reintento idéntico como el mismo pago", () => {
  const pagoExistente = {
    id: 18,
    clienteFiadoId: 3,
    monto: 12.5,
    medio: "TRANSFERENCIA",
    ventaId: null,
  };

  assert.equal(
    resolverPagoIdempotente(pagoExistente, {
      clienteFiadoId: 3,
      monto: 12.5,
      medio: "TRANSFERENCIA",
      ventaId: null,
    }),
    "repetido",
  );
  assert.equal(
    resolverPagoIdempotente(pagoExistente, {
      clienteFiadoId: 3,
      monto: 13,
      medio: "TRANSFERENCIA",
      ventaId: null,
    }),
    "conflicto",
  );
});
